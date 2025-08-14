
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info, Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';


const formSchema = z.object({
  // Current Loan
  currentBalance: z.number().min(1, 'Current balance is required'),
  currentInterestRate: z.number().min(0.01, 'Interest rate must be positive'),
  currentMonthlyPayment: z.number().min(1, 'Monthly payment is required'),
  
  // New Loan
  newInterestRate: z.number().min(0.01, 'New interest rate must be positive'),
  newLoanTerm: z.number().int().min(1, 'New loan term is required'),
  points: z.number().min(0).default(0),
  costsAndFees: z.number().min(0, 'Costs cannot be negative'),
  cashOutAmount: z.number().min(0, 'Cash out cannot be negative'),
});

type FormData = z.infer<typeof formSchema>;
const PIE_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))'];


export default function RefinanceCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currentBalance: 250000,
      currentInterestRate: 7,
      currentMonthlyPayment: 1800,
      newInterestRate: 6.0,
      newLoanTerm: 20,
      points: 2,
      costsAndFees: 1500,
      cashOutAmount: 0,
    },
  });

  const calculateRefinance = (data: FormData) => {
    const {
      currentBalance,
      currentInterestRate,
      currentMonthlyPayment,
      newInterestRate,
      newLoanTerm,
      points,
      costsAndFees,
      cashOutAmount,
    } = data;
    
    const currentMonthlyRate = currentInterestRate / 100 / 12;
    let remainingMonthsCurrent = -Math.log(1 - (currentBalance * currentMonthlyRate) / currentMonthlyPayment) / Math.log(1 + currentMonthlyRate);
    if (!isFinite(remainingMonthsCurrent)) {
        remainingMonthsCurrent = 0; 
    }
    const totalPaidCurrent = remainingMonthsCurrent > 0 ? currentMonthlyPayment * remainingMonthsCurrent : Infinity;

    const newLoanPrincipal = currentBalance + cashOutAmount;
    const pointsCost = newLoanPrincipal * (points / 100);
    const totalClosingCosts = costsAndFees + pointsCost;
    const finalNewPrincipal = newLoanPrincipal + totalClosingCosts;

    const newMonthlyRate = newInterestRate / 100 / 12;
    const newNumberOfPayments = newLoanTerm * 12;
    
    const newMonthlyPayment = finalNewPrincipal * (newMonthlyRate * Math.pow(1 + newMonthlyRate, newNumberOfPayments)) / (Math.pow(1 + newMonthlyRate, newNumberOfPayments) - 1);
    
    if (!isFinite(newMonthlyPayment)) {
        setResults({ error: "Could not calculate the new monthly payment. Check your inputs."});
        return;
    }

    const totalPaidNew = newMonthlyPayment * newNumberOfPayments;
    const totalInterestNew = totalPaidNew - finalNewPrincipal;
    const monthlySavings = currentMonthlyPayment - newMonthlyPayment;
    const lifetimeSavings = totalPaidCurrent - totalPaidNew;
    
    const breakEvenMonths = monthlySavings > 0 ? totalClosingCosts / monthlySavings : Infinity;

    setResults({
        newMonthlyPayment,
        monthlySavings,
        lifetimeSavings,
        breakEvenMonths,
        pieData: [
            { name: 'New Principal', value: finalNewPrincipal },
            { name: 'New Total Interest', value: totalInterestNew },
        ],
        error: null,
    });
    setFormData(data);
  };
  
  const handleClear = () => {
    reset();
    setResults(null);
    setFormData(null);
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `refinance-calculation.${format}`;
    if (format === 'txt') {
        content = `Refinance Calculation\n\nInputs:\n${Object.entries(formData).map(([k,v]) => `- ${k}: ${v}`).join('\n')}\n\nResults:\n${Object.entries(results).filter(([k]) => k !== 'error' && k !== 'pieData').map(([k,v]) => `- ${k}: ${typeof v === 'number' ? v.toFixed(2) : v}`).join('\n')}`;
    } else {
        content = `Category,Value\n${Object.entries(formData).map(([k,v]) => `${k},${v}`).join('\n')}\n\nResult Category,Value\n${Object.entries(results).filter(([k]) => k !== 'error' && k !== 'pieData').map(([k,v]) => `${k},${typeof v === 'number' ? v.toFixed(2) : v}`).join('\n')}`;
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
    <form onSubmit={handleSubmit(calculateRefinance)}>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <Card>
              <CardHeader><CardTitle>Current Loan</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                  <div><Label>Remaining Balance ($)</Label><Controller name="currentBalance" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                  <div><Label>Interest Rate (%)</Label><Controller name="currentInterestRate" control={control} render={({ field }) => <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                  <div><Label>Monthly Payment ($)</Label><Controller name="currentMonthlyPayment" control={control} render={({ field }) => <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
              </CardContent>
          </Card>
          <Card>
              <CardHeader><CardTitle>New Loan</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                  <div><Label>New Loan Term (years)</Label><Controller name="newLoanTerm" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />} /></div>
                  <div><Label>Interest Rate (%)</Label><Controller name="newInterestRate" control={control} render={({ field }) => <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                  <div><Label>Points</Label><Controller name="points" control={control} render={({ field }) => <Input type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                  <div><Label>Costs and Fees ($)</Label><Controller name="costsAndFees" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                  <div><Label>Cash Out Amount ($)</Label><Controller name="cashOutAmount" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
              </CardContent>
          </Card>
          <div className="flex gap-2">
              <Button type="submit" className="flex-1">Calculate Savings</Button>
              <Button type="button" variant="outline" onClick={handleClear}>Clear</Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="outline" disabled={!results}><Download className="mr-2 h-4 w-4" /> Export</Button></DropdownMenuTrigger>
                <DropdownMenuContent><DropdownMenuItem onClick={() => handleExport('txt')}>Download .txt</DropdownMenuItem><DropdownMenuItem onClick={() => handleExport('csv')}>Download .csv</DropdownMenuItem></DropdownMenuContent>
              </DropdownMenu>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Refinance Summary</h3>
          {results ? (
              results.error ? (
                  <Card className="flex items-center justify-center h-60 bg-muted/50 border-dashed"><p className="text-destructive text-center p-4">{results.error}</p></Card>
              ) : (
              <div className="space-y-4">
                  <Card><CardContent className="p-4 grid grid-cols-2 gap-4 text-center">
                      <div><p className="text-muted-foreground">New Monthly Payment</p><p className="font-semibold text-xl">{formatCurrency(results.newMonthlyPayment)}</p></div>
                      <div><p className="text-muted-foreground">Monthly Savings</p><p className={`font-semibold text-xl ${results.monthlySavings > 0 ? 'text-green-600' : 'text-destructive'}`}>{formatCurrency(results.monthlySavings)}</p></div>
                  </CardContent></Card>
                  <Card><CardContent className="p-4 text-center"><p className="text-muted-foreground">Potential Lifetime Savings</p><p className={`font-bold text-3xl ${results.lifetimeSavings > 0 ? 'text-green-600' : 'text-destructive'}`}>{formatCurrency(results.lifetimeSavings)}</p></CardContent></Card>
                   <Card>
                      <CardHeader><CardTitle className="text-base text-center">New Loan Breakdown</CardTitle></CardHeader>
                      <CardContent className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                  <Pie data={results.pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5}>
                                      {results.pieData.map((_entry: any, index: number) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                                  </Pie>
                                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                  <Legend iconType="circle" />
                              </PieChart>
                          </ResponsiveContainer>
                      </CardContent>
                  </Card>
                  <Alert><Info className="h-4 w-4" /><AlertTitle>Break-Even Point</AlertTitle><AlertDescription className="text-xs">{isFinite(results.breakEvenMonths) ? `It will take approximately ${Math.ceil(results.breakEvenMonths)} months to recoup the closing costs.` : `You won't save money monthly, so a break-even point cannot be calculated.`}</AlertDescription></Alert>
              </div>
          )) : (
              <div className="flex items-center justify-center h-60 bg-muted/50 rounded-lg border border-dashed"><p className="text-sm text-muted-foreground">Enter your loan details to compare</p></div>
          )}
        </div>
      </div>
    </form>
  );
}
