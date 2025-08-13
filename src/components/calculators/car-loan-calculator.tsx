
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

const formSchema = z.object({
  autoPrice: z.number().min(1, 'Auto price must be greater than 0'),
  loanTerm: z.number().int().min(1, 'Loan term must be at least 1 month'),
  interestRate: z.number().min(0, 'Interest rate must be non-negative'),
  cashIncentives: z.number().min(0, 'Cash incentives must be non-negative'),
  downPayment: z.number().min(0, 'Down payment must be non-negative'),
  tradeInValue: z.number().min(0, 'Trade-in value must be non-negative'),
  amountOwedOnTrade: z.number().min(0, 'Amount owed must be non-negative'),
  salesTaxRate: z.number().min(0, 'Sales tax rate must be non-negative'),
  otherFees: z.number().min(0, 'Other fees must be non-negative'),
  includeTaxesInLoan: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

const PIE_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))'];

export default function CarLoanCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      autoPrice: 50000,
      loanTerm: 60,
      interestRate: 5,
      cashIncentives: 0,
      downPayment: 10000,
      tradeInValue: 0,
      amountOwedOnTrade: 0,
      salesTaxRate: 7,
      otherFees: 2000,
      includeTaxesInLoan: false,
    },
  });

  const calculateLoan = (data: FormData) => {
    const {
      autoPrice, loanTerm, interestRate, cashIncentives, downPayment,
      tradeInValue, amountOwedOnTrade, salesTaxRate, otherFees, includeTaxesInLoan
    } = data;
    
    const tradeInEquity = tradeInValue - amountOwedOnTrade;
    const taxableAmount = autoPrice - cashIncentives - tradeInEquity;
    const salesTax = taxableAmount * (salesTaxRate / 100);

    const upfrontPayment = downPayment + tradeInEquity;

    let totalLoanAmount = autoPrice - cashIncentives - downPayment;
    if (includeTaxesInLoan) {
      totalLoanAmount += salesTax + otherFees;
    }

    if (totalLoanAmount <= 0) {
      setResults({ error: 'Loan amount is zero or negative. Adjust price or down payment.' });
      return;
    }
    
    const monthlyInterestRate = interestRate / 100 / 12;
    const numberOfPayments = loanTerm;
    
    let monthlyPayment = 0;
    if (monthlyInterestRate > 0) {
      monthlyPayment = totalLoanAmount * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) / (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);
    } else {
      monthlyPayment = totalLoanAmount / numberOfPayments;
    }

    if (!isFinite(monthlyPayment) || monthlyPayment <= 0) {
      setResults({ error: 'Could not calculate monthly payment. Check interest rate and other inputs.' });
      return;
    }

    const totalPaid = monthlyPayment * numberOfPayments;
    const totalInterestPaid = totalPaid - totalLoanAmount;
    
    let totalCost;
    if (includeTaxesInLoan) {
        totalCost = downPayment + totalPaid;
    } else {
        totalCost = downPayment + totalPaid + salesTax + otherFees;
    }

    const schedule = [];
    let remainingBalance = totalLoanAmount;
    for (let i = 1; i <= numberOfPayments; i++) {
        const interestForMonth = remainingBalance * monthlyInterestRate;
        const principalForMonth = monthlyPayment - interestForMonth;
        remainingBalance -= principalForMonth;
        schedule.push({ month: i, principal: principalForMonth, interest: interestForMonth, balance: remainingBalance > 0 ? remainingBalance : 0 });
    }

    setResults({
      monthlyPayment,
      totalLoanAmount,
      salesTax,
      upfrontPayment: downPayment + (includeTaxesInLoan ? 0 : salesTax + otherFees),
      totalPayments: totalPaid,
      totalInterest: totalInterestPaid,
      totalCost,
      schedule,
      principal: totalLoanAmount,
      error: null,
    });
    setFormData(data);
  };
  
  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `car-loan-calculation.${format}`;
    
    if (format === 'txt') {
      content = `Car Loan Calculation\n\nInputs:\n`;
      Object.entries(formData).forEach(([key, value]) => content += `- ${key}: ${value}\n`);
      content += `\nResults:\n`;
      Object.entries(results).forEach(([key, value]) => {
        if (typeof value === 'number') content += `- ${key}: ${formatCurrency(value)}\n`
      });
    } else {
      content = 'Category,Value\n';
      Object.entries(formData).forEach(([key, value]) => content += `${key},${value}\n`);
      content += '\nResult Category,Value\n';
      Object.entries(results).forEach(([key, value]) => {
         if (typeof value === 'number') content += `${key},${value.toFixed(2)}\n`;
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
    <form onSubmit={handleSubmit(calculateLoan)}>
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Loan Inputs</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Auto Price ($)</Label><Controller name="autoPrice" control={control} render={({ field }) => <Input {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                <div><Label>Loan Term (months)</Label><Controller name="loanTerm" control={control} render={({ field }) => <Input {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Interest Rate (%)</Label><Controller name="interestRate" control={control} render={({ field }) => <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                <div><Label>Cash Incentives ($)</Label><Controller name="cashIncentives" control={control} render={({ field }) => <Input {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Down Payment ($)</Label><Controller name="downPayment" control={control} render={({ field }) => <Input {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                <div><Label>Trade-in Value ($)</Label><Controller name="tradeInValue" control={control} render={({ field }) => <Input {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
              </div>
               <div className="grid grid-cols-2 gap-4">
                <div><Label>Amount Owed on Trade-in ($)</Label><Controller name="amountOwedOnTrade" control={control} render={({ field }) => <Input {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                <div><Label>Sales Tax Rate (%)</Label><Controller name="salesTaxRate" control={control} render={({ field }) => <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
              </div>
              <div><Label>Title, Registration & Other Fees ($)</Label><Controller name="otherFees" control={control} render={({ field }) => <Input {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
              <div className="flex items-center space-x-2">
                <Controller name="includeTaxesInLoan" control={control} render={({ field }) => <Checkbox id="includeTaxesInLoan" checked={field.value} onCheckedChange={field.onChange} />} />
                <Label htmlFor="includeTaxesInLoan">Include taxes and fees in loan</Label>
              </div>
            </CardContent>
          </Card>
          <div className="flex gap-2">
              <Button type="submit" className="flex-1">Calculate</Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="outline" disabled={!results}><Download className="mr-2 h-4 w-4" /> Export</Button></DropdownMenuTrigger>
                <DropdownMenuContent><DropdownMenuItem onClick={() => handleExport('txt')}>Download as .txt</DropdownMenuItem><DropdownMenuItem onClick={() => handleExport('csv')}>Download as .csv</DropdownMenuItem></DropdownMenuContent>
              </DropdownMenu>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Summary</h3>
          {results ? (
              results.error ? (
                  <Card className="flex items-center justify-center h-60 bg-muted/50 border-dashed"><p className="text-destructive text-center p-4">{results.error}</p></Card>
              ) : (
                  <div className="space-y-4">
                      <Card><CardHeader><CardTitle className="text-base text-center text-muted-foreground">Monthly Pay</CardTitle></CardHeader><CardContent className="text-center"><p className="text-3xl font-bold">{formatCurrency(results.monthlyPayment)}</p></CardContent></Card>
                      <Card><CardContent className="p-4 space-y-2 text-sm">
                          <div className="flex justify-between"><span className="text-muted-foreground">Total Loan Amount</span><span>{formatCurrency(results.totalLoanAmount)}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Sale Tax</span><span>{formatCurrency(results.salesTax)}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Upfront Payment</span><span>{formatCurrency(results.upfrontPayment)}</span></div>
                          <div className="flex justify-between font-bold border-t pt-2 mt-2"><span>Total of {formData?.loanTerm} Payments</span><span>{formatCurrency(results.totalPayments)}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Total Loan Interest</span><span>{formatCurrency(results.totalInterest)}</span></div>
                          <div className="flex justify-between font-bold border-t pt-2 mt-2"><span>Total Cost</span><span>{formatCurrency(results.totalCost)}</span></div>
                      </CardContent></Card>
                  </div>
              )
          ) : (
              <div className="flex items-center justify-center h-full min-h-[30rem] bg-muted/50 rounded-lg border border-dashed"><p className="text-sm text-muted-foreground">Enter details and click calculate</p></div>
          )}
        </div>
      </div>
       {results && !results.error && (
        <div className="lg:col-span-2 mt-8 space-y-4">
            <div className="grid md:grid-cols-2 gap-8">
                <Card>
                    <CardHeader><CardTitle className="text-base text-center">Loan Breakdown</CardTitle></CardHeader>
                    <CardContent className="h-64"><ResponsiveContainer width="100%" height="100%">
                        <PieChart><Pie data={[{ name: 'Principal', value: results.principal }, { name: 'Interest', value: results.totalInterest }]} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80}><Cell key="cell-0" fill={PIE_COLORS[0]} /><Cell key="cell-1" fill={PIE_COLORS[1]} /></Pie><RechartsTooltip formatter={(value: number) => formatCurrency(value)} /><Legend /></PieChart>
                    </ResponsiveContainer></CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="text-base text-center">Loan Balance Over Time</CardTitle></CardHeader>
                    <CardContent className="h-64"><ResponsiveContainer width="100%" height="100%">
                        <LineChart data={results.schedule} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis tickFormatter={(value) => formatCurrency(value)} />
                            <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                            <Legend /><Line type="monotone" dataKey="balance" name="Balance" stroke={PIE_COLORS[0]} dot={false} /><Line type="monotone" dataKey="interest" name="Interest Paid" stroke={PIE_COLORS[1]} dot={false} />
                        </LineChart>
                    </ResponsiveContainer></CardContent>
                </Card>
            </div>
            <Card>
                <CardHeader><CardTitle className="text-xl">Amortization Schedule</CardTitle></CardHeader>
                <CardContent className="p-2"><ScrollArea className="h-96">
                    <Table><TableHeader className="sticky top-0 bg-muted"><TableRow><TableHead>Month</TableHead><TableHead className="text-right">Principal</TableHead><TableHead className="text-right">Interest</TableHead><TableHead className="text-right">Ending Balance</TableHead></TableRow></TableHeader>
                        <TableBody>{results.schedule.map((row: any) => (
                            <TableRow key={row.month}><TableCell>{row.month}</TableCell><TableCell className="text-right">{formatCurrency(row.principal)}</TableCell><TableCell className="text-right">{formatCurrency(row.interest)}</TableCell><TableCell className="text-right">{formatCurrency(row.balance)}</TableCell></TableRow>
                        ))}</TableBody>
                    </Table>
                </ScrollArea></CardContent>
            </Card>
        </div>
       )}
    </form>
  );
}

    