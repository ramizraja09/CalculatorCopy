
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Info, Download } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// 2024 Federal Income Tax Data (simplified for this calculator)
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
// Assume 2025 is the same for now
taxData[2025] = taxData[2024];


const formSchema = z.object({
  filingStatus: z.enum(['single', 'married_jointly']),
  youngDependents: z.number().int().min(0),
  otherDependents: z.number().int().min(0),
  taxYear: z.enum(['2024', '2025']),
  wages: z.number().min(0),
  wagesWithheld: z.number().min(0),
  interestIncome: z.number().min(0),
  ordinaryDividends: z.number().min(0),
  qualifiedDividends: z.number().min(0),
  shortTermGains: z.number().min(0),
  longTermGains: z.number().min(0),
  otherIncome: z.number().min(0),
  iraContributions: z.number().min(0),
  studentLoanInterest: z.number().min(0).max(2500),
  otherDeductions: z.number().min(0),
});

type FormData = z.infer<typeof formSchema>;
const PIE_COLORS = ['hsl(var(--chart-2))', 'hsl(var(--destructive))'];

export default function IncomeTaxCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, reset } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      filingStatus: 'single',
      youngDependents: 0,
      otherDependents: 0,
      taxYear: '2024',
      wages: 80000,
      wagesWithheld: 9000,
      interestIncome: 0,
      ordinaryDividends: 0,
      qualifiedDividends: 0,
      shortTermGains: 0,
      longTermGains: 0,
      otherIncome: 0,
      iraContributions: 0,
      studentLoanInterest: 0,
      otherDeductions: 0,
    },
  });
  
  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const calculateTaxes = (data: FormData) => {
    const yearData = taxData[data.taxYear];
    
    // Calculate total income
    const totalOrdinaryIncome = data.wages + data.interestIncome + data.ordinaryDividends + data.shortTermGains + data.otherIncome;
    const totalIncome = totalOrdinaryIncome + data.longTermGains;
    
    // Calculate deductions
    const standardDeduction = yearData.standardDeduction[data.filingStatus];
    const totalDeductions = standardDeduction + data.iraContributions + data.studentLoanInterest + data.otherDeductions;
    
    // Calculate taxable income
    const taxableOrdinaryIncome = Math.max(0, totalOrdinaryIncome - totalDeductions);
    
    // Calculate ordinary income tax
    const brackets = yearData.brackets[data.filingStatus];
    let ordinaryTax = 0;
    brackets.forEach(bracket => {
        if (taxableOrdinaryIncome > bracket.from) {
            const incomeInBracket = Math.min(taxableOrdinaryIncome, bracket.to) - bracket.from;
            ordinaryTax += incomeInBracket * bracket.rate;
        }
    });

    // Simplified capital gains tax (assuming 15% rate)
    const capitalGainsTax = data.longTermGains * 0.15;
    
    // Calculate credits
    const childTaxCredit = data.youngDependents * yearData.childTaxCredit;
    const otherDependentCredit = data.otherDependents * yearData.otherDependentCredit;
    const totalCredits = childTaxCredit + otherDependentCredit;

    // Final calculation
    const totalTaxLiability = Math.max(0, ordinaryTax + capitalGainsTax - totalCredits);
    const finalResult = data.wagesWithheld - totalTaxLiability;
    const netIncome = totalIncome - totalTaxLiability;

    setResults({
        totalIncome,
        totalDeductions,
        taxableIncome: taxableOrdinaryIncome + data.longTermGains,
        totalTax: totalTaxLiability,
        finalResult,
        pieData: [
            { name: 'Net Income', value: netIncome },
            { name: 'Total Tax', value: totalTaxLiability },
        ]
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
    const filename = `tax-estimation.${format}`;

    if (format === 'txt') {
        content = `Tax Estimation\n\nInputs:\n${Object.entries(formData).map(([k,v]) => `- ${k}: ${v}`).join('\n')}\n\nResults:\n- Total Income: ${formatCurrency(results.totalIncome)}\n- Total Deductions: ${formatCurrency(results.totalDeductions)}\n- Total Tax: ${formatCurrency(results.totalTax)}\n- Refund/Owed: ${formatCurrency(results.finalResult)}`;
    } else {
        content = `Category,Value\n`;
        Object.entries(formData).forEach(([k,v]) => content += `${k},${v}\n`);
        content += `\nResult Category,Value\n`;
        content += `Total Income,${results.totalIncome.toFixed(2)}\n`;
        content += `Total Deductions,${results.totalDeductions.toFixed(2)}\n`;
        content += `Total Tax,${results.totalTax.toFixed(2)}\n`;
        content += `Refund/Owed,${results.finalResult.toFixed(2)}\n`;
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
      <form onSubmit={handleSubmit(calculateTaxes)} className="lg:col-span-2 space-y-4">
        {/* Filing Status & Dependents */}
        <Card>
          <CardHeader><CardTitle>Filing Status & Dependents</CardTitle></CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Filing Status</Label>
              <Controller name="filingStatus" control={control} render={({ field }) => ( <Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="single">Single</SelectItem><SelectItem value="married_jointly">Married Filing Jointly</SelectItem></SelectContent></Select> )} />
            </div>
             <div>
              <Label>Tax Year</Label>
              <Controller name="taxYear" control={control} render={({ field }) => ( <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4 pt-2"><div className="flex items-center space-x-2"><RadioGroupItem value="2024" id="2024" /><Label htmlFor="2024">2024</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="2025" id="2025" /><Label htmlFor="2025">2025</Label></div></RadioGroup> )} />
            </div>
            <div><Label>No. of Young Dependents (0-16)</Label><Controller name="youngDependents" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />} /></div>
            <div><Label>No. of Other Dependents (17+)</Label><Controller name="otherDependents" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />} /></div>
          </CardContent>
        </Card>
        
        {/* Income */}
        <Card>
          <CardHeader><CardTitle>Income</CardTitle></CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div><Label>Wages, Tips, Other Comp.</Label><Controller name="wages" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
            <div><Label>Federal Income Tax Withheld</Label><Controller name="wagesWithheld" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
            <div><Label>Interest Income</Label><Controller name="interestIncome" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
            <div><Label>Ordinary Dividends</Label><Controller name="ordinaryDividends" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
            <div><Label>Qualified Dividends</Label><Controller name="qualifiedDividends" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
            <div><Label>Short-term Capital Gains</Label><Controller name="shortTermGains" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
            <div><Label>Long-term Capital Gains</Label><Controller name="longTermGains" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
            <div><Label>Other Income</Label><Controller name="otherIncome" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
          </CardContent>
        </Card>
        
        {/* Deductions */}
        <Card>
          <CardHeader><CardTitle>Deductions & Credits</CardTitle></CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div><Label>IRA Contributions</Label><Controller name="iraContributions" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
            <div><Label>Student Loan Interest Paid</Label><Controller name="studentLoanInterest" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
            <div><Label>Other Deductions</Label><Controller name="otherDeductions" control={control} render={({ field }) => <Input type="number" placeholder="e.g. educator expenses" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="submit" className="flex-1">Calculate</Button>
          <Button type="button" variant="outline" onClick={handleClear}>Clear</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={!results}>
                    <Download className="mr-2 h-4 w-4" /> Export
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleExport('txt')}>Download .txt</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('csv')}>Download .csv</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </form>
      
      <div className="lg:col-span-1 space-y-4">
        <h3 className="text-xl font-semibold">Tax Summary</h3>
        {results ? (
            <div className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle className={`text-center text-3xl font-bold ${results.finalResult >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                            {formatCurrency(Math.abs(results.finalResult))}
                        </CardTitle>
                        <CardDescription className="text-center font-semibold">
                            {results.finalResult >= 0 ? 'Estimated Refund' : 'Estimated Amount Owed'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-muted-foreground">Total Income</span><span>{formatCurrency(results.totalIncome)}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Total Deductions</span><span>-{formatCurrency(results.totalDeductions)}</span></div>
                        <div className="flex justify-between border-b pb-2 mb-2"><span className="text-muted-foreground">Taxable Income</span><span>{formatCurrency(results.taxableIncome)}</span></div>
                        <div className="flex justify-between font-bold"><span>Total Tax</span><span>{formatCurrency(results.totalTax)}</span></div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle className="text-base text-center">Income Breakdown</CardTitle></CardHeader>
                    <CardContent className="h-64">
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
            <div className="flex items-center justify-center h-full bg-muted/50 rounded-lg border border-dashed p-8">
                <p className="text-sm text-muted-foreground text-center">Enter your income and deductions to estimate your tax refund or amount owed.</p>
            </div>
        )}
      </div>
    </div>
  );
}
