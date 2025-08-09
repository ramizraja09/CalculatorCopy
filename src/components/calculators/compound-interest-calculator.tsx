
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const formSchema = z.object({
  initialPrincipal: z.number().min(0, 'Initial principal must be non-negative'),
  monthlyContribution: z.number().min(0, 'Monthly contribution must be non-negative'),
  interestRate: z.number().min(0.01, 'Interest rate must be positive'),
  years: z.number().int().min(1, 'Must invest for at least 1 year'),
  compoundFrequency: z.enum(['annually', 'semiannually', 'quarterly', 'monthly']),
});

type FormData = z.infer<typeof formSchema>;

export default function CompoundInterestCalculator() {
  const [results, setResults] = useState<any>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      initialPrincipal: 1000,
      monthlyContribution: 100,
      interestRate: 7,
      years: 10,
      compoundFrequency: 'annually',
    },
  });

  const calculateCompoundInterest = (data: FormData) => {
    const { initialPrincipal, monthlyContribution, interestRate, years, compoundFrequency } = data;

    const annualRate = interestRate / 100;
    const compoundMap: { [key: string]: number } = {
      annually: 1,
      semiannually: 2,
      quarterly: 4,
      monthly: 12,
    };
    const n = compoundMap[compoundFrequency];
    const schedule = [];
    let futureValue = initialPrincipal;
    let totalInterest = 0;
    let totalContributions = initialPrincipal;
    
    // Calculate future value of the initial principal
    const principalFutureValue = initialPrincipal * Math.pow(1 + annualRate / n, n * years);
    
    // Calculate future value of the series of contributions
    const monthlyRate = annualRate / 12;
    let contributionFutureValue = 0;
    let balance = initialPrincipal;
    
    for (let year = 1; year <= years; year++) {
      let yearEndBalance = balance;
      for (let month = 1; month <= 12; month++) {
        // Add contribution at the beginning of the month
        yearEndBalance += monthlyContribution;
        if (month === 1 && year > 1) { // Add yearly contribution at start of new year
             totalContributions += monthlyContribution * 12;
        } else if (year === 1) {
             totalContributions += monthlyContribution;
        }
      }

      const interestForYear = (yearEndBalance) * Math.pow(1 + annualRate / n, n) - yearEndBalance;
      yearEndBalance += interestForYear;
      balance = yearEndBalance;

      const totalInterestForYear = balance - totalContributions;

      schedule.push({
        year,
        endBalance: balance,
        totalContributions,
        totalInterest: totalInterestForYear > 0 ? totalInterestForYear : 0,
      });
    }

    futureValue = balance;
    totalInterest = futureValue - (initialPrincipal + monthlyContribution * years * 12);

    setResults({
      finalBalance: futureValue,
      totalContributions: initialPrincipal + monthlyContribution * years * 12,
      totalInterest,
      schedule,
      error: null,
    });
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  return (
    <form onSubmit={handleSubmit(calculateCompoundInterest)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs Column */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Inputs</h3>
        
        <div>
          <Label htmlFor="initialPrincipal">Initial Principal ($)</Label>
          <Controller name="initialPrincipal" control={control} render={({ field }) => <Input id="initialPrincipal" type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
          {errors.initialPrincipal && <p className="text-destructive text-sm mt-1">{errors.initialPrincipal.message}</p>}
        </div>

        <div>
          <Label htmlFor="monthlyContribution">Monthly Contribution ($)</Label>
          <Controller name="monthlyContribution" control={control} render={({ field }) => <Input id="monthlyContribution" type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
          {errors.monthlyContribution && <p className="text-destructive text-sm mt-1">{errors.monthlyContribution.message}</p>}
        </div>

        <div>
          <Label htmlFor="interestRate">Annual Interest Rate (%)</Label>
          <Controller name="interestRate" control={control} render={({ field }) => <Input id="interestRate" type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
          {errors.interestRate && <p className="text-destructive text-sm mt-1">{errors.interestRate.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="years">Length of Time (years)</Label>
          <Controller name="years" control={control} render={({ field }) => <Input id="years" type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} />
          {errors.years && <p className="text-destructive text-sm mt-1">{errors.years.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="compoundFrequency">Compound Frequency</Label>
          <Controller name="compoundFrequency" control={control} render={({ field }) => (
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger id="compoundFrequency"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="annually">Annually</SelectItem>
                <SelectItem value="semiannually">Semiannually</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          )} />
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
                            <p className="text-sm text-muted-foreground">Future Value</p>
                            <p className="text-3xl font-bold">{formatCurrency(results.finalBalance)}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 grid grid-cols-2 gap-2 text-sm">
                             <div><p className="text-muted-foreground">Total Contributions</p><p className="font-semibold">{formatCurrency(results.totalContributions)}</p></div>
                             <div><p className="text-muted-foreground">Total Interest</p><p className="font-semibold">{formatCurrency(results.totalInterest)}</p></div>
                        </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-semibold mb-4">Investment Growth Over Time</h4>
                        <div className="h-60">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={[{year: 0, endBalance: results.totalContributions - results.totalInterest},...results.schedule]} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="year" />
                              <YAxis tickFormatter={(value) => formatCurrency(value)} />
                              <Tooltip formatter={(value: number) => formatCurrency(value)} />
                              <Legend />
                              <Line type="monotone" dataKey="endBalance" name="Total Balance" stroke="#8884d8" />
                              <Line type="monotone" dataKey="totalContributions" name="Total Contributions" stroke="#82ca9d" />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-semibold mb-2">Yearly Breakdown</h4>
                         <ScrollArea className="h-48">
                              <Table>
                                  <TableHeader className="sticky top-0 bg-muted">
                                      <TableRow>
                                          <TableHead>Year</TableHead>
                                          <TableHead className="text-right">Contributions</TableHead>
                                          <TableHead className="text-right">Interest</TableHead>
                                          <TableHead className="text-right">End Balance</TableHead>
                                      </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                      {results.schedule.map((row: any) => (
                                          <TableRow key={row.year}>
                                              <TableCell>{row.year}</TableCell>
                                              <TableCell className="text-right">{formatCurrency(row.totalContributions)}</TableCell>
                                              <TableCell className="text-right">{formatCurrency(row.totalInterest)}</TableCell>
                                              <TableCell className="text-right">{formatCurrency(row.endBalance)}</TableCell>
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
                <p className="text-sm text-muted-foreground">Enter your details to calculate your investment growth</p>
            </div>
        )}
      </div>
    </form>
  );
}
