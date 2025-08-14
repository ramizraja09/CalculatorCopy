
"use client";

import { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const itemSchema = z.object({
  name: z.string(),
  amount: z.number().min(0),
  period: z.enum(['month', 'year']),
});

const formSchema = z.object({
  incomes: z.array(itemSchema),
  expenses: z.array(itemSchema),
});

type FormData = z.infer<typeof formSchema>;

const defaultValues = {
  incomes: [
    { name: 'Salary & Earned Income', amount: 80000, period: 'year' },
    { name: 'Pension & Social Security', amount: 0, period: 'year' },
    { name: 'Investments & Savings', amount: 1000, period: 'year' },
    { name: 'Other Income', amount: 2000, period: 'year' },
  ],
  expenses: [
    // Housing
    { name: 'Mortgage/Rent', amount: 1400, period: 'month' },
    { name: 'Property Tax', amount: 0, period: 'year' },
    { name: 'Insurance', amount: 200, period: 'year' },
    { name: 'HOA/Co-Op Fee', amount: 0, period: 'year' },
    { name: 'Utilities', amount: 250, period: 'month' },
    // Transport
    { name: 'Auto Loan', amount: 250, period: 'month' },
    { name: 'Auto Insurance', amount: 700, period: 'year' },
    { name: 'Gasoline', amount: 100, period: 'month' },
    // Other Debt
    { name: 'Credit Card', amount: 0, period: 'month' },
    { name: 'Student Loan', amount: 250, period: 'month' },
    // Living
    { name: 'Food', amount: 400, period: 'month' },
    { name: 'Entertainment', amount: 100, period: 'month' },
     // Savings
    { name: '401k & IRA', amount: 10000, period: 'year' },
    { name: 'Other Savings', amount: 0, period: 'month' },
  ]
};

const PIE_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', '#ffc658', '#d0ed57', '#a4de6c'];

const getMonthlyValue = (amount: number, period: 'month' | 'year') => {
  return period === 'year' ? amount / 12 : amount;
};

export default function BudgetCalculator() {
  const [results, setResults] = useState<any>(null);

  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues,
  });

  const { fields: incomeFields } = useFieldArray({ control, name: "incomes" });
  const { fields: expenseFields } = useFieldArray({ control, name: "expenses" });

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const processSubmit = (data: FormData) => {
    const totalMonthlyIncome = data.incomes.reduce((acc, income) => acc + getMonthlyValue(income.amount, income.period), 0);
    const totalMonthlyExpenses = data.expenses.reduce((acc, expense) => acc + getMonthlyValue(expense.amount, expense.period), 0);
    const remainingBalance = totalMonthlyIncome - totalMonthlyExpenses;
    
    setResults({
        totalMonthlyIncome,
        totalMonthlyExpenses,
        remainingBalance,
        pieData: data.expenses.filter(e => e.amount > 0).map(e => ({ name: e.name, value: getMonthlyValue(e.amount, e.period) })),
    });
  };

  return (
    <form onSubmit={handleSubmit(processSubmit)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs Column */}
      <div className="space-y-4">
        <Accordion type="multiple" defaultValue={['incomes', 'expenses']} className="w-full">
            <AccordionItem value="incomes">
                <AccordionTrigger className="text-xl font-semibold">Incomes (Before Tax)</AccordionTrigger>
                <AccordionContent className="space-y-2 pt-2">
                     {incomeFields.map((field, index) => (
                        <div key={field.id} className="grid grid-cols-[1fr,100px,80px] gap-2 items-center">
                            <Label>{field.name}</Label>
                            <Controller name={`incomes.${index}.amount`} control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
                            <Controller name={`incomes.${index}.period`} control={control} render={({ field }) => (
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent><SelectItem value="month">/month</SelectItem><SelectItem value="year">/year</SelectItem></SelectContent>
                                </Select>
                            )} />
                        </div>
                    ))}
                </AccordionContent>
            </AccordionItem>
             <AccordionItem value="expenses">
                <AccordionTrigger className="text-xl font-semibold">Expenses</AccordionTrigger>
                <AccordionContent className="space-y-2 pt-2">
                     {expenseFields.map((field, index) => (
                        <div key={field.id} className="grid grid-cols-[1fr,100px,80px] gap-2 items-center">
                            <Label>{field.name}</Label>
                            <Controller name={`expenses.${index}.amount`} control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
                            <Controller name={`expenses.${index}.period`} control={control} render={({ field }) => (
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent><SelectItem value="month">/month</SelectItem><SelectItem value="year">/year</SelectItem></SelectContent>
                                </Select>
                            )} />
                        </div>
                    ))}
                </AccordionContent>
            </AccordionItem>
        </Accordion>
        
        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Calculate Budget</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={!results}>
                  <Download className="mr-2 h-4 w-4" /> Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {/* Export logic can be added here */}
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>

      {/* Results Column */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Budget Summary</h3>
        {results ? (
            <div className="space-y-4">
                 <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-sm text-muted-foreground">Remaining Balance (Monthly)</p>
                        <p className={`text-3xl font-bold ${results.remainingBalance >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                            {formatCurrency(results.remainingBalance)}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 grid grid-cols-2 gap-2 text-sm">
                         <div><p className="text-muted-foreground">Total Income</p><p className="font-semibold">{formatCurrency(results.totalMonthlyIncome)}/mo</p></div>
                         <div><p className="text-muted-foreground">Total Expenses</p><p className="font-semibold">{formatCurrency(results.totalMonthlyExpenses)}/mo</p></div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle className="text-base text-center">Expense Breakdown</CardTitle></CardHeader>
                    <CardContent className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={results.pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8">
                                    {results.pieData.map((_entry: any, index: number) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                                </Pie>
                                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                <Legend iconSize={10} layout="vertical" align="right" verticalAlign="middle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                 </Card>
            </div>
        ) : (
             <div className="flex items-center justify-center h-60 bg-muted/50 rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">Enter your income and expenses to see your budget</p>
            </div>
        )}
      </div>
    </form>
  );
}
