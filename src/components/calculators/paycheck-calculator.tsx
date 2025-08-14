
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
import { Info, Download, HelpCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tooltip as ShadTooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


// 2024 Federal Tax Data (simplified)
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
  jobIncome: z.number().min(0),
  payFrequency: z.enum(['annually', 'monthly', 'bi-weekly', 'weekly']),
  filingStatus: z.enum(['single', 'married_jointly']),
  childrenUnder17: z.number().int().min(0).default(0),
  otherDependents: z.number().int().min(0).default(0),
  otherIncome: z.number().min(0).default(0),
  pretaxDeductions: z.number().min(0).default(0),
  nonWithheldDeductions: z.number().min(0).default(0),
  itemizedDeductions: z.number().min(0).default(0),
  hasMultipleJobs: z.enum(['yes', 'no']),
  stateTaxRate: z.number().min(0).max(100).default(0),
  cityTaxRate: z.number().min(0).max(100).default(0),
  isSelfEmployed: z.enum(['yes', 'no']),
});

type FormData = z.infer<typeof formSchema>;

export default function PaycheckCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, reset } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      jobIncome: 80000,
      payFrequency: 'bi-weekly',
      filingStatus: 'single',
      childrenUnder17: 0,
      otherDependents: 0,
      otherIncome: 0,
      pretaxDeductions: 6000,
      nonWithheldDeductions: 0,
      itemizedDeductions: 0,
      hasMultipleJobs: 'no',
      stateTaxRate: 0,
      cityTaxRate: 0,
      isSelfEmployed: 'no',
    },
  });
  
  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const calculatePay = (data: FormData) => {
    const grossAnnualIncome = data.jobIncome + data.otherIncome;
    
    // FICA taxes
    const selfEmploymentTax = data.isSelfEmployed === 'yes' ? (grossAnnualIncome * 0.9235) * 0.153 : 0;
    const socialSecurityTax = data.isSelfEmployed === 'no' ? Math.min(grossAnnualIncome, FICA_RATES.socialSecurity.limit) * FICA_RATES.socialSecurity.rate : 0;
    const medicareTax = data.isSelfEmployed === 'no' ? grossAnnualIncome * FICA_RATES.medicare.rate : 0;
    const totalFicaTax = selfEmploymentTax + socialSecurityTax + medicareTax;

    // Federal tax
    const adjustedGrossIncome = grossAnnualIncome - data.pretaxDeductions;
    const standardDeduction = taxData[2024].standardDeduction[data.filingStatus];
    const deduction = Math.max(standardDeduction, data.itemizedDeductions) + data.nonWithheldDeductions;
    const taxableIncome = Math.max(0, adjustedGrossIncome - deduction);
    
    const brackets = taxData[2024].brackets[data.filingStatus];
    let federalTax = 0;
    for (const bracket of brackets) {
      if (taxableIncome > bracket.from) {
        const taxableInBracket = Math.min(taxableIncome, bracket.to) - bracket.from;
        federalTax += taxableInBracket * bracket.rate;
      }
    }
    
    const childTaxCredit = data.childrenUnder17 * taxData[2024].childTaxCredit;
    const otherDependentCredit = data.otherDependents * taxData[2024].otherDependentCredit;
    const totalCredits = childTaxCredit + otherDependentCredit;
    
    const finalFederalTax = Math.max(0, federalTax - totalCredits);

    const stateTax = grossAnnualIncome * (data.stateTaxRate / 100);
    const cityTax = grossAnnualIncome * (data.cityTaxRate / 100);
    
    const totalTax = totalFicaTax + finalFederalTax + stateTax + cityTax;
    const netIncome = grossAnnualIncome - totalTax - data.pretaxDeductions - data.nonWithheldDeductions - data.itemizedDeductions;
    const periods = payPeriods[data.payFrequency];
    
    const perPeriod = (val: number) => val / periods;

    setResults({
      grossPay: perPeriod(grossAnnualIncome),
      netPay: perPeriod(netIncome),
      totalDeductions: perPeriod(totalTax + data.pretaxDeductions + data.nonWithheldDeductions + data.itemizedDeductions),
      preTaxDeductions: perPeriod(data.pretaxDeductions),
      federalTax: perPeriod(finalFederalTax),
      stateTax: perPeriod(stateTax),
      cityTax: perPeriod(cityTax),
      ficaTax: perPeriod(totalFicaTax),
      payFrequencyLabel: data.payFrequency.replace('_', '-'),
      pieData: [
        { name: 'Take-Home Pay', value: perPeriod(netIncome) },
        { name: 'Federal Tax', value: perPeriod(finalFederalTax) },
        { name: 'State/City Tax', value: perPeriod(stateTax + cityTax)},
        { name: 'FICA Tax', value: perPeriod(totalFicaTax) },
        { name: 'Deductions', value: perPeriod(data.pretaxDeductions + data.nonWithheldDeductions + data.itemizedDeductions)},
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
    <TooltipProvider>
    <div className="space-y-8">
      <form onSubmit={handleSubmit(calculatePay)} className="space-y-4">
        <Card>
          <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            
            <div className="md:col-span-2 grid grid-cols-[1fr,200px] gap-2 items-center">
                <Label>Your job income (salary)</Label>
                <div className="flex items-center">
                    <Controller name="jobIncome" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
                    <span className="text-sm text-muted-foreground ml-2">/year</span>
                </div>
            </div>

            <div className="md:col-span-2 grid grid-cols-[1fr,200px] gap-2 items-center">
                <Label>Pay frequency</Label>
                <Controller name="payFrequency" control={control} render={({ field }) => ( <Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="annually">Annually</SelectItem><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="bi-weekly">Bi-Weekly</SelectItem><SelectItem value="weekly">Weekly</SelectItem></SelectContent></Select> )} />
            </div>

            <div className="md:col-span-2 grid grid-cols-[1fr,200px] gap-2 items-center">
                <Label>File status</Label>
                <Controller name="filingStatus" control={control} render={({ field }) => ( <Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="single">Single</SelectItem><SelectItem value="married_jointly">Married Filing Jointly</SelectItem></SelectContent></Select> )} />
            </div>

            <div className="md:col-span-2 grid grid-cols-[1fr,200px] gap-2 items-center">
                <Label>Number of children under age 17</Label>
                <Controller name="childrenUnder17" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />} />
            </div>

            <div className="md:col-span-2 grid grid-cols-[1fr,200px] gap-2 items-center">
                <Label>Number of other dependents</Label>
                <Controller name="otherDependents" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />} />
            </div>

            <div className="md:col-span-2 grid grid-cols-[1fr,200px,1fr] gap-2 items-center">
                <Label>Other income (not from jobs)</Label>
                <div className="flex items-center">
                    <Controller name="otherIncome" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
                    <span className="text-sm text-muted-foreground ml-2">/year</span>
                </div>
                <p className="text-xs text-muted-foreground">interest, dividends, retirement income, etc.</p>
            </div>
            
            <div className="md:col-span-2 grid grid-cols-[1fr,200px,1fr] gap-2 items-center">
                <Label>Pretax deductions withheld</Label>
                <div className="flex items-center">
                    <Controller name="pretaxDeductions" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
                    <span className="text-sm text-muted-foreground ml-2">/year</span>
                </div>
                 <p className="text-xs text-muted-foreground">401k, health insurance, HSA, etc.</p>
            </div>

            <div className="md:col-span-2 grid grid-cols-[1fr,200px,1fr] gap-2 items-center">
                <Label className="flex items-center gap-1">Deductions not withheld <ShadTooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" className="h-4 w-4"><HelpCircle className="h-4 w-4"/></Button></TooltipTrigger><TooltipContent><p>e.g. Traditional IRA contributions</p></TooltipContent></ShadTooltip></Label>
                <div className="flex items-center">
                    <Controller name="nonWithheldDeductions" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
                    <span className="text-sm text-muted-foreground ml-2">/year</span>
                </div>
                 <p className="text-xs text-muted-foreground">IRA, student loan interest, etc.</p>
            </div>

            <div className="md:col-span-2 grid grid-cols-[1fr,200px,1fr] gap-2 items-center">
                <Label className="flex items-center gap-1">Itemized deductions <ShadTooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" className="h-4 w-4"><HelpCircle className="h-4 w-4"/></Button></TooltipTrigger><TooltipContent><p>Only enter if greater than standard deduction</p></TooltipContent></ShadTooltip></Label>
                <div className="flex items-center">
                    <Controller name="itemizedDeductions" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
                    <span className="text-sm text-muted-foreground ml-2">/year</span>
                </div>
                 <p className="text-xs text-muted-foreground">mortgage interest, charitable donations, etc.</p>
            </div>

            <div className="md:col-span-2 grid grid-cols-[1fr,200px] gap-2 items-center">
                 <Label>Has 2nd, 3rd job income?</Label>
                <Controller name="hasMultipleJobs" control={control} render={({ field }) => (<RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4 pt-2"><div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="yesJobs" /><Label htmlFor="yesJobs">Yes</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="no" id="noJobs" /><Label htmlFor="noJobs">No</Label></div></RadioGroup>)} />
            </div>

            <div className="md:col-span-2 grid grid-cols-[1fr,200px,1fr] gap-2 items-center">
                <Label>State income tax rate</Label>
                <div className="flex items-center">
                    <Controller name="stateTaxRate" control={control} render={({ field }) => <Input type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
                    <span className="text-sm text-muted-foreground ml-2">%</span>
                </div>
                <a href="#" className="text-xs text-primary hover:underline">click here to find out</a>
            </div>
             <div className="md:col-span-2 grid grid-cols-[1fr,200px] gap-2 items-center">
                <Label>City income tax rate</Label>
                <div className="flex items-center">
                    <Controller name="cityTaxRate" control={control} render={({ field }) => <Input type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
                    <span className="text-sm text-muted-foreground ml-2">%</span>
                </div>
            </div>

             <div className="md:col-span-2 grid grid-cols-[1fr,200px] gap-2 items-center">
                 <Label>Are you self-employed or an independent contractor?</Label>
                <Controller name="isSelfEmployed" control={control} render={({ field }) => (<RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4 pt-2"><div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="yesSelf" /><Label htmlFor="yesSelf">Yes</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="no" id="noSelf" /><Label htmlFor="noSelf">No</Label></div></RadioGroup>)} />
            </div>

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
      
       <div className="lg:col-span-3 space-y-4 mt-8">
        <h3 className="text-xl font-semibold">Paycheck Summary</h3>
        {results ? (
            <div className="grid md:grid-cols-2 gap-8">
              <Card>
                <CardHeader><CardTitle className="text-center text-3xl font-bold">{formatCurrency(results.netPay)}</CardTitle><CardDescription className="text-center font-semibold">Estimated Net {results.payFrequencyLabel} Pay</CardDescription></CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Gross Pay</span><span>{formatCurrency(results.grossPay)}</span></div>
                    <div className="flex justify-between pl-4 text-destructive"><span>Pre-Tax Deductions</span><span>-{formatCurrency(results.preTaxDeductions)}</span></div>
                    <div className="flex justify-between pl-4 text-destructive"><span>Federal Tax</span><span>-{formatCurrency(results.federalTax)}</span></div>
                    <div className="flex justify-between pl-4 text-destructive"><span>State Tax</span><span>-{formatCurrency(results.stateTax)}</span></div>
                    <div className="flex justify-between pl-4 text-destructive"><span>City Tax</span><span>-{formatCurrency(results.cityTax)}</span></div>
                    <div className="flex justify-between pl-4 text-destructive"><span>FICA Taxes</span><span>-{formatCurrency(results.ficaTax)}</span></div>
                    <div className="flex justify-between font-bold border-t pt-2 mt-2"><span>Net Pay (Take-Home)</span><span>{formatCurrency(results.netPay)}</span></div>
                </CardContent>
              </Card>
              <Card>
                  <CardHeader><CardTitle className="text-base text-center">Paycheck Breakdown</CardTitle></CardHeader>
                  <CardContent className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                              <Pie data={results.pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5}>
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
            <div className="flex items-center justify-center h-60 bg-muted/50 rounded-lg border border-dashed p-8">
                <p className="text-sm text-muted-foreground text-center">Enter your salary and deductions to estimate your take-home pay.</p>
            </div>
        )}
      </div>
    </div>
    </TooltipProvider>
  );
}
