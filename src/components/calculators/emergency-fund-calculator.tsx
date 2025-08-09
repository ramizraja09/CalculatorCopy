
"use client";

import { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Trash } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

const expenseSchema = z.object({
  name: z.string().nonempty('Expense name is required'),
  amount: z.number().min(0, 'Amount must be non-negative'),
});

const formSchema = z.object({
  expenses: z.array(expenseSchema),
  monthsToCover: z.number().min(1).max(12),
});

type FormData = z.infer<typeof formSchema>;

const defaultExpenses = [ { name: 'Rent/Mortgage', amount: 1500 }, { name: 'Utilities', amount: 200 }, { name: 'Food', amount: 500 }, { name: 'Transportation', amount: 150 }, { name: 'Insurance', amount: 250 }, { name: 'Other essentials', amount: 200 } ];

export default function EmergencyFundCalculator() {
  const [results, setResults] = useState<any>(null);

  const { control, handleSubmit, watch } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      expenses: defaultExpenses,
      monthsToCover: 6,
    },
  });
  
  const monthsToCover = watch('monthsToCover');

  const { fields, append, remove } = useFieldArray({ control, name: "expenses" });
  
  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const processSubmit = (data: FormData) => {
    const totalMonthlyExpenses = data.expenses.reduce((acc, expense) => acc + expense.amount, 0);
    const fundGoal = totalMonthlyExpenses * data.monthsToCover;
    setResults({
        totalMonthlyExpenses,
        fundGoal,
        monthsToCover: data.monthsToCover,
    });
  };

  return (
    <form onSubmit={handleSubmit(processSubmit)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs Column */}
      <div className="space-y-4">
        <Card>
            <CardHeader><CardTitle>Essential Monthly Expenses</CardTitle></CardHeader>
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
        <Card>
            <CardHeader><CardTitle>Savings Goal</CardTitle></CardHeader>
            <CardContent>
                <Label>Months of Expenses to Cover ({monthsToCover})</Label>
                <Controller name="monthsToCover" control={control} render={({ field }) => (
                     <Slider
                        min={1} max={12} step={1}
                        value={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                    />
                )}/>
            </CardContent>
        </Card>
        <Button type="submit" className="w-full">Calculate Emergency Fund</Button>
      </div>

      {/* Results Column */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Your Emergency Fund Goal</h3>
        {results ? (
            <div className="space-y-4">
                 <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-sm text-muted-foreground">Emergency Fund Goal</p>
                        <p className="text-3xl font-bold text-primary">{formatCurrency(results.fundGoal)}</p>
                        <p className="text-sm text-muted-foreground">({results.monthsToCover} months of expenses)</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <p className="text-muted-foreground text-center">Total Monthly Expenses: <span className="font-semibold text-foreground">{formatCurrency(results.totalMonthlyExpenses)}</span></p>
                    </CardContent>
                </Card>
            </div>
        ) : (
             <div className="flex items-center justify-center h-60 bg-muted/50 rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">List your monthly expenses to calculate your fund goal</p>
            </div>
        )}
      </div>
    </form>
  );
}
