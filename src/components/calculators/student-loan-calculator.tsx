
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
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const repaymentSchema = z.object({
  balance: z.number().min(1, 'Balance must be greater than 0'),
  interestRate: z.number().min(0.01, 'Interest rate must be positive'),
  payoffStrategy: z.enum(['fixedPayment', 'targetDate']),
  monthlyPayment: z.number().optional(),
  payoffYears: z.number().int().optional(),
  payoffMonths: z.number().int().optional(),
}).refine(data => {
    if (data.payoffStrategy === 'fixedPayment') return data.monthlyPayment && data.monthlyPayment > 0;
    if (data.payoffStrategy === 'targetDate') return (data.payoffYears && data.payoffYears > 0) || (data.payoffMonths && data.payoffMonths > 0);
    return true;
}, {
    message: "Please provide a valid input for your chosen strategy.",
    path: ["monthlyPayment"],
});

const projectionSchema = z.object({
    yearsToGraduate: z.number().int().min(0),
    estimatedLoanAmount: z.number().min(0),
    currentLoanBalance: z.number().min(0),
    gracePeriod: z.number().int().min(0).default(6),
    interestRate: z.number().min(0.01),
    payInterestInSchool: z.enum(['yes', 'no']),
});

type RepaymentFormData = z.infer<typeof repaymentSchema>;
type ProjectionFormData = z.infer<typeof projectionSchema>;

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
const PIE_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))'];

function RepaymentCalculator() {
    const [results, setResults] = useState<any>(null);
    const { control, handleSubmit, watch, formState: { errors } } = useForm<RepaymentFormData>({
        resolver: zodResolver(repaymentSchema),
        defaultValues: {
            balance: 30000,
            interestRate: 5.5,
            payoffStrategy: 'fixedPayment',
            monthlyPayment: 300,
            payoffYears: 10,
            payoffMonths: 0,
        },
    });

    const payoffStrategy = watch('payoffStrategy');

    const calculatePayoff = (data: RepaymentFormData) => {
        const { balance, interestRate, payoffStrategy, monthlyPayment, payoffYears, payoffMonths } = data;
        const monthlyRate = interestRate / 100 / 12;

        let calculatedMonthlyPayment = 0;
        let totalMonths = 0;
        
        if (payoffStrategy === 'fixedPayment' && monthlyPayment) {
            if(monthlyPayment <= balance * monthlyRate) {
                setResults({ error: 'Monthly payment is too low to cover interest. Increase the payment amount.'});
                return;
            }
            totalMonths = -Math.log(1 - (balance * monthlyRate) / monthlyPayment) / Math.log(1 + monthlyRate);
            calculatedMonthlyPayment = monthlyPayment;
        } else if (payoffStrategy === 'targetDate') {
            const months = (payoffYears || 0) * 12 + (payoffMonths || 0);
            if (months <= 0) {
                setResults({ error: 'Please enter a valid payoff term.'});
                return;
            }
            if (monthlyRate > 0) {
                calculatedMonthlyPayment = (balance * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
            } else {
                calculatedMonthlyPayment = balance / months;
            }
            totalMonths = months;
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
            if (i === finalPaymentMonth) {
                principalPayment = remainingBalance;
            } else {
                principalPayment = calculatedMonthlyPayment - interestPayment;
            }
            remainingBalance -= principalPayment;
            schedule.push({ month: i, payment: calculatedMonthlyPayment, principalPayment, interestPayment, remainingBalance: Math.max(0, remainingBalance) });
        }

        setResults({
            payoffTimeYears: Math.floor(finalPaymentMonth / 12),
            payoffTimeMonths: finalPaymentMonth % 12,
            totalInterest,
            totalPaid,
            monthlyPayment: calculatedMonthlyPayment,
            schedule,
            pieData: [{ name: 'Principal', value: balance }, { name: 'Interest', value: totalInterest }],
            error: null,
        });
    };

    return (
        <form onSubmit={handleSubmit(calculatePayoff)}>
            <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <Card><CardHeader><CardTitle>Loan Details</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div><Label>Loan Balance ($)</Label><Controller name="balance" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
                            <div><Label>Interest Rate (APR %)</Label><Controller name="interestRate" control={control} render={({ field }) => <Input type="number" step="0.01" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Repayment Strategy</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <Controller name="payoffStrategy" control={control} render={({ field }) => (
                                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="space-y-2">
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="fixedPayment" id="fixedPayment" /><Label htmlFor="fixedPayment">Pay a fixed amount per month</Label></div>
                                    {payoffStrategy === 'fixedPayment' && <Controller name="monthlyPayment" control={control} render={({ field }) => <Input type="number" step="10" placeholder="e.g., 300" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />}
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="targetDate" id="targetDate" /><Label htmlFor="targetDate">Pay off by a target date</Label></div>
                                    {payoffStrategy === 'targetDate' && <div className="grid grid-cols-2 gap-2"><Controller name="payoffYears" control={control} render={({ field }) => <Input type="number" placeholder="Years" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))} />} /><Controller name="payoffMonths" control={control} render={({ field }) => <Input type="number" placeholder="Months" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))} />} /></div>}
                                </RadioGroup>
                            )} />
                            {errors.monthlyPayment && <p className="text-destructive text-sm">{errors.monthlyPayment.message}</p>}
                        </CardContent>
                    </Card>
                    <Button type="submit" className="w-full">Calculate Repayment</Button>
                </div>

                <div className="space-y-4">
                    <h3 className="text-xl font-semibold">Repayment Summary</h3>
                    {results && !results.error && (
                        <div className="space-y-4">
                            <Card>
                                <CardContent className="p-4 text-center">
                                    <p className="text-sm text-muted-foreground">You will pay off your loan in</p>
                                    <p className="text-2xl font-bold">
                                        {results.payoffTimeYears > 0 && `${results.payoffTimeYears} ${results.payoffTimeYears === 1 ? 'Year' : 'Years'}`} {results.payoffTimeMonths > 0 && `${results.payoffTimeMonths} ${results.payoffTimeMonths === 1 ? 'Month' : 'Months'}`}
                                    </p>
                                </CardContent>
                            </Card>
                             <Card>
                                <CardContent className="p-4 grid grid-cols-2 gap-2 text-sm">
                                    <div><p className="text-muted-foreground">Your Monthly Payment</p><p className="font-semibold">{formatCurrency(results.monthlyPayment)}</p></div>
                                    <div><p className="text-muted-foreground">Total Payments</p><p className="font-semibold">{formatCurrency(results.totalPaid)}</p></div>
                                    <div><p className="text-muted-foreground">Total Interest</p><p className="font-semibold">{formatCurrency(results.totalInterest)}</p></div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4 h-64">
                                     <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={results.pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5}>
                                                {results.pieData.map((_entry: any, index: number) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                                            </Pie>
                                            <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                            <Legend iconType="circle" />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                    {results?.error && <p className="text-destructive">{results.error}</p>}
                </div>
            </div>

            {results && !results.error && (
                <div className="md:col-span-2 mt-8">
                    <h3 className="text-xl font-semibold mb-4">Amortization Schedule</h3>
                    <Card><CardContent className="p-2"><ScrollArea className="h-96">
                        <Table><TableHeader><TableRow><TableHead>Month</TableHead><TableHead className="text-right">Principal</TableHead><TableHead className="text-right">Interest</TableHead><TableHead className="text-right">Balance</TableHead></TableRow></TableHeader>
                            <TableBody>{results.schedule.map((row: any) => (<TableRow key={row.month}><TableCell>{row.month}</TableCell><TableCell className="text-right">{formatCurrency(row.principalPayment)}</TableCell><TableCell className="text-right">{formatCurrency(row.interestPayment)}</TableCell><TableCell className="text-right">{formatCurrency(row.remainingBalance)}</TableCell></TableRow>))}</TableBody>
                        </Table>
                    </ScrollArea></CardContent></Card>
                </div>
            )}
        </form>
    );
}

function ProjectionCalculator() {
    const [results, setResults] = useState<any>(null);
    const { control, handleSubmit } = useForm<ProjectionFormData>({
        resolver: zodResolver(projectionSchema),
        defaultValues: {
            yearsToGraduate: 2,
            estimatedLoanAmount: 10000,
            currentLoanBalance: 20000,
            gracePeriod: 6,
            interestRate: 5.5,
            payInterestInSchool: 'no',
        },
    });

    const calculateProjection = (data: ProjectionFormData) => {
        const { yearsToGraduate, estimatedLoanAmount, currentLoanBalance, gracePeriod, interestRate, payInterestInSchool } = data;
        
        const monthlyRate = interestRate / 100 / 12;
        let futureBalance = currentLoanBalance;
        let totalBorrowed = currentLoanBalance;

        // Interest accrual during school
        if (payInterestInSchool === 'no') {
            for (let i = 0; i < yearsToGraduate * 12; i++) {
                if (i % 12 === 0) { // Assume loan is disbursed annually
                    futureBalance += estimatedLoanAmount;
                    totalBorrowed += estimatedLoanAmount;
                }
                futureBalance *= (1 + monthlyRate);
            }
        } else {
            futureBalance += estimatedLoanAmount * yearsToGraduate;
            totalBorrowed += estimatedLoanAmount * yearsToGraduate;
        }
        
        const balanceAtGraduation = futureBalance;

        // Interest accrual during grace period
        if (payInterestInSchool === 'no') {
            futureBalance *= Math.pow(1 + monthlyRate, gracePeriod);
        }

        const balanceAfterGrace = futureBalance;
        const totalInterest = balanceAfterGrace - totalBorrowed;

        setResults({
            balanceAtGraduation,
            balanceAfterGrace,
            totalInterest,
            totalBorrowed,
            pieData: [{ name: 'Amount Borrowed', value: totalBorrowed }, { name: 'Interest Accrued', value: totalInterest }],
        });
    };

    return (
        <form onSubmit={handleSubmit(calculateProjection)}>
            <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <Card><CardHeader><CardTitle>Loan Projection Details</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div><Label>Years to Graduate</Label><Controller name="yearsToGraduate" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))} />} /></div>
                                <div><Label>Loan Amount Per Year ($)</Label><Controller name="estimatedLoanAmount" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
                            </div>
                            <div><Label>Current Loan Balance ($)</Label><Controller name="currentLoanBalance" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><Label>Grace Period (Months)</Label><Controller name="gracePeriod" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))} />} /></div>
                                <div><Label>Interest Rate (APR %)</Label><Controller name="interestRate" control={control} render={({ field }) => <Input type="number" step="0.01" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
                            </div>
                            <div><Label>Pay interest while in school?</Label><Controller name="payInterestInSchool" control={control} render={({ field }) => (<RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4 pt-2"><div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="yes" /><Label htmlFor="yes">Yes</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="no" id="no" /><Label htmlFor="no">No</Label></div></RadioGroup>)} /></div>
                        </CardContent>
                    </Card>
                    <Button type="submit" className="w-full">Calculate Projection</Button>
                </div>
                 <div className="space-y-4">
                    <h3 className="text-xl font-semibold">Loan Projection</h3>
                    {results && (
                        <div className="space-y-4">
                            <Card>
                                <CardContent className="p-4 grid grid-cols-2 gap-2 text-sm">
                                    <div><p className="text-muted-foreground">Amount Borrowed</p><p className="font-semibold">{formatCurrency(results.totalBorrowed)}</p></div>
                                    <div><p className="text-muted-foreground">Balance at Graduation</p><p className="font-semibold">{formatCurrency(results.balanceAtGraduation)}</p></div>
                                    <div><p className="text-muted-foreground">Balance after Grace Period</p><p className="font-semibold">{formatCurrency(results.balanceAfterGrace)}</p></div>
                                    <div><p className="text-muted-foreground">Total Interest Accrued</p><p className="font-semibold">{formatCurrency(results.totalInterest)}</p></div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4 h-64">
                                     <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={results.pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5}>
                                                {results.pieData.map((_entry: any, index: number) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                                            </Pie>
                                            <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                            <Legend iconType="circle" />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                 </div>
            </div>
        </form>
    );
}


export default function StudentLoanCalculator() {
    return (
    <Tabs defaultValue="repayment" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="repayment">Repayment</TabsTrigger>
        <TabsTrigger value="projection">Projection</TabsTrigger>
      </TabsList>
      <TabsContent value="repayment" className="mt-6">
        <RepaymentCalculator />
      </TabsContent>
      <TabsContent value="projection" className="mt-6">
        <ProjectionCalculator />
      </TabsContent>
    </Tabs>
  );
}
