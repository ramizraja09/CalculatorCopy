
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// 2024 Federal Tax Data (simplified)
const taxBrackets = {
  single: [
    { rate: 0.10, from: 0, to: 11600 }, { rate: 0.12, from: 11601, to: 47150 }, { rate: 0.22, from: 47151, to: 100525 }, { rate: 0.24, from: 100526, to: 191950 }, { rate: 0.32, from: 191951, to: 243725 }, { rate: 0.35, from: 243726, to: 609350 }, { rate: 0.37, from: 609351, to: Infinity },
  ],
  married_jointly: [
    { rate: 0.10, from: 0, to: 23200 }, { rate: 0.12, from: 23201, to: 94300 }, { rate: 0.22, from: 94301, to: 201050 }, { rate: 0.24, from: 201051, to: 383900 }, { rate: 0.32, from: 383901, to: 487450 }, { rate: 0.35, from: 487451, to: 731200 }, { rate: 0.37, from: 731201, to: Infinity },
  ],
};
const standardDeductions = { single: 14600, married_jointly: 29200 };
const FICA_RATES = {
  socialSecurity: { rate: 0.062, limit: 168600 },
  medicare: { rate: 0.0145 },
};

const payPeriods: { [key: string]: number } = {
  annually: 1,
  monthly: 12,
  'bi-weekly': 26,
  weekly: 52,
};

const formSchema = z.object({
  grossIncome: z.number().min(1, 'Gross income is required'),
  filingStatus: z.enum(['single', 'married_jointly']),
  payFrequency: z.enum(['annually', 'monthly', 'bi-weekly', 'weekly']),
  preTaxDeductions: z.number().min(0, 'Deductions must be non-negative'),
});

type FormData = z.infer<typeof formSchema>;

export default function SalaryCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, reset } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      grossIncome: 75000,
      filingStatus: 'single',
      payFrequency: 'bi-weekly',
      preTaxDeductions: 6000,
    },
  });
  
  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const calculatePay = (data: FormData) => {
    const { grossIncome, filingStatus, payFrequency, preTaxDeductions } = data;
    
    // FICA taxes
    const socialSecurityTax = Math.min(grossIncome, FICA_RATES.socialSecurity.limit) * FICA_RATES.socialSecurity.rate;
    const medicareTax = grossIncome * FICA_RATES.medicare.rate;
    const totalFicaTax = socialSecurityTax + medicareTax;

    // Federal tax
    const adjustedGrossIncome = grossIncome - preTaxDeductions;
    const deduction = standardDeductions[filingStatus];
    const taxableIncome = Math.max(0, adjustedGrossIncome - deduction);
    
    const brackets = taxBrackets[filingStatus];
    let federalTax = 0;
    for (const bracket of brackets) {
      if (taxableIncome > bracket.from) {
        const taxableInBracket = Math.min(taxableIncome, bracket.to) - bracket.from;
        federalTax += taxableInBracket * bracket.rate;
      }
    }
    
    const totalTax = totalFicaTax + federalTax;
    const netIncome = grossIncome - totalTax - preTaxDeductions;
    const periods = payPeriods[payFrequency];
    
    const perPeriod = (val: number) => val / periods;

    setResults({
      grossPay: perPeriod(grossIncome),
      netPay: perPeriod(netIncome),
      preTaxDeductions: perPeriod(preTaxDeductions),
      federalTax: perPeriod(federalTax),
      ficaTax: perPeriod(totalFicaTax),
      payFrequencyLabel: payFrequency.replace('_', '-'),
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
    const filename = `salary-calculation.${format}`;

    if (format === 'txt') {
      content = `Salary Calculation\n\nInputs:\n${Object.entries(formData).map(([k,v]) => `- ${k}: ${v}`).join('\n')}\n\nResults (per ${results.payFrequencyLabel} period):\n${Object.entries(results).filter(([k]) => k !== 'payFrequencyLabel').map(([k,v]) => `- ${k}: ${formatCurrency(v)}`).join('\n')}`
    } else {
      content = `Category,Value\n${Object.entries(formData).map(([k,v]) => `${k},${v}`).join('\n')}\n\nResult (per ${results.payFrequencyLabel} period),Value\n${Object.entries(results).filter(([k]) => k !== 'payFrequencyLabel').map(([k,v]) => `${k},${v}`).join('\n')}`
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
    <form onSubmit={handleSubmit(calculatePay)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs Column */}
      <div className="space-y-4">
        <Card>
          <CardHeader><CardTitle>Income & Filing</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Gross Annual Income ($)</Label><Controller name="grossIncome" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
            <div><Label>Pay Frequency</Label><Controller name="payFrequency" control={control} render={({ field }) => ( <Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="annually">Annually</SelectItem><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="bi-weekly">Bi-Weekly</SelectItem><SelectItem value="weekly">Weekly</SelectItem></SelectContent></Select> )} /></div>
            <div><Label>Filing Status</Label><Controller name="filingStatus" control={control} render={({ field }) => ( <Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="single">Single</SelectItem><SelectItem value="married_jointly">Married Filing Jointly</SelectItem></SelectContent></Select> )} /></div>
            <div><Label>Pre-Tax Deductions ($/year)</Label><Controller name="preTaxDeductions" control={control} render={({ field }) => <Input type="number" placeholder="401k, health insurance, etc." {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
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
      </div>

      {/* Results Column */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Paycheck Summary</h3>
        {results ? (
            <div className="space-y-4">
                <Card>
                    <CardHeader><CardTitle className="text-center text-3xl font-bold">{formatCurrency(results.netPay)}</CardTitle><CardDescription className="text-center font-semibold">Estimated Net {results.payFrequencyLabel} Pay</CardDescription></CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-muted-foreground">Gross Pay</span><span>{formatCurrency(results.grossPay)}</span></div>
                        <div className="flex justify-between pl-4 text-destructive"><span>Pre-Tax Deductions</span><span>-{formatCurrency(results.preTaxDeductions)}</span></div>
                        <div className="flex justify-between pl-4 text-destructive"><span>Federal Tax</span><span>-{formatCurrency(results.federalTax)}</span></div>
                        <div className="flex justify-between pl-4 text-destructive"><span>FICA Taxes</span><span>-{formatCurrency(results.ficaTax)}</span></div>
                        <div className="flex justify-between font-bold border-t pt-2 mt-2"><span>Net Pay</span><span>{formatCurrency(results.netPay)}</span></div>
                    </CardContent>
                </Card>
            </div>
        ) : (
            <div className="flex items-center justify-center h-60 bg-muted/50 rounded-lg border border-dashed p-8">
                <p className="text-sm text-muted-foreground text-center">Enter your details to estimate take-home pay.</p>
            </div>
        )}
      </div>
    </form>
  );
}
