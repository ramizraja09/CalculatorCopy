
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
  bi_weekly: 26,
  weekly: 52,
};

const formSchema = z.object({
  grossIncome: z.number().min(1, 'Gross income must be positive'),
  filingStatus: z.enum(['single', 'married_jointly']),
  payFrequency: z.enum(['annually', 'monthly', 'bi_weekly', 'weekly']),
  preTaxDeductions: z.number().min(0, 'Deductions must be non-negative'),
});

type FormData = z.infer<typeof formSchema>;

export default function SalaryCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      grossIncome: 75000,
      filingStatus: 'single',
      payFrequency: 'bi_weekly',
      preTaxDeductions: 6000,
    },
  });

  const calculateTakeHomePay = (data: FormData) => {
    const { grossIncome, filingStatus, payFrequency, preTaxDeductions } = data;
    
    // Income subject to FICA is gross pay
    const socialSecurityTaxable = Math.min(grossIncome, FICA_RATES.socialSecurity.limit);
    const socialSecurityTax = socialSecurityTaxable * FICA_RATES.socialSecurity.rate;
    const medicareTax = grossIncome * FICA_RATES.medicare.rate;
    const totalFicaTax = socialSecurityTax + medicareTax;

    // Income subject to federal tax is after pre-tax deductions
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
    const payPeriodsPerYear = payPeriods[payFrequency];
    
    setResults({
      grossPay: grossIncome / payPeriodsPerYear,
      netPay: netIncome / payPeriodsPerYear,
      totalDeductions: (totalTax + preTaxDeductions) / payPeriodsPerYear,
      preTaxDeductions: preTaxDeductions / payPeriodsPerYear,
      federalTax: federalTax / payPeriodsPerYear,
      socialSecurityTax: socialSecurityTax / payPeriodsPerYear,
      medicareTax: medicareTax / payPeriodsPerYear,
      payFrequencyLabel: payFrequency.replace('_', '-'),
    });
    setFormData(data);
  };
  
  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `salary-calculation.${format}`;
    const { grossIncome, filingStatus, payFrequency, preTaxDeductions } = formData;

    if (format === 'txt') {
      content = `Salary Calculation\n\nInputs:\n- Gross Annual Income: ${formatCurrency(grossIncome)}\n- Filing Status: ${filingStatus}\n- Pay Frequency: ${payFrequency}\n- Annual Pre-tax Deductions: ${formatCurrency(preTaxDeductions)}\n\n`;
      content += `Results (per ${results.payFrequencyLabel} period):\n- Gross Pay: ${formatCurrency(results.grossPay)}\n- Net Pay: ${formatCurrency(results.netPay)}\n- Federal Tax: ${formatCurrency(results.federalTax)}\n- Social Security: ${formatCurrency(results.socialSecurityTax)}\n- Medicare: ${formatCurrency(results.medicareTax)}\n- Pre-tax Deductions: ${formatCurrency(results.preTaxDeductions)}`;
    } else {
       content = 'Category,Value\n';
       content += `Gross Annual Income,${grossIncome}\nFiling Status,${filingStatus}\nPay Frequency,${payFrequency}\nAnnual Pre-tax Deductions,${preTaxDeductions}\n\n`;
       content += `Result (per ${results.payFrequencyLabel} period),Value\n`;
       content += `Gross Pay,${results.grossPay.toFixed(2)}\nNet Pay,${results.netPay.toFixed(2)}\nFederal Tax,${results.federalTax.toFixed(2)}\nSocial Security,${results.socialSecurityTax.toFixed(2)}\nMedicare,${results.medicareTax.toFixed(2)}\nPre-tax Deductions,${results.preTaxDeductions.toFixed(2)}`;
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
    <form onSubmit={handleSubmit(calculateTakeHomePay)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs Column */}
      <div className="space-y-4">
        <Card>
          <CardHeader><CardTitle>Your Job Income</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="grossIncome">Gross Annual Income ($)</Label>
              <Controller name="grossIncome" control={control} render={({ field }) => <Input id="grossIncome" type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
              {errors.grossIncome && <p className="text-destructive text-sm mt-1">{errors.grossIncome.message}</p>}
            </div>

            <div>
              <Label htmlFor="filingStatus">Filing Status</Label>
              <Controller name="filingStatus" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="married_jointly">Married Filing Jointly</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            </div>
            
            <div>
              <Label htmlFor="payFrequency">Pay Frequency</Label>
              <Controller name="payFrequency" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="annually">Annually</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="bi_weekly">Bi-Weekly</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            </div>
            <div>
              <Label htmlFor="preTaxDeductions">Annual Pre-Tax Deductions ($)</Label>
              <Controller name="preTaxDeductions" control={control} render={({ field }) => <Input id="preTaxDeductions" type="number" placeholder="401k, health insurance, etc." {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
            </div>
          </CardContent>
        </Card>
        
        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Calculate</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={!results}>
                  <Download className="mr-2 h-4 w-4" /> Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleExport('txt')}>Download as .txt</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('csv')}>Download as .csv</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
         <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>For Estimation Only</AlertTitle>
          <AlertDescription className="text-xs">
            This calculator provides an estimate based on Federal and FICA taxes for 2024. It does not account for state/local taxes or tax credits, which can significantly affect your take-home pay.
          </AlertDescription>
        </Alert>
      </div>

      {/* Results Column */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Results</h3>
        {results ? (
            <div className="space-y-4">
                <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-sm text-muted-foreground">Net {results.payFrequencyLabel} Pay</p>
                        <p className="text-3xl font-bold">{formatCurrency(results.netPay)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="text-base text-center">Paycheck Breakdown</CardTitle></CardHeader>
                    <CardContent className="p-4 space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-muted-foreground">Gross Pay</span> <span className="font-semibold">{formatCurrency(results.grossPay)}</span></div>
                        <div className="flex justify-between pl-4 text-muted-foreground"><span>Pre-Tax Deductions</span> <span className="font-semibold">-{formatCurrency(results.preTaxDeductions)}</span></div>
                        <div className="flex justify-between pl-4 text-muted-foreground"><span>Federal Tax</span> <span className="font-semibold text-destructive">-{formatCurrency(results.federalTax)}</span></div>
                        <div className="flex justify-between pl-4 text-muted-foreground"><span>Social Security</span> <span className="font-semibold text-destructive">-{formatCurrency(results.socialSecurityTax)}</span></div>
                        <div className="flex justify-between pl-4 text-muted-foreground"><span>Medicare</span> <span className="font-semibold text-destructive">-{formatCurrency(results.medicareTax)}</span></div>
                        <div className="flex justify-between font-bold border-t pt-2 mt-2"><span className="">Net Pay (Take-Home)</span> <span>{formatCurrency(results.netPay)}</span></div>
                    </CardContent>
                </Card>
            </div>
        ) : (
             <div className="flex items-center justify-center h-60 bg-muted/50 rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">Enter your details to estimate your take-home pay</p>
            </div>
        )}
      </div>
    </form>
  );
}

    