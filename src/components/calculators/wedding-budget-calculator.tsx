
"use client";

import { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Trash, Download, Info } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const itemSchema = z.object({
  name: z.string().nonempty('Item name is required'),
  cost: z.number().min(0, 'Cost must be non-negative'),
});

const formSchema = z.object({
  totalBudget: z.number().min(1, "Total budget must be positive"),
  expenses: z.array(itemSchema),
});

type FormData = z.infer<typeof formSchema>;

const defaultExpenses = [
  { name: 'Venue', cost: 5000 },
  { name: 'Catering', cost: 8000 },
  { name: 'Photography', cost: 3000 },
  { name: 'Attire', cost: 2500 },
  { name: 'Flowers & Decor', cost: 2000 },
  { name: 'Music/Entertainment', cost: 1500 },
];

export default function WeddingBudgetCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      totalBudget: 25000,
      expenses: defaultExpenses,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "expenses",
  });
  
  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const calculateBudget = (data: FormData) => {
    const totalSpent = data.expenses.reduce((acc, item) => acc + item.cost, 0);
    const remainingBudget = data.totalBudget - totalSpent;
    const percentageSpent = (totalSpent / data.totalBudget) * 100;

    setResults({
      remainingBudget,
      percentageSpent,
      totalSpent,
    });
    setFormData(data);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `wedding-budget-calculation.${format}`;

    if (format === 'txt') {
      content = `Wedding Budget Calculation\n\nTotal Budget: ${formatCurrency(formData.totalBudget)}\n\nExpenses:\n`;
      formData.expenses.forEach(item => {
        content += `- ${item.name}: ${formatCurrency(item.cost)}\n`;
      });
      content += `\nResults:\n- Total Spent: ${formatCurrency(results.totalSpent)}\n- Remaining Budget: ${formatCurrency(results.remainingBudget)}\n- Percentage Spent: ${results.percentageSpent.toFixed(1)}%`;
    } else {
      content = 'Category,Cost\n';
      content += `Total Budget,${formData.totalBudget}\n\n`;
      content += 'Expense,Cost\n';
       formData.expenses.forEach(item => {
        content += `"${item.name}",${item.cost}\n`;
      });
      content += `\nTotal Spent,${results.totalSpent}\nRemaining Budget,${results.remainingBudget}\nPercentage Spent (%),${results.percentageSpent.toFixed(1)}`;
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
    <form onSubmit={handleSubmit(calculateBudget)} className="grid md:grid-cols-2 gap-8">
      <div className="space-y-4">
        <Card>
          <CardHeader><CardTitle>Wedding Budget & Expenses</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Total Wedding Budget ($)</Label><Controller name="totalBudget" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
            <h4 className="font-semibold pt-4">Expenses</h4>
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-2 items-center">
                <Controller name={`expenses.${index}.name`} control={control} render={({ field }) => <Input placeholder="Expense Name" {...field} />} />
                <Controller name={`expenses.${index}.cost`} control={control} render={({ field }) => <Input type="number" placeholder="Cost ($)" className="w-32" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash className="h-4 w-4" /></Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => append({ name: '', cost: 0 })}>Add Expense</Button>
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
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Budget Summary</h3>
        {results ? (
            <div className="space-y-4">
                <Card className={results.remainingBudget >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}>
                    <CardContent className="p-4 text-center">
                        <p className="text-sm text-muted-foreground">Remaining Budget</p>
                        <p className="text-3xl font-bold">{formatCurrency(results.remainingBudget)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 space-y-2">
                        <Label>Percentage of Budget Spent</Label>
                        <Progress value={results.percentageSpent} />
                        <p className="text-right text-sm font-semibold">{results.percentageSpent.toFixed(1)}%</p>
                    </CardContent>
                </Card>
            </div>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter your budget and expenses</p></div>
        )}
      </div>
    </form>
  );
}
