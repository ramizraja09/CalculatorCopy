
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, Download } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const taxData = {
  2024: {
    brackets: {
      single: [ { rate: 0.10, from: 0, to: 11600 }, { rate: 0.12, from: 11601, to: 47150 }, { rate: 0.22, from: 47151, to: 100525 }, { rate: 0.24, from: 100526, to: 191950 }, { rate: 0.32, from: 191951, to: 243725 }, { rate: 0.35, from: 243726, to: 609350 }, { rate: 0.37, from: 609351, to: Infinity } ],
      married_jointly: [ { rate: 0.10, from: 0, to: 23200 }, { rate: 0.12, from: 23201, to: 94300 }, { rate: 0.22, from: 94301, to: 201050 }, { rate: 0.24, from: 201051, to: 383900 }, { rate: 0.32, from: 383901, to: 487450 }, { rate: 0.35, from: 487451, to: 731200 }, { rate: 0.37, from: 731201, to: Infinity } ],
    },
    standardDeduction: { single: 14600, married_jointly: 29200 },
    childTaxCredit: 2000,
    otherDependentCredit: 500,
  }
};
const FICA_RATES = { socialSecurity: { rate: 0.062, limit: 168600 }, medicare: { rate: 0.0145 } };
const payPeriods = { annually: 1, monthly: 12, 'bi-weekly': 26, weekly: 52 };
const PIE_COLORS = ['hsl(var(--chart-2))', 'hsl(var(--destructive))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

const formSchema = z.object({
  grossIncome: z.number().min(1, 'Gross income is required'),
  filingStatus: z.enum(['single', 'married_jointly']),
  payFrequency: z.enum(['annually', 'monthly', 'bi-weekly', 'weekly']),
  childrenUnder17: z.number().int().min(0).default(0),
  otherDependents: z.number().int().min(0).default(0),
  preTaxDeductions: z.number().min(0, 'Deductions must be non-negative'),
});

type FormData = z.infer<typeof formSchema>;

export default function PaycheckCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, reset } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      grossIncome: 80000,
      filingStatus: 'single',
      payFrequency: 'bi-weekly',
      childrenUnder17: 0,
      otherDependents: 0,
      preTaxDeductions: 6000,
    },
  });
  
  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const calculatePay = (data: FormData) => {
    const { grossIncome, filingStatus, payFrequency, preTaxDeductions, childrenUnder17, otherDependents } = data;
    
    // FICA taxes are based on gross income
    const socialSecurityTax = Math.min(grossIncome, FICA_RATES.socialSecurity.limit) * FICA_RATES.socialSecurity.rate;
    const medicareTax = grossIncome * FICA_RATES.medicare.rate;
    const totalFicaTax = socialSecurityTax + medicareTax;

    const adjustedGrossIncome = grossIncome - preTaxDeductions;
    const deduction = taxData[2024].standardDeduction[filingStatus];
    const taxableIncome = Math.max(0, adjustedGrossIncome - deduction);
    
    const brackets = taxData[2024].brackets[filingStatus];
    let federalTax = 0;
    brackets.forEach(bracket => {
      if (taxableIncome > bracket.from) {
        const incomeInBracket = Math.min(taxableIncome, bracket.to) - bracket.from;
        federalTax += incomeInBracket * bracket.rate;
      }
    });
    
    const childTaxCredit = childrenUnder17 * taxData[2024].childTaxCredit;
    const otherDependentCredit = otherDependents * taxData[2024].otherDependentCredit;
    const totalCredits = childTaxCredit + otherDependentCredit;
    
    const finalFederalTax = Math.max(0, federalTax - totalCredits);
    
    const totalTax = totalFicaTax + finalFederalTax;
    const netIncome = grossIncome - totalTax - preTaxDeductions;
    const periods = payPeriods[payFrequency];
    
    const perPeriod = (val: number) => val / periods;

    setResults({
      grossPay: perPeriod(grossIncome),
      netPay: perPeriod(netIncome),
      totalDeductions: perPeriod(totalTax + preTaxDeductions),
      preTaxDeductions: perPeriod(preTaxDeductions),
      federalTax: perPeriod(finalFederalTax),
      socialSecurityTax: perPeriod(socialSecurityTax),
      medicareTax: perPeriod(medicareTax),
      payFrequencyLabel: payFrequency.replace('_', '-'),
      pieData: [
        { name: 'Take-Home Pay', value: perPeriod(netIncome) },
        { name: 'Federal Tax', value: perPeriod(finalFederalTax) },
        { name: 'FICA Tax', value: perPeriod(totalFicaTax) },
        { name: 'Pre-Tax Deductions', value: perPeriod(preTaxDeductions) },
      ].filter(item => item.value > 0),
    });
    setFormData(data);
  };
  
  const handleClear = () => {
    reset();
    setResults(null);
    setFormData(null);
  };

  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    let content = '';
    const filename = `paycheck-calculation.${format}`;

    if (format === 'txt') {
        content = `Paycheck Calculation\n\nInputs:\n${Object.entries(formData).map(([k,v]) => `- ${k}: ${v}`).join('\n')}\n\nResults (per ${results.payFrequencyLabel} period):\n${Object.entries(results).filter(([k]) => !['error', 'pieData', 'payFrequencyLabel'].includes(k)).map(([k,v]) => `- ${k}: ${formatCurrency(v)}`).join('\n')}`
    } else {
        content = `Category,Value\n${Object.entries(formData).map(([k,v]) => `${k},${v}`).join('\n')}\n\nResult (per ${results.payFrequencyLabel} period),Value\n${Object.entries(results).filter(([k]) => !['error', 'pieData', 'payFrequencyLabel'].includes(k)).map(([k,v]) => `${k},${v}`).join('\n')}`
    }
    const blob = new Blob([content], { type: `text/${format}` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <form onSubmit={handleSubmit(calculatePay)} className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader><CardTitle>Your Job Income (Salary)</CardTitle></CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div><Label>Gross Income ($/year)</Label><Controller name="grossIncome" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
            <div><Label>Pay Frequency</Label><Controller name="payFrequency" control={control} render={({ field }) => ( <Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="annually">Annually</SelectItem><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="bi-weekly">Bi-Weekly</SelectItem><SelectItem value="weekly">Weekly</SelectItem></SelectContent></Select> )} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Federal Filing Status</CardTitle></CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
             <div><Label>Filing Status</Label><Controller name="filingStatus" control={control} render={({ field }) => ( <Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="single">Single</SelectItem><SelectItem value="married_jointly">Married Filing Jointly</SelectItem></SelectContent></Select> )} /></div>
            <div><Label>Children Under Age 17</Label><Controller name="childrenUnder17" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />} /></div>
            <div><Label>Other Dependents</Label><Controller name="otherDependents" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />} /></div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader><CardTitle>Deductions</CardTitle></CardHeader>
          <CardContent>
            <div><Label>Pre-Tax Deductions ($/year)</Label><Controller name="preTaxDeductions" control={control} render={({ field }) => <Input type="number" placeholder="e.g. 401k, health insurance" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="submit" className="flex-1">Calculate</Button>
          <Button type="button" variant="outline" onClick={handleClear}>Clear</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="outline" disabled={!results}><Download className="mr-2 h-4 w-4" /> Export</Button></DropdownMenuTrigger>
            <DropdownMenuContent><DropdownMenuItem onClick={() => handleExport('txt')}>Download .txt</DropdownMenuItem><DropdownMenuItem onClick={() => handleExport('csv')}>Download .csv</DropdownMenuItem></DropdownMenuContent>
          </DropdownMenu>
        </div>
      </form>
      
      <div className="lg:col-span-1 space-y-4">
        <h3 className="text-xl font-semibold">Paycheck Summary</h3>
        {results ? (
            <div className="space-y-4">
                <Card><CardHeader><CardTitle className="text-center text-3xl font-bold">{formatCurrency(results.netPay)}</CardTitle><CardDescription className="text-center font-semibold">Estimated Net {results.payFrequencyLabel} Pay</CardDescription></CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-muted-foreground">Gross Pay</span><span>{formatCurrency(results.grossPay)}</span></div>
                        <div className="flex justify-between text-destructive"><span className="pl-4">Federal Tax</span><span>-{formatCurrency(results.federalTax)}</span></div>
                        <div className="flex justify-between text-destructive"><span className="pl-4">FICA (Social Security, Medicare)</span><span>-{formatCurrency(results.socialSecurityTax + results.medicareTax)}</span></div>
                        <div className="flex justify-between text-destructive"><span className="pl-4">Pre-Tax Deductions</span><span>-{formatCurrency(results.preTaxDeductions)}</span></div>
                        <div className="flex justify-between font-bold border-t pt-2 mt-2"><span>Net Pay (Take-Home)</span><span>{formatCurrency(results.netPay)}</span></div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="text-base text-center">Paycheck Breakdown</CardTitle></CardHeader>
                    <CardContent className="h-64">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={results.pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5}>
                                    {results.pieData.map((_entry: any, index: number) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                                </Pie>
                                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                <Legend iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        ) : (
            <div className="flex items-center justify-center h-full bg-muted/50 rounded-lg border border-dashed p-8">
                <p className="text-sm text-muted-foreground text-center">Enter your salary and deductions to estimate your take-home pay.</p>
            </div>
        )}
      </div>
    </div>
  );
}
