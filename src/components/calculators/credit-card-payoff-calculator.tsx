
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const formSchema = z.object({
  balance: z.number().min(1, 'Balance must be greater than 0'),
  apr: z.number().min(0, 'APR must be non-negative'),
  payoffStrategy: z.enum(['fixedPayment', 'targetDate']),
  monthlyPayment: z.number().optional(),
  payoffMonths: z.number().int().optional(),
}).refine(data => {
    if (data.payoffStrategy === 'fixedPayment') {
        return data.monthlyPayment && data.monthlyPayment > 0;
    }
    if (data.payoffStrategy === 'targetDate') {
        return data.payoffMonths && data.payoffMonths > 0;
    }
    return true;
}, {
    message: "Please provide a valid input for your chosen strategy.",
    path: ["monthlyPayment"], // or payoffMonths, doesn't matter much
});


type FormData = z.infer<typeof formSchema>;

export default function CreditCardPayoffCalculator() {
  const [results, setResults] = useState<any>(null);

  const { control, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      balance: 5000,
      apr: 19.99,
      payoffStrategy: 'fixedPayment',
      monthlyPayment: 200,
      payoffMonths: 24,
    },
  });

  const payoffStrategy = watch('payoffStrategy');

  const calculatePayoff = (data: FormData) => {
    const { balance, apr, payoffStrategy, monthlyPayment, payoffMonths } = data;
    const monthlyRate = apr / 100 / 12;

    let calculatedMonthlyPayment = 0;
    let totalMonths = 0;
    
    if (payoffStrategy === 'fixedPayment' && monthlyPayment) {
        // Check if payment is high enough to cover interest
        if(monthlyPayment <= balance * monthlyRate) {
            setResults({ error: 'Monthly payment is too low to cover interest. Increase the payment amount.'});
            return;
        }
        totalMonths = -Math.log(1 - (balance * monthlyRate) / monthlyPayment) / Math.log(1 + monthlyRate);
        calculatedMonthlyPayment = monthlyPayment;
    } else if (payoffStrategy === 'targetDate' && payoffMonths) {
        if (monthlyRate > 0) {
          calculatedMonthlyPayment = (balance * monthlyRate * Math.pow(1 + monthlyRate, payoffMonths)) / (Math.pow(1 + monthlyRate, payoffMonths) - 1);
        } else {
          calculatedMonthlyPayment = balance / payoffMonths;
        }
        totalMonths = payoffMonths;
    } else {
        setResults({ error: 'Invalid calculation parameters.' });
        return;
    }
    
    if (!isFinite(totalMonths) || !isFinite(calculatedMonthlyPayment)) {
      setResults({ error: 'Could not calculate payoff. Please check your inputs.' });
      return;
    }

    const totalPaid = calculatedMonthlyPayment * totalMonths;
    const totalInterest = totalPaid - balance;

    const schedule = [];
    let remainingBalance = balance;
    const finalPaymentMonth = Math.ceil(totalMonths);

    for (let i = 1; i <= finalPaymentMonth; i++) {
        const interestPayment = remainingBalance * monthlyRate;
        let principalPayment;
        let actualPayment;

        if (i === finalPaymentMonth) {
            actualPayment = remainingBalance + interestPayment;
            principalPayment = remainingBalance;
        } else {
            actualPayment = calculatedMonthlyPayment;
            principalPayment = calculatedMonthlyPayment - interestPayment;
        }
        
        remainingBalance -= principalPayment;
        
        schedule.push({
            month: i,
            payment: actualPayment,
            principal: principalPayment,
            interest: interestPayment,
            balance: remainingBalance > 0 ? remainingBalance : 0,
        });
    }

    setResults({
      payoffTimeYears: Math.floor(finalPaymentMonth / 12),
      payoffTimeMonths: finalPaymentMonth % 12,
      totalInterest,
      totalPaid,
      finalPayoffDate: new Date(Date.now() + finalPaymentMonth * 30.437 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      monthlyPayment: calculatedMonthlyPayment,
      schedule,
      error: null,
    });
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  return (
    <form onSubmit={handleSubmit(calculatePayoff)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Inputs</h3>
        <div>
          <Label htmlFor="balance">Credit Card Balance ($)</Label>
          <Controller name="balance" control={control} render={({ field }) => <Input id="balance" type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
          {errors.balance && <p className="text-destructive text-sm mt-1">{errors.balance.message}</p>}
        </div>

        <div>
          <Label htmlFor="apr">Interest Rate (APR %)</Label>
          <Controller name="apr" control={control} render={({ field }) => <Input id="apr" type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
          {errors.apr && <p className="text-destructive text-sm mt-1">{errors.apr.message}</p>}
        </div>
        
        <Controller
            name="payoffStrategy"
            control={control}
            render={({ field }) => (
            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 gap-4">
                <div>
                    <RadioGroupItem value="fixedPayment" id="fixedPayment" className="peer sr-only" />
                    <Label htmlFor="fixedPayment" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                        Pay a Fixed Amount
                    </Label>
                </div>
                 <div>
                    <RadioGroupItem value="targetDate" id="targetDate" className="peer sr-only" />
                    <Label htmlFor="targetDate" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                        Payoff by a Date
                    </Label>
                </div>
            </RadioGroup>
        )}/>

        {payoffStrategy === 'fixedPayment' && (
            <div>
              <Label htmlFor="monthlyPayment">Monthly Payment ($)</Label>
              <Controller name="monthlyPayment" control={control} render={({ field }) => <Input id="monthlyPayment" type="number" step="10" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
              {errors.monthlyPayment && <p className="text-destructive text-sm mt-1">{errors.monthlyPayment.message}</p>}
            </div>
        )}
        {payoffStrategy === 'targetDate' && (
            <div>
              <Label htmlFor="payoffMonths">Payoff in (months)</Label>
              <Controller name="payoffMonths" control={control} render={({ field }) => <Input id="payoffMonths" type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} />
              {errors.payoffMonths && <p className="text-destructive text-sm mt-1">{errors.payoffMonths.message}</p>}
            </div>
        )}
        
        <Button type="submit" className="w-full">Calculate Payoff</Button>
      </div>

      {/* Results */}
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
                    <p className="text-sm text-muted-foreground">You'll be debt free in</p>
                    <p className="text-2xl font-bold">
                        {results.payoffTimeYears > 0 && `${results.payoffTimeYears} ${results.payoffTimeYears === 1 ? 'Year' : 'Years'}`} {results.payoffTimeMonths > 0 && `${results.payoffTimeMonths} ${results.payoffTimeMonths === 1 ? 'Month' : 'Months'}`}
                    </p>
                    <p className="text-sm text-muted-foreground">around {results.finalPayoffDate}</p>
                </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 grid grid-cols-2 gap-2 text-sm">
                <div><p className="text-muted-foreground">Your Monthly Payment</p><p className="font-semibold">{formatCurrency(results.monthlyPayment)}</p></div>
                <div><p className="text-muted-foreground">Total Interest Paid</p><p className="font-semibold">{formatCurrency(results.totalInterest)}</p></div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">Payoff Schedule</h4>
                  <ScrollArea className="h-96">
                      <Table>
                          <TableHeader className="sticky top-0 bg-muted">
                              <TableRow>
                                  <TableHead className="w-1/4">Month</TableHead>
                                  <TableHead className="w-1/4 text-right">Payment</TableHead>
                                  <TableHead className="w-1/4 text-right">Interest</TableHead>
                                  <TableHead className="w-1/4 text-right">Balance</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {results.schedule.map((row: any) => (
                                  <TableRow key={row.month}>
                                      <TableCell>{row.month}</TableCell>
                                      <TableCell className="text-right">{formatCurrency(row.payment)}</TableCell>
                                      <TableCell className="text-right">{formatCurrency(row.interest)}</TableCell>
                                      <TableCell className="text-right">{formatCurrency(row.balance)}</TableCell>
                                  </TableRow>
                              ))}
                          </TableBody>
                      </Table>
                  </ScrollArea>
              </CardContent>
            </Card>
          </div>
        )) : (
          <div className="flex items-center justify-center h-60 bg-muted/50 rounded-lg border border-dashed">
            <p className="text-sm text-muted-foreground">Enter your details to create a payoff plan</p>
          </div>
        )}
      </div>
    </form>
  );
}

    