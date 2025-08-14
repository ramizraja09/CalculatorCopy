
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Info, Download } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from 'recharts';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsLineTooltip } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const formSchema = z.object({
  propertyPrice: z.number().min(1, 'Property price must be greater than 0'),
  deposit: z.number().min(0, 'Deposit must be non-negative'),
  loanTerm: z.number().int().min(1, 'Loan term must be at least 1 year'),
  interestRate: z.number().min(0.01, 'Interest rate must be positive'),
}).refine(data => data.deposit < data.propertyPrice, {
    message: "Deposit must be less than the property price.",
    path: ["deposit"],
});

type FormData = z.infer<typeof formSchema>;

// Simplified 2024 UK Stamp Duty Land Tax (SDLT) calculation for England & NI
const calculateStampDuty = (price: number) => {
    let tax = 0;
    if (price > 250000) {
      const band1 = Math.min(price, 925000) - 250000;
      tax += band1 * 0.05;
    }
    if (price > 925000) {
      const band2 = Math.min(price, 1500000) - 925000;
      tax += band2 * 0.10;
    }
    if (price > 1500000) {
      const band3 = price - 1500000;
      tax += band3 * 0.12;
    }
    return tax;
}

const PIE_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))'];

export default function MortgageCalculatorUK() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      propertyPrice: 275000,
      deposit: 55000,
      loanTerm: 25,
      interestRate: 5.5,
    },
  });

  const calculateMortgage = (data: FormData) => {
    const {
      propertyPrice,
      deposit,
      loanTerm,
      interestRate,
    } = data;

    const principal = propertyPrice - deposit;
    const monthlyInterestRate = interestRate / 100 / 12;
    const numberOfPayments = loanTerm * 12;

    const monthlyPayment = principal * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) / (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);
    
    const totalPaid = monthlyPayment * numberOfPayments;
    const totalInterestPaid = totalPaid - principal;
    const stampDuty = calculateStampDuty(propertyPrice);

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
      stampDuty,
      amortization,
      pieData: [
        { name: 'Principal', value: principal },
        { name: 'Total Interest', value: totalInterestPaid },
        { name: 'Stamp Duty', value: stampDuty }
      ],
      error: null,
    });
    setFormData(data);
  };
  
  const formatCurrency = (value: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value);
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `uk-mortgage-calculation.${format}`;
    const { propertyPrice, deposit, loanTerm, interestRate } = formData;

    if (format === 'txt') {
      content = `UK Mortgage Calculation\n\nInputs:\n- Property Price: ${formatCurrency(propertyPrice)}\n- Deposit: ${formatCurrency(deposit)}\n- Loan Term: ${loanTerm} years\n- Interest Rate: ${interestRate}%\n\n`;
      content += `Results:\n- Monthly Payment: ${formatCurrency(results.monthlyPayment)}\n- Loan Amount: ${formatCurrency(results.principal)}\n- Total Interest Paid: ${formatCurrency(results.totalInterestPaid)}\n- Stamp Duty (Est.): ${formatCurrency(results.stampDuty)}\n`;
    } else {
      content = 'Category,Value\n';
      content += `Property Price,${propertyPrice}\nDeposit,${deposit}\nLoan Term (years),${loanTerm}\nInterest Rate (%),${interestRate}\n\n`;
      content += 'Result Category,Value\n';
      content += `Monthly Payment,${results.monthlyPayment.toFixed(2)}\nLoan Amount,${results.principal.toFixed(2)}\nTotal Interest Paid,${results.totalInterestPaid.toFixed(2)}\nStamp Duty (Est.),${results.stampDuty.toFixed(2)}\n`;
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
    <main className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
      {/* Left Pane: Inputs */}
      <section className="md:col-span-1">
        <form onSubmit={handleSubmit(calculateMortgage)} className="space-y-4">
          <Accordion type="single" defaultValue="loan-basics" collapsible className="w-full">
            <AccordionItem value="loan-basics">
              <AccordionTrigger>Mortgage Details</AccordionTrigger>
              <AccordionContent className="space-y-4 px-1">
                <div>
                  <Label>Property Price (£)</Label>
                  <Controller name="propertyPrice" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
                  {errors.propertyPrice && <p className="text-destructive text-sm mt-1">{errors.propertyPrice.message}</p>}
                </div>
                <div>
                  <Label>Deposit (£)</Label>
                  <Controller name="deposit" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
                  {errors.deposit && <p className="text-destructive text-sm mt-1">{errors.deposit.message}</p>}
                </div>
                <div>
                  <Label>Loan Term (years)</Label>
                  <Controller name="loanTerm" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))} />} />
                  {errors.loanTerm && <p className="text-destructive text-sm mt-1">{errors.loanTerm.message}</p>}
                </div>
                <div>
                  <Label>Interest Rate (%)</Label>
                  <Controller name="interestRate" control={control} render={({ field }) => <Input type="number" step="0.01" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
                  {errors.interestRate && <p className="text-destructive text-sm mt-1">{errors.interestRate.message}</p>}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          
          <div className="flex gap-2">
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
        </form>
      </section>

      {/* Center Pane: Key Results & Charts */}
      <section className="md:col-span-1 space-y-4">
        <h2 className="text-xl font-semibold">Summary</h2>
        {results && !results.error ? (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-center text-muted-foreground">Estimated Monthly Payment</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-4xl font-bold">{formatCurrency(results.monthlyPayment)}</p>
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
             <Card>
              <CardHeader><CardTitle className="text-base text-center">Loan & Cost Breakdown</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                 <div className="flex justify-between"><span className="text-muted-foreground">Loan Amount</span><span className="font-semibold">{formatCurrency(results.principal)}</span></div>
                 <div className="flex justify-between"><span className="text-muted-foreground">Total Interest Paid</span><span className="font-semibold">{formatCurrency(results.totalInterestPaid)}</span></div>
                 <div className="flex justify-between"><span className="text-muted-foreground">Stamp Duty Land Tax (Est.)</span><span className="font-semibold">{formatCurrency(results.stampDuty)}</span></div>
                 <div className="flex justify-between font-bold border-t pt-2 mt-2"><span>Total Amount Paid</span><span>{formatCurrency(results.totalPaid + (formData?.deposit || 0))}</span></div>
              </CardContent>
            </Card>
            <Alert variant="default">
                <Info className="h-4 w-4" />
                <AlertTitle>Disclaimer</AlertTitle>
                <AlertDescription className="text-xs">
                  Stamp Duty calculation is an estimate for England/NI and doesn't account for first-time buyer relief or additional property rates. Always consult a professional.
                </AlertDescription>
            </Alert>
          </div>
        ) : (
          <Card className="flex items-center justify-center h-full min-h-[30rem] bg-muted/50 border-dashed">
            <p className="text-sm text-muted-foreground">{results?.error || "Enter details to see results"}</p>
          </Card>
        )}
      </section>
      
      {/* Right Pane: Amortization Schedule */}
      <aside className="md:col-span-2 xl:col-span-1">
        <h2 className="text-xl font-semibold mb-4">Amortization Schedule</h2>
         <Card>
            <CardContent className="p-0">
                <ScrollArea className="h-[40rem]">
                    <Table>
                        <TableHeader className="sticky top-0 bg-muted z-10">
                            <TableRow>
                                <TableHead className="w-1/4">Month</TableHead>
                                <TableHead className="w-1/4 text-right">Principal</TableHead>
                                <TableHead className="w-1/4 text-right">Interest</TableHead>
                                <TableHead className="w-1/4 text-right">Balance</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {results && !results.error ? (
                                results.amortization.map((row: any) => (
                                    <TableRow key={row.month}>
                                        <TableCell>{row.month}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(row.principalPayment)}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(row.interestPayment)}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(row.remainingBalance)}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-96 text-muted-foreground">
                                        Schedule will appear here.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </CardContent>
        </Card>
      </aside>
    </main>
  );
}
