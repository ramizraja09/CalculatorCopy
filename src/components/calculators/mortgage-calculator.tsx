
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from 'recharts';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsLineTooltip } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const formSchema = z.object({
  homePrice: z.number().min(1, 'Home price must be greater than 0'),
  downPayment: z.number().min(0, 'Down payment must be non-negative'),
  downPaymentType: z.enum(['percent', 'amount']),
  loanTerm: z.number().int().min(1, 'Loan term must be at least 1 year'),
  interestRate: z.number().min(0.01, 'Interest rate must be positive'),
  propertyTax: z.number().min(0, 'Property tax must be non-negative'),
  homeInsurance: z.number().min(0, 'Home insurance must be non-negative'),
  hoaFees: z.number().min(0, 'HOA fees must be non-negative'),
}).refine(data => {
    if (data.downPaymentType === 'percent') {
        return data.downPayment >= 0 && data.downPayment <= 100;
    }
    return data.downPayment < data.homePrice;
}, {
    message: "Down payment is invalid.",
    path: ["downPayment"],
});


type FormData = z.infer<typeof formSchema>;

export default function MortgageCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);


  const { control, watch, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      homePrice: 350000,
      downPayment: 20,
      downPaymentType: 'percent',
      loanTerm: 30,
      interestRate: 6.5,
      propertyTax: 4200, // 1.2% of 350k
      homeInsurance: 1750, // 0.5% of 350k
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

    const monthlyPrincipalAndInterest = monthlyInterestRate > 0 ?
      principal * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) / (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1)
      : principal / numberOfPayments;

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
    setFormData(data);
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

  const PIE_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `mortgage-calculation.${format}`;
    const { homePrice, downPayment, downPaymentType, loanTerm, interestRate, propertyTax, homeInsurance, hoaFees } = formData;

    if (format === 'txt') {
      content = `Mortgage Calculation\n\nInputs:\n`;
      content += `- Home Price: ${formatCurrency(homePrice)}\n- Down Payment: ${downPayment} ${downPaymentType === 'percent' ? '%' : '$'}\n- Loan Term: ${loanTerm} years\n- Interest Rate: ${interestRate}%\n`;
      content += `- Annual Property Tax: ${formatCurrency(propertyTax)}\n- Annual Home Insurance: ${formatCurrency(homeInsurance)}\n- Monthly HOA: ${formatCurrency(hoaFees)}\n\n`;
      content += `Results:\n- Monthly Payment: ${formatCurrency(results.monthlyTotal)}\n- Loan Amount: ${formatCurrency(results.principal)}\n- Total Interest Paid: ${formatCurrency(results.totalInterestPaid)}\n`;
    } else {
      content = 'Category,Value\n';
      content += `Home Price,${homePrice}\nDown Payment,${downPayment}\nDown Payment Type,${downPaymentType}\nLoan Term (years),${loanTerm}\nInterest Rate (%),${interestRate}\n`;
      content += `Annual Property Tax,${propertyTax}\nAnnual Home Insurance,${homeInsurance}\nMonthly HOA,${hoaFees}\n\n`;
      content += 'Result Category,Value\n';
      content += `Monthly Payment,${results.monthlyTotal.toFixed(2)}\nLoan Amount,${results.principal.toFixed(2)}\nTotal Interest Paid,${results.totalInterestPaid.toFixed(2)}\n`;
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
    <main className="space-y-8">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Left Pane: Inputs */}
        <section>
          <form onSubmit={handleSubmit(calculateMortgage)} className="space-y-4">
            <Accordion type="multiple" defaultValue={['loan-basics', 'costs']} className="w-full">
              <AccordionItem value="loan-basics">
                <AccordionTrigger>Loan Basics</AccordionTrigger>
                <AccordionContent className="space-y-4 px-1 pt-4">
                  <div>
                    <Label htmlFor="homePrice">Home Price ($)</Label>
                    <Controller name="homePrice" control={control} render={({ field }) => <Input id="homePrice" type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
                    {errors.homePrice && <p className="text-destructive text-sm mt-1">{errors.homePrice.message}</p>}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                          <Label htmlFor="downPayment">Down Payment</Label>
                          <Controller name="downPayment" control={control} render={({ field }) => <Input id="downPayment" type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
                      </div>
                      <div>
                          <Label>&nbsp;</Label>
                          <Controller name="downPaymentType" control={control} render={({ field }) => (
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
                   {errors.downPayment && <p className="text-destructive text-sm mt-1 col-span-3">{errors.downPayment.message}</p>}
                   <div>
                    <Label htmlFor="loanTerm">Loan Term (years)</Label>
                    <Controller name="loanTerm" control={control} render={({ field }) => <Input id="loanTerm" type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))} />} />
                  </div>
                  <div>
                    <Label htmlFor="interestRate">Interest Rate (%)</Label>
                    <Controller name="interestRate" control={control} render={({ field }) => <Input id="interestRate" type="number" step="0.01" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="costs">
                <AccordionTrigger>Costs & Escrows</AccordionTrigger>
                <AccordionContent className="space-y-4 px-1 pt-4">
                   <div>
                      <Label htmlFor="propertyTax">Annual Property Tax ($)</Label>
                      <Controller name="propertyTax" control={control} render={({ field }) => <Input id="propertyTax" type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
                  </div>
                  <div>
                      <Label htmlFor="homeInsurance">Annual Home Insurance ($)</Label>
                      <Controller name="homeInsurance" control={control} render={({ field }) => <Input id="homeInsurance" type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
                  </div>
                  <div>
                      <Label htmlFor="hoaFees">Monthly HOA Fees ($)</Label>
                      <Controller name="hoaFees" control={control} render={({ field }) => <Input id="hoaFees" type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            <div className="flex gap-2 pt-4">
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

        {/* Right Pane: Key Results & Charts */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Summary</h2>
          {results && !results.error ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base text-center text-muted-foreground">Estimated Monthly Payment</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-4xl font-bold">{formatCurrency(results.monthlyTotal)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base text-center">Monthly Breakdown</CardTitle></CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                          <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8">
                              {pieData.map((_entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                          </Pie>
                          <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                          <Legend iconSize={10} />
                      </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base text-center">Loan Balance Over Time</CardTitle></CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={results.amortization} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" label={{ value: 'Month', position: 'insideBottom', offset: -5 }} />
                          <YAxis tickFormatter={(value) => formatCurrency(value)} />
                          <RechartsLineTooltip formatter={(value: number) => formatCurrency(value)} />
                          <Line type="monotone" dataKey="remainingBalance" name="Remaining Balance" stroke="hsl(var(--primary))" dot={false} />
                      </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="flex items-center justify-center h-full min-h-[30rem] bg-muted/50 border-dashed">
              <p className="text-sm text-muted-foreground">{results?.error || "Enter details to see results"}</p>
            </Card>
          )}
        </section>
      </div>
      
      {/* Bottom Pane: Amortization Schedule */}
      <section className="col-span-1 md:col-span-2">
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
      </section>
    </main>
  );
}
