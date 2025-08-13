
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';

const formSchema = z.object({
  loanAmount: z.number().min(1, 'Loan amount must be greater than 0'),
  loanTerm: z.number().int().min(1, 'Loan term must be at least 1 year'),
  interestRate: z.number().min(0.01, 'Interest rate must be positive'),
});

type FormData = z.infer<typeof formSchema>;

export default function StudentLoanCalculator() {
  const [results, setResults] = useState<any>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      loanAmount: 30000,
      loanTerm: 10,
      interestRate: 5.5,
    },
  });

  const calculateLoan = (data: FormData) => {
    const {
      loanAmount,
      loanTerm,
      interestRate,
    } = data;

    const principal = loanAmount;
    const monthlyInterestRate = interestRate / 100 / 12;
    const numberOfPayments = loanTerm * 12;

    const monthlyPayment = principal * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) / (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);
    
    if (!isFinite(monthlyPayment)) {
      setResults({ error: 'Could not calculate monthly payment. Please check your inputs.' });
      return;
    }

    const totalPaid = monthlyPayment * numberOfPayments;
    const totalInterestPaid = totalPaid - principal;
    
    const amortization = [];
    let remainingBalance = principal;

    for (let i = 1; i <= numberOfPayments; i++) {
        const interestPayment = remainingBalance * monthlyInterestRate;
        const principalPayment = monthlyPayment - interestPayment;
        remainingBalance -= principalPayment;
        amortization.push({
            month: i,
            interestPayment,
            principalPayment,
            remainingBalance: remainingBalance > 0 ? remainingBalance : 0,
        });
    }

    setResults({
      monthlyPayment,
      totalInterestPaid,
      totalPaid,
      principal,
      amortization,
      error: null,
    });
  };
  
  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  return (
    <form onSubmit={handleSubmit(calculateLoan)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs Column */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Loan Details</h3>
        
        <div>
          <Label htmlFor="loanAmount">Total Loan Amount ($)</Label>
          <Controller name="loanAmount" control={control} render={({ field }) => <Input id="loanAmount" type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
          {errors.loanAmount && <p className="text-destructive text-sm mt-1">{errors.loanAmount.message}</p>}
        </div>

        <div>
          <Label htmlFor="loanTerm">Loan Term (years)</Label>
          <Controller name="loanTerm" control={control} render={({ field }) => <Input id="loanTerm" type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))} />} />
          {errors.loanTerm && <p className="text-destructive text-sm mt-1">{errors.loanTerm.message}</p>}
        </div>

        <div>
          <Label htmlFor="interestRate">Interest Rate (%)</Label>
          <Controller name="interestRate" control={control} render={({ field }) => <Input id="interestRate" type="number" step="0.01" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
          {errors.interestRate && <p className="text-destructive text-sm mt-1">{errors.interestRate.message}</p>}
        </div>
        
        <Button type="submit" className="w-full">Calculate</Button>
      </div>

      {/* Results Column */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Payment Summary</h3>
        {results ? (
            results.error ? (
                <Card className="flex items-center justify-center h-60 bg-muted/50 border-dashed">
                    <p className="text-destructive">{results.error}</p>
                </Card>
            ) : (
                <div className="space-y-4">
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-sm text-muted-foreground">Estimated Monthly Payment</p>
                            <p className="text-3xl font-bold">{formatCurrency(results.monthlyPayment)}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4 grid grid-cols-2 gap-2 text-sm">
                            <div><p className="text-muted-foreground">Total Interest Paid</p><p className="font-semibold">{formatCurrency(results.totalInterestPaid)}</p></div>
                             <div><p className="text-muted-foreground">Total Paid</p><p className="font-semibold">{formatCurrency(results.totalPaid)}</p></div>
                        </CardContent>
                    </Card>
                </div>
            )
        ) : (
             <div className="flex items-center justify-center h-60 bg-muted/50 rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">Enter loan details to see your payment plan</p>
            </div>
        )}
      </div>
    </form>
  );
}
