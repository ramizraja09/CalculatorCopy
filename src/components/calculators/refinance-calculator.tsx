
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info } from 'lucide-react';

const formSchema = z.object({
  // Current Loan
  currentBalance: z.number().min(1, 'Current balance is required'),
  currentInterestRate: z.number().min(0.01, 'Interest rate must be positive'),
  currentMonthlyPayment: z.number().min(1, 'Monthly payment is required'),
  
  // New Loan
  newInterestRate: z.number().min(0.01, 'New interest rate must be positive'),
  newLoanTerm: z.number().int().min(1, 'New loan term is required'),
  closingCosts: z.number().min(0, 'Closing costs cannot be negative'),
});

type FormData = z.infer<typeof formSchema>;

export default function RefinanceCalculator() {
  const [results, setResults] = useState<any>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currentBalance: 250000,
      currentInterestRate: 7.5,
      currentMonthlyPayment: 1748,
      newInterestRate: 6.0,
      newLoanTerm: 30,
      closingCosts: 4000,
    },
  });

  const calculateRefinance = (data: FormData) => {
    const {
      currentBalance,
      currentInterestRate,
      currentMonthlyPayment,
      newInterestRate,
      newLoanTerm,
      closingCosts,
    } = data;
    
    // Calculate remaining months on current loan
    const currentMonthlyRate = currentInterestRate / 100 / 12;
    let remainingMonthsCurrent = -Math.log(1 - (currentBalance * currentMonthlyRate) / currentMonthlyPayment) / Math.log(1 + currentMonthlyRate);
    if (!isFinite(remainingMonthsCurrent)) {
        remainingMonthsCurrent = 0; // If payment doesn't cover interest
    }
    const totalPaidCurrent = remainingMonthsCurrent > 0 ? currentMonthlyPayment * remainingMonthsCurrent : Infinity;

    // Calculate new loan details
    const newPrincipal = currentBalance + closingCosts;
    const newMonthlyRate = newInterestRate / 100 / 12;
    const newNumberOfPayments = newLoanTerm * 12;
    
    const newMonthlyPayment = newPrincipal * (newMonthlyRate * Math.pow(1 + newMonthlyRate, newNumberOfPayments)) / (Math.pow(1 + newMonthlyRate, newNumberOfPayments) - 1);
    
    if (!isFinite(newMonthlyPayment)) {
        setResults({ error: "Could not calculate the new monthly payment. The interest rate might be too high for the given term."});
        return;
    }

    const totalPaidNew = newMonthlyPayment * newNumberOfPayments;
    const monthlySavings = currentMonthlyPayment - newMonthlyPayment;
    const lifetimeSavings = totalPaidCurrent - totalPaidNew;
    
    // Break-even point in months
    const breakEvenMonths = monthlySavings > 0 ? closingCosts / monthlySavings : Infinity;

    setResults({
        newMonthlyPayment,
        monthlySavings,
        lifetimeSavings,
        breakEvenMonths,
        error: null,
    });
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  return (
    <form onSubmit={handleSubmit(calculateRefinance)}>
      <div className="grid md:grid-cols-2 gap-8">
        {/* Inputs Column */}
        <div className="space-y-4">
          <Card>
              <CardHeader><CardTitle>Current Loan</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                  <div>
                      <Label htmlFor="currentBalance">Current Loan Balance ($)</Label>
                      <Controller name="currentBalance" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
                  </div>
                  <div>
                      <Label htmlFor="currentInterestRate">Interest Rate (%)</Label>
                      <Controller name="currentInterestRate" control={control} render={({ field }) => <Input type="number" step="0.01" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
                  </div>
                  <div>
                      <Label htmlFor="currentMonthlyPayment">Monthly Payment (Principal & Interest)</Label>
                      <Controller name="currentMonthlyPayment" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
                  </div>
              </CardContent>
          </Card>
          <Card>
              <CardHeader><CardTitle>New Loan</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                  <div>
                      <Label htmlFor="newInterestRate">New Interest Rate (%)</Label>
                      <Controller name="newInterestRate" control={control} render={({ field }) => <Input type="number" step="0.01" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
                  </div>
                  <div>
                      <Label htmlFor="newLoanTerm">New Loan Term (Years)</Label>
                      <Controller name="newLoanTerm" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))} />} />
                  </div>
                  <div>
                      <Label htmlFor="closingCosts">Closing Costs ($)</Label>
                      <Controller name="closingCosts" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
                  </div>
              </CardContent>
          </Card>
          <Button type="submit" className="w-full">Calculate Savings</Button>
        </div>

        {/* Results Column */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Refinance Summary</h3>
          {results ? (
              results.error ? (
                  <Card className="flex items-center justify-center h-60 bg-muted/50 border-dashed">
                      <p className="text-destructive text-center p-4">{results.error}</p>
                  </Card>
              ) : (
              <div className="space-y-4">
                  <Card>
                      <CardContent className="p-4 grid grid-cols-2 gap-4 text-center">
                          <div>
                              <p className="text-muted-foreground">New Monthly Payment</p>
                              <p className="font-semibold text-xl">{formatCurrency(results.newMonthlyPayment)}</p>
                          </div>
                          <div>
                              <p className="text-muted-foreground">Monthly Savings</p>
                              <p className={`font-semibold text-xl ${results.monthlySavings > 0 ? 'text-green-600' : 'text-destructive'}`}>{formatCurrency(results.monthlySavings)}</p>
                          </div>
                      </CardContent>
                  </Card>
                  <Card>
                      <CardContent className="p-4 text-center">
                          <p className="text-muted-foreground">Potential Lifetime Savings</p>
                          <p className={`font-bold text-3xl ${results.lifetimeSavings > 0 ? 'text-green-600' : 'text-destructive'}`}>
                              {formatCurrency(results.lifetimeSavings)}
                          </p>
                      </CardContent>
                  </Card>
                  <Alert>
                      <Info className="h-4 w-4" />
                      <AlertTitle>Break-Even Point</AlertTitle>
                      <AlertDescription className="text-xs">
                          {isFinite(results.breakEvenMonths) 
                          ? `It will take approximately ${Math.ceil(results.breakEvenMonths)} months to recoup the closing costs with your monthly savings.`
                          : `With these terms, you won't save money monthly, so a break-even point cannot be calculated.`
                          }
                      </AlertDescription>
                  </Alert>
              </div>
          )) : (
              <div className="flex items-center justify-center h-60 bg-muted/50 rounded-lg border border-dashed">
                  <p className="text-sm text-muted-foreground">Enter your loan details to compare</p>
              </div>
          )}
        </div>
      </div>
    </form>
  );
}
