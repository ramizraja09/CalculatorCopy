
"use client";

import { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash, Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const itemSchema = z.object({
  name: z.string().nonempty('Item name is required'),
  cost: z.number().min(0, 'Cost must be non-negative'),
});

const formSchema = z.object({
  items: z.array(itemSchema),
});

type FormData = z.infer<typeof formSchema>;

const defaultItems = [
  { name: 'New Interview Outfit', cost: 150 },
  { name: 'Travel (Gas/Tickets)', cost: 50 },
  { name: 'Professional Headshot', cost: 100 },
];

export default function InterviewPrepCostCalculator() {
  const [totalCost, setTotalCost] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, watch } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      items: defaultItems,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const calculateTotal = (data: FormData) => {
    const total = data.items.reduce((acc, item) => acc + item.cost, 0);
    setTotalCost(total);
    setFormData(data);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (totalCost === null || !formData) return;
    
    let content = '';
    const filename = `interview-prep-cost.${format}`;

    if (format === 'txt') {
      content = `Interview Prep Cost Calculation\n\nExpenses:\n`;
      formData.items.forEach(item => {
        content += `- ${item.name}: ${formatCurrency(item.cost)}\n`;
      });
      content += `\nTotal Estimated Cost: ${formatCurrency(totalCost)}`;
    } else {
      content = 'Expense,Cost\n';
      formData.items.forEach(item => {
        content += `"${item.name}",${item.cost}\n`;
      });
       content += `\nTotal,${totalCost}`;
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
    <form onSubmit={handleSubmit(calculateTotal)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs Column */}
      <div className="space-y-4">
        <Card>
          <CardHeader><CardTitle>Potential Expenses</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-2 items-center">
                <Controller name={`items.${index}.name`} control={control} render={({ field }) => <Input placeholder="Expense Name" {...field} />} />
                <Controller name={`items.${index}.cost`} control={control} render={({ field }) => <Input type="number" placeholder="Cost ($)" className="w-32" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash className="h-4 w-4" /></Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => append({ name: '', cost: 0 })}>Add Expense</Button>
          </CardContent>
        </Card>
        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Calculate Total</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={totalCost === null}>
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
        <h3 className="text-xl font-semibold">Total Estimated Cost</h3>
        {totalCost !== null ? (
            <Card>
                <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">Total Prep Cost</p>
                    <p className="text-3xl font-bold">{formatCurrency(totalCost)}</p>
                </CardContent>
            </Card>
        ) : (
            <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter expenses to calculate total</p></div>
        )}
      </div>
    </form>
  );
}
