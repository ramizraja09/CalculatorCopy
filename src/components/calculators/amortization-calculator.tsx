
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
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsLineTooltip } from 'recharts';


const formSchema = z.object({
  loanAmount: z.number().min(1, 'Loan amount must be greater than 0'),
  loanTerm: z.number().int().min(1, 'Loan term must be at least 1 year'),
  interestRate: z.number().min(0.01, 'Interest rate must be positive'),
});

type FormData = z.infer<typeof formSchema>;

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
    let yearlyData: { [key: number]: { interest: number, principal: number } } = {};

    for (let i = 1; i <= numberOfPayments; i++) {
        const interestPayment = remainingBalance * monthlyInterestRate;
        const principalPayment = monthlyPayment - interestPayment;
        remainingBalance -= principalPayment;
        
        const year = Math.ceil(i / 12);
        if (!yearlyData[year]) {
          yearlyData[year] = { interest: 0, principal: 0 };
        }
        yearlyData[year].interest += interestPayment;
        yearlyData[year].principal += principalPayment;

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
      yearlyData: Object.entries(yearlyData).map(([year, data]) => ({ year: parseInt(year), ...data })),
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
      content += `Schedule:\nYear,Principal Paid,Interest Paid\n`;
      results.yearlyData.forEach((row: any) => {
        content += `${row.year},${formatCurrency(row.principal)},${formatCurrency(row.interest)}\n`;
      });
    } else {
      content = 'Category,Value\nLoan Amount,' + loanAmount + '\nLoan Term (years),' + loanTerm + '\nInterest Rate (%),' + interestRate + '\n\n';
      content += 'Result Category,Value\nMonthly Payment,' + results.monthlyPayment.toFixed(2) + '\nTotal Interest Paid,' + results.totalInterestPaid.toFixed(2) + '\nTotal Paid,' + results.totalPaid.toFixed(2) + '\n\n';
      content += 'Year,Principal Paid,Interest Paid\n';
      results.yearlyData.forEach((row: any) => {
        content += `${row.year},${row.principal.toFixed(2)},${row.interest.toFixed(2)}\n`;
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
    <div className="grid md:grid-cols-2 gap-8">
      {/* Inputs Column */}
      <div className="space-y-4">
        <Card>
            <CardHeader><CardTitle>Loan Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="loanAmount">Loan Amount ($)</Label>
                <Controller name="loanAmount" control={control} render={({ field }) => <Input id="loanAmount" type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
                {errors.loanAmount && <p className="text-destructive text-sm mt-1">{errors.loanAmount.message}</p>}
              </div>

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
            </CardContent>
        </Card>
        
        <div className="flex gap-2">
            <Button type="submit" className="flex-1" onClick={handleSubmit(calculateAmortization)}>Calculate Schedule</Button>
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
        
        {results && !results.error && (
            <Card>
                <CardHeader><CardTitle className="text-base text-center">Loan Balance Over Time</CardTitle></CardHeader>
                <CardContent className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={results.schedule} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" label={{ value: 'Month', position: 'insideBottom', offset: -5 }} />
                            <YAxis tickFormatter={(tick) => formatCurrency(tick)} />
                            <RechartsLineTooltip formatter={(value: number) => formatCurrency(value)} />
                            <Line type="monotone" dataKey="remainingBalance" name="Remaining Balance" stroke="hsl(var(--primary))" dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        )}

      </div>

      {/* Results Column */}
      <div className="space-y-4" data-results-container>
        <h3 className="text-xl font-semibold">Results</h3>
        {results ? (
            results.error ? (
                <Card className="flex items-center justify-center h-60 bg-muted/50 border-dashed">
                    <p className="text-destructive">{results.error}</p>
                </Card>
            ) : (
                <div className="space-y-4">
                    <Card>
                        <CardContent className="p-4 grid grid-cols-3 gap-2 text-center">
                             <div><p className="text-muted-foreground text-sm">Monthly Payment</p><p className="font-semibold text-lg">{formatCurrency(results.monthlyPayment)}</p></div>
                             <div><p className="text-muted-foreground text-sm">Total Interest</p><p className="font-semibold text-lg">{formatCurrency(results.totalInterestPaid)}</p></div>
                             <div><p className="text-muted-foreground text-sm">Total Paid</p><p className="font-semibold text-lg">{formatCurrency(results.totalPaid)}</p></div>
                        </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader><CardTitle>Amortization Schedule</CardTitle></CardHeader>
                      <CardContent className="p-0">
                        <ScrollArea className="h-[40rem]">
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
                                    {results.schedule.map((row: any) => (
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
             <div className="flex items-center justify-center h-full min-h-[30rem] bg-muted/50 rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">Enter your loan details to see the amortization schedule</p>
            </div>
        )}
      </div>
    </form>
  );
}
