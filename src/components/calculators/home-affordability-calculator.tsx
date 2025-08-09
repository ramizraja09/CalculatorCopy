
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info } from 'lucide-react';

const formSchema = z.object({
  annualIncome: z.number().min(1, 'Annual income must be positive'),
  monthlyDebts: z.number().min(0, 'Monthly debts must be non-negative'),
  downPayment: z.number().min(0, 'Down payment must be non-negative'),
  interestRate: z.number().min(0.01, 'Interest rate must be positive'),
  loanTerm: z.number().int().min(1, 'Loan term must be at least 1 year'),
  propertyTaxRate: z.number().min(0, 'Property tax rate must be non-negative'),
  homeInsuranceRate: z.number().min(0, 'Home insurance rate must be non-negative'),
});

type FormData = z.infer<typeof formSchema>;

export default function HomeAffordabilityCalculator() {
  const [results, setResults] = useState<any>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      annualIncome: 80000,
      monthlyDebts: 500,
      downPayment: 20000,
      interestRate: 6.5,
      loanTerm: 30,
      propertyTaxRate: 1.2,
      homeInsuranceRate: 0.5,
    },
  });

  const calculateAffordability = (data: FormData) => {
    const { 
        annualIncome, 
        monthlyDebts, 
        downPayment, 
        interestRate, 
        loanTerm,
        propertyTaxRate,
        homeInsuranceRate
    } = data;
    
    const grossMonthlyIncome = annualIncome / 12;
    
    // Rule 1: Max housing payment (28% of GMI)
    const maxHousingPayment28 = grossMonthlyIncome * 0.28;
    
    // Rule 2: Max total debt payment (36% of GMI)
    const maxTotalDebtPayment36 = grossMonthlyIncome * 0.36;
    const maxHousingPayment36 = maxTotalDebtPayment36 - monthlyDebts;

    // Use the more conservative (lower) of the two as the max PITI
    const maxPITI = Math.min(maxHousingPayment28, maxHousingPayment36);

    const monthlyInterestRate = interestRate / 100 / 12;
    const numberOfPayments = loanTerm * 12;
    
    // Estimate a portion of payment for taxes and insurance
    // This is an iterative problem, so we'll approximate. A simple way is to estimate T&I as a percentage of the monthly payment.
    const estimatedTaxesAndInsurancePercent = (propertyTaxRate + homeInsuranceRate) / 100 / 12;
    
    // Back-calculate the loan amount from the max Principal & Interest payment
    // P&I = maxPITI - (LoanAmount * estimatedTaxesAndInsurancePercent)
    // This is complex. Let's simplify by calculating the max loan based on PITI, then adjusting the home price.
    // Loan = P * ( (1+r)^n - 1 ) / ( r * (1+r)^n )
    // We need to solve for P (Principal) based on the monthly payment (M).
    // P = M * [ (1+r)^n - 1 ] / [ r(1+r)^n ]
    
    // Let's assume taxes and insurance are a percentage of the home price, not the payment.
    const monthlyRate = interestRate / 100 / 12;
    const monthlyTaxesAndInsuranceFactor = (propertyTaxRate / 100 / 12) + (homeInsuranceRate / 100 / 12);

    // M = P * [r(1+r)^n] / [(1+r)^n - 1] + P * monthlyTaxesAndInsuranceFactor
    // M = P * ( [r(1+r)^n] / [(1+r)^n - 1] + monthlyTaxesAndInsuranceFactor )
    // P = M / ( [r(1+r)^n] / [(1+r)^n - 1] + monthlyTaxesAndInsuranceFactor )
    
    const loanPaymentFactor = (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    const totalDivisor = loanPaymentFactor + monthlyTaxesAndInsuranceFactor;

    const maxLoanAmount = maxPITI / totalDivisor;

    if (!isFinite(maxLoanAmount) || maxLoanAmount <= 0) {
        setResults({ error: "Could not calculate an affordable amount. This may be due to high monthly debts or a low income for the given rates." });
        return;
    }
    
    const affordableHomePrice = maxLoanAmount + downPayment;
    const estimatedMonthlyPayment = maxLoanAmount * loanPaymentFactor + (affordableHomePrice * monthlyTaxesAndInsuranceFactor);

    setResults({
        affordableHomePrice,
        maxLoanAmount,
        estimatedMonthlyPayment,
        downPayment,
        maxPITI,
        error: null,
    });
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  return (
    <form onSubmit={handleSubmit(calculateAffordability)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs Column */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Financial Details</h3>
        
        <div>
          <Label htmlFor="annualIncome">Gross Annual Income ($)</Label>
          <Controller name="annualIncome" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
          {errors.annualIncome && <p className="text-destructive text-sm mt-1">{errors.annualIncome.message}</p>}
        </div>

        <div>
          <Label htmlFor="monthlyDebts">Total Monthly Debts ($)</Label>
          <Controller name="monthlyDebts" control={control} render={({ field }) => <Input type="number" placeholder="Car payments, student loans, etc." {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
          {errors.monthlyDebts && <p className="text-destructive text-sm mt-1">{errors.monthlyDebts.message}</p>}
        </div>

        <div>
          <Label htmlFor="downPayment">Down Payment ($)</Label>
          <Controller name="downPayment" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
          {errors.downPayment && <p className="text-destructive text-sm mt-1">{errors.downPayment.message}</p>}
        </div>
        
        <h3 className="text-xl font-semibold pt-4">Loan Assumptions</h3>
        
        <div>
          <Label htmlFor="interestRate">Estimated Interest Rate (%)</Label>
          <Controller name="interestRate" control={control} render={({ field }) => <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
          {errors.interestRate && <p className="text-destructive text-sm mt-1">{errors.interestRate.message}</p>}
        </div>

        <div>
          <Label htmlFor="loanTerm">Loan Term (years)</Label>
          <Controller name="loanTerm" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} />
          {errors.loanTerm && <p className="text-destructive text-sm mt-1">{errors.loanTerm.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="propertyTaxRate">Annual Property Tax Rate (%)</Label>
          <Controller name="propertyTaxRate" control={control} render={({ field }) => <Input type="number" step="0.01" placeholder="e.g., 1.2" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
          {errors.propertyTaxRate && <p className="text-destructive text-sm mt-1">{errors.propertyTaxRate.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="homeInsuranceRate">Annual Home Insurance Rate (%)</Label>
          <Controller name="homeInsuranceRate" control={control} render={({ field }) => <Input type="number" step="0.01" placeholder="e.g., 0.5" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
          {errors.homeInsuranceRate && <p className="text-destructive text-sm mt-1">{errors.homeInsuranceRate.message}</p>}
        </div>

        <Button type="submit" className="w-full">Calculate Affordability</Button>
      </div>

      {/* Results Column */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Results</h3>
        {results ? (
            results.error ? (
                <Card className="flex items-center justify-center h-60 bg-muted/50 border-dashed">
                    <p className="text-destructive text-center p-4">{results.error}</p>
                </Card>
            ) : (
                <div className="space-y-4">
                    <Card>
                        <CardContent className="p-4 text-center">
                            <p className="text-sm text-muted-foreground">You Can Afford a Home Priced At</p>
                            <p className="text-3xl font-bold">{formatCurrency(results.affordableHomePrice)}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 grid grid-cols-2 gap-4 text-sm">
                             <div><p className="text-muted-foreground">Estimated Loan Amount</p><p className="font-semibold">{formatCurrency(results.maxLoanAmount)}</p></div>
                             <div><p className="text-muted-foreground">Down Payment</p><p className="font-semibold">{formatCurrency(results.downPayment)}</p></div>
                             <div><p className="text-muted-foreground">Estimated Monthly Payment</p><p className="font-semibold">{formatCurrency(results.estimatedMonthlyPayment)}</p></div>
                             <div><p className="text-muted-foreground">Max Housing Payment</p><p className="font-semibold">{formatCurrency(results.maxPITI)} / mo</p></div>
                        </CardContent>
                    </Card>
                     <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>How It's Calculated</AlertTitle>
                        <AlertDescription className="text-xs">
                          This estimate is based on the 28/36 rule, which suggests your monthly housing costs shouldn't exceed 28% of your gross monthly income, and your total debt payments shouldn't exceed 36%. This is a guideline; a lender will make the final determination.
                        </AlertDescription>
                    </Alert>
                </div>
            )
        ) : (
             <div className="flex items-center justify-center h-60 bg-muted/50 rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">Enter your financial details to estimate affordability</p>
            </div>
        )}
      </div>
    </form>
  );
}
