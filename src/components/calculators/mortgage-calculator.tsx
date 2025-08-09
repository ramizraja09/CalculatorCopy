
"use client";

import { useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';

const formSchema = z.object({
  homePrice: z.number().min(1, 'Home price must be greater than 0'),
  downPayment: z.number().min(0, 'Down payment must be non-negative'),
  downPaymentType: z.enum(['percent', 'amount']),
  loanTerm: z.number().int().min(1, 'Loan term must be at least 1 year'),
  interestRate: z.number().min(0.01, 'Interest rate must be positive'),
  propertyTax: z.number().min(0, 'Property tax must be non-negative'),
  homeInsurance: z.number().min(0, 'Home insurance must be non-negative'),
  hoaFees: z.number().min(0, 'HOA fees must be non-negative'),
});

type FormData = z.infer<typeof formSchema>;

export default function MortgageCalculator() {
  const [results, setResults] = useState<any>(null);

  const { control, watch, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      homePrice: 350000,
      downPayment: 20,
      downPaymentType: 'percent',
      loanTerm: 30,
      interestRate: 6.5,
      propertyTax: 3000,
      homeInsurance: 1500,
      hoaFees: 0,
    },
  });

  const watchHomePrice = watch('homePrice');
  const watchDownPaymentType = watch('downPaymentType');

  const calculateMortgage = (data: FormData) => {
    const {
      homePrice,
      downPayment,
      downPaymentType,
      loanTerm,
      interestRate,
      propertyTax,
      homeInsurance,
      hoaFees,
    } = data;

    const downPaymentAmount = downPaymentType === 'percent'
      ? homePrice * (downPayment / 100)
      : downPayment;

    if (downPaymentAmount >= homePrice) {
        setResults({ error: 'Down payment must be less than the home price.' });
        return;
    }

    const principal = homePrice - downPaymentAmount;
    const monthlyInterestRate = interestRate / 100 / 12;
    const numberOfPayments = loanTerm * 12;

    const monthlyPrincipalAndInterest = principal * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) / (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);

    const monthlyPropertyTax = propertyTax / 12;
    const monthlyHomeInsurance = homeInsurance / 12;
    const monthlyTotal = monthlyPrincipalAndInterest + monthlyPropertyTax + monthlyHomeInsurance + hoaFees;

    const amortization = [];
    let remainingBalance = principal;
    let totalInterestPaid = 0;

    for (let i = 1; i <= numberOfPayments; i++) {
        const interestPayment = remainingBalance * monthlyInterestRate;
        const principalPayment = monthlyPrincipalAndInterest - interestPayment;
        remainingBalance -= principalPayment;
        totalInterestPaid += interestPayment;
        amortization.push({
            month: i,
            interestPayment,
            principalPayment,
            remainingBalance: remainingBalance > 0 ? remainingBalance : 0,
        });
    }

    setResults({
      monthlyPrincipalAndInterest,
      monthlyPropertyTax,
      monthlyHomeInsurance,
      hoaFees,
      monthlyTotal,
      totalInterestPaid,
      totalPaid: principal + totalInterestPaid,
      downPaymentAmount,
      principal,
      amortization,
      error: null,
    });
  };
  
  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const pieData = results && !results.error
    ? [
        { name: 'Principal & Interest', value: results.monthlyPrincipalAndInterest },
        { name: 'Property Tax', value: results.monthlyPropertyTax },
        { name: 'Home Insurance', value: results.monthlyHomeInsurance },
        { name: 'HOA Fees', value: results.hoaFees },
      ].filter(item => item.value > 0)
    : [];

  const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <form onSubmit={handleSubmit(calculateMortgage)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs Column */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Inputs</h3>
        
        <div>
          <Label htmlFor="homePrice">Home Price ($)</Label>
          <Controller name="homePrice" control={control} render={({ field }) => <Input id="homePrice" type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
          {errors.homePrice && <p className="text-destructive text-sm mt-1">{errors.homePrice.message}</p>}
        </div>

        <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
                <Label htmlFor="downPayment">Down Payment</Label>
                <Controller name="downPayment" control={control} render={({ field }) => <Input id="downPayment" type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
            </div>
            <div>
                <Label>&nbsp;</Label>
                <Controller
                    name="downPaymentType"
                    control={control}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="percent">%</SelectItem>
                                <SelectItem value="amount">$</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                />
            </div>
        </div>
        {watchDownPaymentType === 'percent' 
            ? errors.downPayment && <p className="text-destructive text-sm mt-1">{errors.downPayment.message}</p>
            : (watch('downPayment') > watchHomePrice) && <p className="text-destructive text-sm mt-1">Down payment cannot exceed home price.</p>
        }


        <div>
          <Label htmlFor="loanTerm">Loan Term (years)</Label>
          <Controller name="loanTerm" control={control} render={({ field }) => <Input id="loanTerm" type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} />
          {errors.loanTerm && <p className="text-destructive text-sm mt-1">{errors.loanTerm.message}</p>}
        </div>

        <div>
          <Label htmlFor="interestRate">Interest Rate (%)</Label>
          <Controller name="interestRate" control={control} render={({ field }) => <Input id="interestRate" type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
          {errors.interestRate && <p className="text-destructive text-sm mt-1">{errors.interestRate.message}</p>}
        </div>
        
        <div className="space-y-2 pt-4">
            <h4 className="font-semibold text-muted-foreground">Additional Costs (Optional)</h4>
             <div>
              <Label htmlFor="propertyTax">Annual Property Tax ($)</Label>
              <Controller name="propertyTax" control={control} render={({ field }) => <Input id="propertyTax" type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
              {errors.propertyTax && <p className="text-destructive text-sm mt-1">{errors.propertyTax.message}</p>}
            </div>

            <div>
              <Label htmlFor="homeInsurance">Annual Home Insurance ($)</Label>
              <Controller name="homeInsurance" control={control} render={({ field }) => <Input id="homeInsurance" type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
              {errors.homeInsurance && <p className="text-destructive text-sm mt-1">{errors.homeInsurance.message}</p>}
            </div>

            <div>
              <Label htmlFor="hoaFees">Monthly HOA Fees ($)</Label>
              <Controller name="hoaFees" control={control} render={({ field }) => <Input id="hoaFees" type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
              {errors.hoaFees && <p className="text-destructive text-sm mt-1">{errors.hoaFees.message}</p>}
            </div>
        </div>

        <Button type="submit" className="w-full">Calculate</Button>
      </div>

      {/* Results Column */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Results</h3>
        {results ? (
            results.error ? (
                <Card className="flex items-center justify-center h-60 bg-muted/50 border-dashed">
                    <p className="text-destructive">{results.error}</p>
                </Card>
            ) : (
                <div className="space-y-4">
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-sm text-muted-foreground">Monthly Payment</p>
                            <p className="text-3xl font-bold">{formatCurrency(results.monthlyTotal)}</p>
                            <div className="h-64 mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                                            const radius = innerRadius + (outerRadius - innerRadius) * 1.2;
                                            const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
                                            const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
                                            return (
                                                <text x={x} y={y} fill="currentColor" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs">
                                                {`${(percent * 100).toFixed(0)}%`}
                                                </text>
                                            );
                                        }}>
                                            {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                        <Legend iconSize={10} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4 grid grid-cols-2 gap-2 text-sm">
                            <div><p className="text-muted-foreground">Principal Loan Amount</p><p className="font-semibold">{formatCurrency(results.principal)}</p></div>
                            <div><p className="text-muted-foreground">Down Payment</p><p className="font-semibold">{formatCurrency(results.downPaymentAmount)}</p></div>
                            <div><p className="text-muted-foreground">Total Interest Paid</p><p className="font-semibold">{formatCurrency(results.totalInterestPaid)}</p></div>
                             <div><p className="text-muted-foreground">Total Paid</p><p className="font-semibold">{formatCurrency(results.totalPaid + results.downPaymentAmount)}</p></div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <h4 className="font-semibold mb-2">Amortization Schedule</h4>
                            <ScrollArea className="h-72">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-muted">
                                        <TableRow>
                                            <TableHead className="w-1/4">Month</TableHead>
                                            <TableHead className="w-1/4 text-right">Principal</TableHead>
                                            <TableHead className="w-1/4 text-right">Interest</TableHead>
                                            <TableHead className="w-1/4 text-right">Balance</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {results.amortization.map((row: any) => (
                                            <TableRow key={row.month}>
                                                <TableCell>{row.month}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(row.principalPayment)}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(row.interestPayment)}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(row.remainingBalance)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
            )
        ) : (
             <div className="flex items-center justify-center h-60 bg-muted/50 rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">Enter your details and click calculate</p>
            </div>
        )}
      </div>
    </form>
  );
}
