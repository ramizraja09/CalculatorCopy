
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const formSchema = z.object({
  vehiclePrice: z.number().min(1, 'Vehicle price must be greater than 0'),
  loanTerm: z.number().int().min(1, 'Loan term must be at least 1 year'),
  interestRate: z.number().min(0, 'Interest rate must be non-negative'),
  downPayment: z.number().min(0, 'Down payment must be non-negative'),
  tradeInValue: z.number().min(0, 'Trade-in value must be non-negative'),
  salesTaxRate: z.number().min(0, 'Sales tax rate must be non-negative'),
});

type FormData = z.infer<typeof formSchema>;

export default function CarLoanCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);


  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vehiclePrice: 25000,
      loanTerm: 5,
      interestRate: 4.5,
      downPayment: 5000,
      tradeInValue: 0,
      salesTaxRate: 6,
    },
  });

  const calculateLoan = (data: FormData) => {
    const {
      vehiclePrice,
      loanTerm,
      interestRate,
      downPayment,
      tradeInValue,
      salesTaxRate,
    } = data;
    
    const salesTaxAmount = (vehiclePrice - tradeInValue) * (salesTaxRate / 100);
    const totalAmount = vehiclePrice + salesTaxAmount;
    const principal = totalAmount - downPayment - tradeInValue;

    if (principal <= 0) {
      setResults({ error: 'Loan amount is zero or negative. Adjust price, down payment, or trade-in.' });
      return;
    }

    const monthlyInterestRate = interestRate / 100 / 12;
    const numberOfPayments = loanTerm * 12;

    const monthlyPayment = principal * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) / (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);

    if (!isFinite(monthlyPayment) || monthlyPayment <= 0) {
      setResults({ error: 'Could not calculate monthly payment. Check interest rate and other inputs.' });
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
      salesTaxAmount,
      totalAmount,
      downPayment,
      tradeInValue,
      amortization,
      error: null,
    });
    setFormData(data);
  };
  
  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const pieData = results && !results.error
    ? [
        { name: 'Principal', value: results.principal },
        { name: 'Total Interest', value: results.totalInterestPaid },
        { name: 'Sales Tax', value: results.salesTaxAmount },
      ].filter(item => item.value > 0)
    : [];

  const PIE_COLORS = ['#0088FE', '#FF8042', '#00C49F'];
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `car-loan-calculation.${format}`;
    const { vehiclePrice, loanTerm, interestRate, downPayment, tradeInValue, salesTaxRate } = formData;

    if (format === 'txt') {
      content = `Car Loan Calculation\n\nInputs:\n`;
      content += `- Vehicle Price: ${formatCurrency(vehiclePrice)}\n- Loan Term: ${loanTerm} years\n- Interest Rate: ${interestRate}%\n`;
      content += `- Down Payment: ${formatCurrency(downPayment)}\n- Trade-in Value: ${formatCurrency(tradeInValue)}\n- Sales Tax Rate: ${salesTaxRate}%\n\n`;
      content += `Results:\n- Monthly Payment: ${formatCurrency(results.monthlyPayment)}\n- Total Loan Amount: ${formatCurrency(results.principal)}\n`;
      content += `- Sales Tax: ${formatCurrency(results.salesTaxAmount)}\n- Total Interest Paid: ${formatCurrency(results.totalInterestPaid)}\n`;
    } else {
      content = 'Category,Value\n';
      content += `Vehicle Price,${vehiclePrice}\nLoan Term (years),${loanTerm}\nInterest Rate (%),${interestRate}\n`;
      content += `Down Payment,${downPayment}\nTrade-in Value,${tradeInValue}\nSales Tax Rate (%),${salesTaxRate}\n\n`;
      content += 'Result Category,Value\n';
      content += `Monthly Payment,${results.monthlyPayment.toFixed(2)}\nTotal Loan Amount,${results.principal.toFixed(2)}\nSales Tax,${results.salesTaxAmount.toFixed(2)}\nTotal Interest Paid,${results.totalInterestPaid.toFixed(2)}\n`;
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
    <form onSubmit={handleSubmit(calculateLoan)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs Column */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Inputs</h3>
        
        <div>
          <Label htmlFor="vehiclePrice">Vehicle Price ($)</Label>
          <Controller name="vehiclePrice" control={control} render={({ field }) => <Input id="vehiclePrice" type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
          {errors.vehiclePrice && <p className="text-destructive text-sm mt-1">{errors.vehiclePrice.message}</p>}
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
        
        <div className="space-y-2 pt-4">
          <h4 className="font-semibold text-muted-foreground">Additional Details (Optional)</h4>
          <div>
            <Label htmlFor="downPayment">Down Payment ($)</Label>
            <Controller name="downPayment" control={control} render={({ field }) => <Input id="downPayment" type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
            {errors.downPayment && <p className="text-destructive text-sm mt-1">{errors.downPayment.message}</p>}
          </div>

          <div>
            <Label htmlFor="tradeInValue">Trade-in Value ($)</Label>
            <Controller name="tradeInValue" control={control} render={({ field }) => <Input id="tradeInValue" type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
            {errors.tradeInValue && <p className="text-destructive text-sm mt-1">{errors.tradeInValue.message}</p>}
          </div>
          
          <div>
            <Label htmlFor="salesTaxRate">Sales Tax Rate (%)</Label>
            <Controller name="salesTaxRate" control={control} render={({ field }) => <Input id="salesTaxRate" type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
            {errors.salesTaxRate && <p className="text-destructive text-sm mt-1">{errors.salesTaxRate.message}</p>}
          </div>
        </div>
        
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
      </div>

      {/* Results Column */}
      <div className="space-y-4" data-results-container>
        <h3 className="text-xl font-semibold">Results</h3>
        {results ? (
            results.error ? (
                <Card className="flex items-center justify-center h-60 bg-muted/50 border-dashed">
                    <p className="text-destructive text-center">{results.error}</p>
                </Card>
            ) : (
                <div className="space-y-4">
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-sm text-muted-foreground">Monthly Payment</p>
                            <p className="text-3xl font-bold">{formatCurrency(results.monthlyPayment)}</p>
                        </CardContent>
                    </Card>
                    
                    <Card>
                         <CardContent className="p-4">
                            <div className="h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} fill="#8884d8">
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
                            <div><p className="text-muted-foreground">Total Loan Amount</p><p className="font-semibold">{formatCurrency(results.principal)}</p></div>
                            <div><p className="text-muted-foreground">Sales Tax</p><p className="font-semibold">{formatCurrency(results.salesTaxAmount)}</p></div>
                            <div><p className="text-muted-foreground">Total Interest Paid</p><p className="font-semibold">{formatCurrency(results.totalInterestPaid)}</p></div>
                            <div><p className="text-muted-foreground">Total Paid</p><p className="font-semibold">{formatCurrency(results.totalPaid + results.downPayment + results.tradeInValue)}</p></div>
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
