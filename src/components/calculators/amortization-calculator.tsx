
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
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';


const formSchema = z.object({
  loanAmount: z.number().min(1, 'Loan amount must be greater than 0'),
  loanTerm: z.number().int().min(1, 'Loan term must be at least 1 year'),
  interestRate: z.number().min(0.01, 'Interest rate must be positive'),
});

type FormData = z.infer<typeof formSchema>;
const PIE_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))'];

export default function AmortizationCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);


  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      loanAmount: 250000,
      loanTerm: 30,
      interestRate: 6.5,
    },
  });

  const calculateAmortization = (data: FormData) => {
    const { loanAmount, loanTerm, interestRate } = data;

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
    
    const schedule = [];
    let remainingBalance = principal;
    let yearlyData: { [key: number]: { interest: number, principal: number, endBalance: number } } = {};

    for (let i = 1; i <= numberOfPayments; i++) {
        const interestPayment = remainingBalance * monthlyInterestRate;
        const principalPayment = monthlyPayment - interestPayment;
        remainingBalance -= principalPayment;
        
        const year = Math.ceil(i / 12);
        if (!yearlyData[year]) {
          yearlyData[year] = { interest: 0, principal: 0, endBalance: 0 };
        }
        yearlyData[year].interest += interestPayment;
        yearlyData[year].principal += principalPayment;
        yearlyData[year].endBalance = remainingBalance > 0 ? remainingBalance : 0;

        schedule.push({
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
      schedule,
      principal,
      yearlyData: Object.entries(yearlyData).map(([year, data]) => ({ year: parseInt(year), ...data })),
      pieData: [
        { name: 'Principal', value: principal },
        { name: 'Total Interest', value: totalInterestPaid },
      ],
      error: null,
    });
    setFormData(data);
  };
  
  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `amortization-calculation.${format}`;
    const { loanAmount, loanTerm, interestRate } = formData;

    if (format === 'txt') {
      content = `Amortization Calculation\n\nInputs:\n`;
      content += `- Loan Amount: ${formatCurrency(loanAmount)}\n- Loan Term: ${loanTerm} years\n- Interest Rate: ${interestRate}%\n\n`;
      content += `Results:\n- Monthly Payment: ${formatCurrency(results.monthlyPayment)}\n- Total Interest Paid: ${formatCurrency(results.totalInterestPaid)}\n- Total Paid: ${formatCurrency(results.totalPaid)}\n\n`;
      content += `Schedule:\nYear,Principal Paid,Interest Paid,Ending Balance\n`;
      results.yearlyData.forEach((row: any) => {
        content += `${row.year},${formatCurrency(row.principal)},${formatCurrency(row.interest)},${formatCurrency(row.endBalance)}\n`;
      });
    } else {
      content = 'Category,Value\nLoan Amount,' + loanAmount + '\nLoan Term (years),' + loanTerm + '\nInterest Rate (%),' + interestRate + '\n\n';
      content += 'Result Category,Value\nMonthly Payment,' + results.monthlyPayment.toFixed(2) + '\nTotal Interest Paid,' + results.totalInterestPaid.toFixed(2) + '\nTotal Paid,' + results.totalPaid.toFixed(2) + '\n\n';
      content += 'Year,Principal Paid,Interest Paid,Ending Balance\n';
      results.yearlyData.forEach((row: any) => {
        content += `${row.year},${row.principal.toFixed(2)},${row.interest.toFixed(2)},${row.endBalance.toFixed(2)}\n`;
      });
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
    <form onSubmit={handleSubmit(calculateAmortization)}>
        <div className="grid md:grid-cols-2 gap-8">
            {/* Inputs Column */}
            <div className="space-y-4">
                <Card>
                    <CardHeader><CardTitle>Loan Details</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="loanAmount">Loan Amount ($)</Label>
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
                    </CardContent>
                </Card>
                
                <div className="flex gap-2">
                    <Button type="submit" className="flex-1">Calculate Schedule</Button>
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
            </div>

            {/* Results Column */}
            <div className="space-y-4">
                <h3 className="text-xl font-semibold">Summary</h3>
                 {results ? (
                    results.error ? (
                        <Card className="flex items-center justify-center h-full min-h-[15rem] bg-muted/50 border-dashed">
                            <p className="text-destructive text-center p-4">{results.error}</p>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            <Card>
                                <CardContent className="p-4 space-y-2">
                                    <div className="flex justify-between"><span>Monthly Payment:</span><span className="font-semibold">{formatCurrency(results.monthlyPayment)}</span></div>
                                    <div className="flex justify-between"><span>Total Interest:</span><span className="font-semibold">{formatCurrency(results.totalInterestPaid)}</span></div>
                                    <div className="flex justify-between"><span>Total Paid:</span><span className="font-semibold">{formatCurrency(results.totalPaid)}</span></div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader><CardTitle className="text-base text-center">Loan Breakdown</CardTitle></CardHeader>
                                <CardContent className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={results.pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5}>
                                                {results.pieData.map((_entry: any, index: number) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                                            </Pie>
                                            <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                                            <Legend iconType="circle" />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </div>
                    )
                ) : (
                    <Card className="flex items-center justify-center h-full min-h-[15rem] bg-muted/50 rounded-lg border border-dashed">
                        <p className="text-sm text-muted-foreground">Enter your loan details to see the summary</p>
                    </Card>
                )}
            </div>
        </div>
        
        {results && !results.error && (
            <div className="md:col-span-2 mt-8 space-y-8">
                <Card>
                    <CardHeader><CardTitle className="text-xl">Amortization Schedule (Annual)</CardTitle></CardHeader>
                    <CardContent className="p-0">
                        <ScrollArea className="h-[40rem]">
                            <Table>
                                <TableHeader className="sticky top-0 bg-muted">
                                    <TableRow>
                                        <TableHead className="w-1/4">Year</TableHead>
                                        <TableHead className="w-1/4 text-right">Principal Paid</TableHead>
                                        <TableHead className="w-1/4 text-right">Interest Paid</TableHead>
                                        <TableHead className="w-1/4 text-right">Ending Balance</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {results.yearlyData.map((row: any) => (
                                        <TableRow key={row.year}>
                                            <TableCell>{row.year}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(row.principal)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(row.interest)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(row.endBalance)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        )}
    </form>
  );
}
