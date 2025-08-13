
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

const formSchema = z.object({
  loanAmount: z.number().min(1, 'Loan amount must be greater than 0'),
  loanTerm: z.number().int().min(1, 'Loan term must be at least 1 year'),
  interestRate: z.number().min(0.01, 'Interest rate must be positive'),
});

type FormData = z.infer<typeof formSchema>;

export default function LoanCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      loanAmount: 10000,
      loanTerm: 5,
      interestRate: 5,
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
    setFormData(data);
  };
  
  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `loan-calculation.${format}`;
    const { loanAmount, loanTerm, interestRate } = formData;

    if (format === 'txt') {
      content = `Loan Calculation\n\nInputs:\n- Loan Amount: ${formatCurrency(loanAmount)}\n- Loan Term: ${loanTerm} years\n- Interest Rate: ${interestRate}%\n\n`;
      content += `Results:\n- Monthly Payment: ${formatCurrency(results.monthlyPayment)}\n- Total Interest Paid: ${formatCurrency(results.totalInterestPaid)}\n- Total Paid: ${formatCurrency(results.totalPaid)}\n`;
    } else {
      content = 'Category,Value\n';
      content += `Loan Amount,${loanAmount}\nLoan Term (years),${loanTerm}\nInterest Rate (%),${interestRate}\n\n`;
      content += 'Result Category,Value\n';
      content += `Monthly Payment,${results.monthlyPayment.toFixed(2)}\nTotal Interest Paid,${results.totalInterestPaid.toFixed(2)}\nTotal Paid,${results.totalPaid.toFixed(2)}\n`;
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
    <form onSubmit={handleSubmit(calculateLoan)}>
      <div className="grid md:grid-cols-2 gap-8">
        {/* Inputs Column */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Loan Details</CardTitle>
            </CardHeader>
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
              
              <div className="flex gap-2 pt-2">
                  <Button type="submit" className="flex-1">Calculate</Button>
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
            </CardContent>
          </Card>
        </div>

        {/* Results Column */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Summary</h2>
          {results ? (
              results.error ? (
                  <Card className="flex items-center justify-center h-full min-h-64 bg-muted/50 border-dashed">
                      <p className="text-destructive text-center p-4">{results.error}</p>
                  </Card>
              ) : (
                  <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <Card>
                              <CardHeader><CardTitle className="text-sm text-muted-foreground">Monthly Payment</CardTitle></CardHeader>
                              <CardContent><p className="text-lg font-bold break-all">{formatCurrency(results.monthlyPayment)}</p></CardContent>
                          </Card>
                          <Card>
                              <CardHeader><CardTitle className="text-sm text-muted-foreground">Total Interest</CardTitle></CardHeader>
                              <CardContent><p className="text-lg font-bold break-all">{formatCurrency(results.totalInterestPaid)}</p></CardContent>
                          </Card>
                          <Card>
                              <CardHeader><CardTitle className="text-sm text-muted-foreground">Total Paid</CardTitle></CardHeader>
                              <CardContent><p className="text-lg font-bold break-all">{formatCurrency(results.totalPaid)}</p></CardContent>
                          </Card>
                      </div>
                  </div>
              )
          ) : (
              <Card className="flex items-center justify-center h-full min-h-64 bg-muted/50 border-dashed">
                  <p className="text-sm text-muted-foreground">Enter loan details to see the payment plan</p>
              </Card>
          )}
        </div>
      </div>
      {results && !results.error && (
        <div className="col-span-1 md:col-span-2 mt-8">
            <h2 className="text-xl font-semibold mb-4">Amortization Schedule</h2>
            <Card>
                <CardContent className="p-0">
                    <ScrollArea className="h-[30rem]">
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
      )}
    </form>
  );
}
