
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from 'lucide-react';

// 2024 Federal Tax Data
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
});

type FormData = z.infer<typeof formSchema>;

export default function SalaryCalculator() {
  const [results, setResults] = useState<any>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      grossIncome: 75000,
      filingStatus: 'single',
      payFrequency: 'bi_weekly',
    },
  });

  const calculateTakeHomePay = (data: FormData) => {
    const { grossIncome, filingStatus, payFrequency } = data;

    // FICA Taxes
    const socialSecurityTax = Math.min(grossIncome, FICA_RATES.socialSecurity.limit) * FICA_RATES.socialSecurity.rate;
    const medicareTax = grossIncome * FICA_RATES.medicare.rate;
    const totalFicaTax = socialSecurityTax + medicareTax;

    // Federal Income Tax
    const deduction = standardDeductions[filingStatus];
    const taxableIncome = Math.max(0, grossIncome - deduction);
    const brackets = taxBrackets[filingStatus];
    let federalTax = 0;
    for (const bracket of brackets) {
      if (taxableIncome > bracket.from) {
        const taxableInBracket = Math.min(taxableIncome, bracket.to) - bracket.from;
        federalTax += taxableInBracket * bracket.rate;
      }
    }
    
    const totalTax = totalFicaTax + federalTax;
    const netIncome = grossIncome - totalTax;
    const payPeriodsPerYear = payPeriods[payFrequency];
    
    setResults({
      grossPay: grossIncome / payPeriodsPerYear,
      federalTax: federalTax / payPeriodsPerYear,
      socialSecurityTax: socialSecurityTax / payPeriodsPerYear,
      medicareTax: medicareTax / payPeriodsPerYear,
      totalTax: totalTax / payPeriodsPerYear,
      netPay: netIncome / payPeriodsPerYear,
      payFrequencyLabel: payFrequency.replace('_', '-'),
    });
  };
  
  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  return (
    <form onSubmit={handleSubmit(calculateTakeHomePay)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs Column */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Inputs</h3>
        
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
        
        <Button type="submit" className="w-full">Calculate</Button>
         <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>For Estimation Only</AlertTitle>
          <AlertDescription className="text-xs">
            This calculator estimates take-home pay based on Federal and FICA taxes. It does not account for state/local taxes, pre-tax deductions (like 401k or health insurance), or tax credits.
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
                    <CardContent className="p-4 space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-muted-foreground">Gross Pay</span> <span className="font-semibold">{formatCurrency(results.grossPay)}</span></div>
                        <div className="flex justify-between border-t pt-2 mt-2"><span className="text-muted-foreground">Federal Tax</span> <span className="font-semibold text-destructive">-{formatCurrency(results.federalTax)}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Social Security</span> <span className="font-semibold text-destructive">-{formatCurrency(results.socialSecurityTax)}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Medicare</span> <span className="font-semibold text-destructive">-{formatCurrency(results.medicareTax)}</span></div>
                        <div className="flex justify-between font-bold border-t pt-2 mt-2"><span className="">Net Pay</span> <span>{formatCurrency(results.netPay)}</span></div>
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
