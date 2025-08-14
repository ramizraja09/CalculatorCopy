
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';


const amortizedSchema = z.object({
  loanAmount: z.number().min(1, 'Loan amount must be greater than 0'),
  loanTerm: z.number().int().min(1, 'Loan term must be at least 1 year'),
  interestRate: z.number().min(0.01, 'Interest rate must be positive'),
  compoundFrequency: z.string().nonempty(),
});

const deferredSchema = z.object({
  loanAmount: z.number().min(1, 'Loan amount must be greater than 0'),
  loanTerm: z.number().int().min(1, 'Loan term must be at least 1 year'),
  interestRate: z.number().min(0.01, 'Interest rate must be positive'),
  compoundFrequency: z.string().nonempty(),
});

type AmortizedFormData = z.infer<typeof amortizedSchema>;
type DeferredFormData = z.infer<typeof deferredSchema>;

const compoundMap: { [key: string]: number } = {
  annually: 1,
  semiannually: 2,
  quarterly: 4,
  monthly: 12,
};

const PIE_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))'];

export default function LoanCalculator() {
  const [amortizedResults, setAmortizedResults] = useState<any>(null);
  const [deferredResults, setDeferredResults] = useState<any>(null);

  const amortizedForm = useForm<AmortizedFormData>({
    resolver: zodResolver(amortizedSchema),
    defaultValues: { loanAmount: 100000, loanTerm: 10, interestRate: 6, compoundFrequency: 'monthly' },
  });

  const deferredForm = useForm<DeferredFormData>({
    resolver: zodResolver(deferredSchema),
    defaultValues: { loanAmount: 100000, loanTerm: 10, interestRate: 6, compoundFrequency: 'annually' },
  });

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const calculateAmortized = (data: AmortizedFormData) => {
    const principal = data.loanAmount;
    const annualRate = data.interestRate / 100;
    const termInYears = data.loanTerm;
    
    // For amortized loans, payments are almost always monthly, regardless of compound frequency.
    const monthlyInterestRate = annualRate / 12;
    const numberOfPayments = termInYears * 12;

    const monthlyPayment = principal * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) / (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);
    
    if (!isFinite(monthlyPayment)) {
      setAmortizedResults({ error: 'Could not calculate monthly payment. Check inputs.' });
      return;
    }

    const totalPaid = monthlyPayment * numberOfPayments;
    const totalInterestPaid = totalPaid - principal;
    
    const schedule = [];
    let remainingBalance = principal;
    for (let i = 1; i <= numberOfPayments; i++) {
        const interestPayment = remainingBalance * monthlyInterestRate;
        const principalPayment = monthlyPayment - interestPayment;
        remainingBalance -= principalPayment;
        schedule.push({ month: i, interestPayment, principalPayment, balance: Math.max(0, remainingBalance) });
    }

    setAmortizedResults({
      monthlyPayment,
      totalInterestPaid,
      totalPaid,
      principal,
      numberOfPayments,
      schedule,
      pieData: [
        { name: 'Principal', value: principal },
        { name: 'Interest', value: totalInterestPaid },
      ],
      error: null,
    });
  };

  const calculateDeferred = (data: DeferredFormData) => {
    const principal = data.loanAmount;
    const annualRate = data.interestRate / 100;
    const termInYears = data.loanTerm;
    const n = compoundMap[data.compoundFrequency];

    const amountDue = principal * Math.pow(1 + annualRate / n, n * termInYears);
    const totalInterest = amountDue - principal;
    
    setDeferredResults({
      amountDue,
      totalInterest,
      principal,
      pieData: [
        { name: 'Principal', value: principal },
        { name: 'Interest', value: totalInterest },
      ],
      error: null
    });
  };

  return (
    <Tabs defaultValue="amortized" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="amortized">Amortized Loan</TabsTrigger>
        <TabsTrigger value="deferred">Deferred Payment Loan</TabsTrigger>
      </TabsList>
      <TabsContent value="amortized" className="mt-6">
        <form onSubmit={amortizedForm.handleSubmit(calculateAmortized)} className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Inputs Column */}
              <div className="space-y-4">
                <Card>
                  <CardHeader><CardTitle>Loan Details</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Loan Amount ($)</Label>
                      <Controller name="loanAmount" control={amortizedForm.control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
                    </div>
                    <div>
                      <Label>Loan Term (years)</Label>
                      <Controller name="loanTerm" control={amortizedForm.control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))} />} />
                    </div>
                    <div>
                      <Label>Interest Rate (APR %)</Label>
                      <Controller name="interestRate" control={amortizedForm.control} render={({ field }) => <Input type="number" step="0.01" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
                    </div>
                    <div>
                        <Label>Pay Back Frequency</Label>
                        <Select defaultValue="monthly" disabled><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="monthly">Every Month</SelectItem></SelectContent></Select>
                    </div>
                  </CardContent>
                </Card>
                <Button type="submit" className="w-full">Calculate</Button>
              </div>

              {/* Results Column */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Results</h3>
                {amortizedResults && !amortizedResults.error ? (
                  <Card>
                    <CardHeader><CardTitle className="text-base text-center text-muted-foreground">Payment Every Month</CardTitle></CardHeader>
                    <CardContent className="text-center">
                      <p className="text-3xl font-bold">{formatCurrency(amortizedResults.monthlyPayment)}</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="flex items-center justify-center h-full bg-muted/50 rounded-lg border border-dashed p-8">
                    <p className="text-sm text-muted-foreground">{amortizedResults?.error || "Enter details to see results"}</p>
                  </div>
                )}
              </div>
            </div>
            {amortizedResults && !amortizedResults.error && (
              <div className="col-span-1 md:col-span-2 mt-8 space-y-8">
                  <div className="grid md:grid-cols-2 gap-8">
                      <Card>
                          <CardHeader><CardTitle className="text-base text-center">Total Cost Breakdown</CardTitle></CardHeader>
                          <CardContent className="h-64">
                              <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                      <Pie data={amortizedResults.pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5}>
                                          {amortizedResults.pieData.map((_entry: any, index: number) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                                      </Pie>
                                      <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                                      <Legend iconType="circle" />
                                  </PieChart>
                              </ResponsiveContainer>
                          </CardContent>
                      </Card>
                      <Card>
                          <CardHeader><CardTitle className="text-base text-center">Loan Balance Over Time</CardTitle></CardHeader>
                          <CardContent className="h-64">
                              <ResponsiveContainer width="100%" height="100%">
                                  <LineChart data={amortizedResults.schedule} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                      <CartesianGrid strokeDasharray="3 3" />
                                      <XAxis dataKey="month" label={{ value: 'Month', position: 'insideBottom', offset: -5 }} />
                                      <YAxis tickFormatter={(value) => formatCurrency(value)} />
                                      <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                                      <Line type="monotone" dataKey="balance" name="Remaining Balance" stroke="hsl(var(--primary))" dot={false} />
                                  </LineChart>
                              </ResponsiveContainer>
                          </CardContent>
                      </Card>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Amortization Schedule</h2>
                    <Card>
                        <CardContent className="p-0">
                            <ScrollArea className="h-[30rem]">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-muted"><TableRow><TableHead className="w-1/4">Month</TableHead><TableHead className="w-1/4 text-right">Principal</TableHead><TableHead className="w-1/4 text-right">Interest</TableHead><TableHead className="w-1/4 text-right">Balance</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {amortizedResults.schedule.map((row: any) => (
                                            <TableRow key={row.month}>
                                                <TableCell>{row.month}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(row.principalPayment)}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(row.interestPayment)}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(row.balance)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                  </div>
              </div>
            )}
        </form>
      </TabsContent>
      <TabsContent value="deferred" className="mt-6">
        <form onSubmit={deferredForm.handleSubmit(calculateDeferred)}>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle>Loan Details</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div><Label>Loan Amount ($)</Label><Controller name="loanAmount" control={deferredForm.control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
                  <div><Label>Loan Term (years)</Label><Controller name="loanTerm" control={deferredForm.control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))} />} /></div>
                  <div><Label>Interest Rate (APY %)</Label><Controller name="interestRate" control={deferredForm.control} render={({ field }) => <Input type="number" step="0.01" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
                  <div>
                    <Label>Compound Frequency</Label>
                    <Controller name="compoundFrequency" control={deferredForm.control} render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{Object.keys(compoundMap).map(freq => <SelectItem key={freq} value={freq} className="capitalize">{freq}</SelectItem>)}</SelectContent></Select>
                    )} />
                  </div>
                </CardContent>
              </Card>
              <Button type="submit" className="w-full">Calculate</Button>
            </div>
             <div className="space-y-4">
                <h3 className="text-xl font-semibold">Results</h3>
                {deferredResults && !deferredResults.error ? (
                  <Card>
                    <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
                    <CardContent className="p-4 space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between items-baseline"><span className="text-muted-foreground">Amount Due at Maturity</span><span className="font-bold text-lg">{formatCurrency(deferredResults.amountDue)}</span></div>
                            <div className="flex justify-between items-baseline"><span className="text-muted-foreground">Total Interest</span><span className="font-bold text-lg">{formatCurrency(deferredResults.totalInterest)}</span></div>
                        </div>
                        <div className="h-48">
                          <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                  <Pie data={deferredResults.pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5}>
                                      {deferredResults.pieData.map((_entry: any, index: number) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                                  </Pie>
                                  <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                                  <Legend iconType="circle" />
                              </PieChart>
                          </ResponsiveContainer>
                        </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="flex items-center justify-center h-full bg-muted/50 rounded-lg border border-dashed p-8">
                    <p className="text-sm text-muted-foreground">{deferredResults?.error || "Enter details to see results"}</p>
                  </div>
                )}
              </div>
          </div>
        </form>
      </TabsContent>
    </Tabs>
  );
}
