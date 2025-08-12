
"use client";

import { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Trash, Download } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const expenseSchema = z.object({
  name: z.string().nonempty('Expense name is required'),
  amount: z.number().min(0, 'Amount must be non-negative'),
});

const formSchema = z.object({
  monthlyIncome: z.number().min(0, 'Income cannot be negative'),
  expenses: z.array(expenseSchema),
});

type FormData = z.infer<typeof formSchema>;

const defaultExpenses = [
    { name: 'Rent/Mortgage', amount: 1500 },
    { name: 'Utilities', amount: 200 },
    { name: 'Groceries', amount: 400 },
    { name: 'Transportation', amount: 150 },
    { name: 'Phone/Internet', amount: 100 },
];

const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ffc658', '#d0ed57', '#a4de6c'];

export default function BudgetCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, watch } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      monthlyIncome: 5000,
      expenses: defaultExpenses,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "expenses",
  });

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const processSubmit = (data: FormData) => {
    const totalExpenses = data.expenses.reduce((acc, expense) => acc + expense.amount, 0);
    const remainingBalance = data.monthlyIncome - totalExpenses;
    setResults({
        totalIncome: data.monthlyIncome,
        totalExpenses,
        remainingBalance,
        pieData: data.expenses.filter(e => e.amount > 0).map(e => ({ name: e.name, value: e.amount })),
    });
    setFormData(data);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `budget-calculation.${format}`;

    if (format === 'txt') {
      content = `Budget Calculation\n\n`;
      content += `Monthly Income: ${formatCurrency(formData.monthlyIncome)}\n\n`;
      content += `Expenses:\n`;
      formData.expenses.forEach(item => {
        content += `- ${item.name}: ${formatCurrency(item.amount)}\n`;
      });
      content += `\nResults:\n`;
      content += `- Total Expenses: ${formatCurrency(results.totalExpenses)}\n`;
      content += `- Remaining Balance: ${formatCurrency(results.remainingBalance)}\n`;
    } else {
      content = 'Category,Value\n';
      content += `Monthly Income,${formData.monthlyIncome}\n\n`;
      content += `Expense,Amount\n`;
       formData.expenses.forEach(item => {
        content += `"${item.name}",${item.amount}\n`;
      });
      content += `\nResult Category,Value\n`;
      content += `Total Expenses,${results.totalExpenses}\n`;
      content += `Remaining Balance,${results.remainingBalance}\n`;
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
    <form onSubmit={handleSubmit(processSubmit)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs Column */}
      <div className="space-y-4">
        <Card>
            <CardHeader><CardTitle>Monthly Income</CardTitle></CardHeader>
            <CardContent>
                <Label htmlFor="monthlyIncome">Total Monthly Net Income ($)</Label>
                <Controller name="monthlyIncome" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
            </CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle>Monthly Expenses</CardTitle></CardHeader>
            <CardContent className="space-y-2">
                {fields.map((field, index) => (
                    <div key={field.id} className="flex gap-2 items-center">
                        <Controller name={`expenses.${index}.name`} control={control} render={({ field }) => <Input placeholder="Expense Name" {...field} />} />
                        <Controller name={`expenses.${index}.amount`} control={control} render={({ field }) => <Input type="number" placeholder="Amount" className="w-32" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash className="h-4 w-4" /></Button>
                    </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => append({ name: '', amount: 0 })}>Add Expense</Button>
            </CardContent>
        </Card>
        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Calculate Budget</Button>
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
        <h3 className="text-xl font-semibold">Budget Summary</h3>
        {results ? (
            <div className="space-y-4">
                 <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-sm text-muted-foreground">Remaining Balance</p>
                        <p className={`text-3xl font-bold ${results.remainingBalance >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                            {formatCurrency(results.remainingBalance)}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 grid grid-cols-2 gap-2 text-sm">
                         <div><p className="text-muted-foreground">Total Income</p><p className="font-semibold">{formatCurrency(results.totalIncome)}</p></div>
                         <div><p className="text-muted-foreground">Total Expenses</p><p className="font-semibold">{formatCurrency(results.totalExpenses)}</p></div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle className="text-base text-center">Expense Breakdown</CardTitle></CardHeader>
                    <CardContent>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={results.pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8">
                                        {results.pieData.map((_entry: any, index: number) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                    <Legend iconSize={10} layout="vertical" align="right" verticalAlign="middle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
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
