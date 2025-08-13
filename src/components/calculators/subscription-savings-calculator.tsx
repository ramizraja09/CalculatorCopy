
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const formSchema = z.object({
  subscriptionCost: z.number().min(0, "Cost must be non-negative"),
  usageFrequency: z.number().int().min(0, "Usage must be non-negative"),
  payPerUsePrice: z.number().min(0, "Price must be non-negative"),
});

type FormData = z.infer<typeof formSchema>;

export default function SubscriptionSavingsCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subscriptionCost: 15,
      usageFrequency: 10,
      payPerUsePrice: 2.50,
    },
  });

  const calculateSavings = (data: FormData) => {
    const { subscriptionCost, usageFrequency, payPerUsePrice } = data;
    const payPerUseTotal = payPerUsePrice * usageFrequency;
    const monthlySavings = payPerUseTotal - subscriptionCost;
    const annualSavings = monthlySavings * 12;

    setResults({
      monthlySavings,
      annualSavings,
    });
    setFormData(data);
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `subscription-savings-calculation.${format}`;
    const { subscriptionCost, usageFrequency, payPerUsePrice } = formData;

    if (format === 'txt') {
      content = `Subscription Savings Calculation\n\nInputs:\n- Monthly Subscription Cost: ${formatCurrency(subscriptionCost)}\n- Monthly Usage Frequency: ${usageFrequency}\n- Pay-Per-Use Price: ${formatCurrency(payPerUsePrice)}\n\nResults:\n- Monthly Savings: ${formatCurrency(results.monthlySavings)}\n- Annual Savings: ${formatCurrency(results.annualSavings)}`;
    } else {
       content = `Monthly Subscription Cost,Monthly Usage Frequency,Pay-Per-Use Price,Monthly Savings,Annual Savings\n${subscriptionCost},${usageFrequency},${payPerUsePrice},${results.monthlySavings.toFixed(2)},${results.annualSavings.toFixed(2)}`;
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
    <form onSubmit={handleSubmit(calculateSavings)} className="grid md:grid-cols-2 gap-8">
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Subscription & Usage Details</h3>
        <div><Label>Subscription Monthly Cost ($)</Label><Controller name="subscriptionCost" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
        <div><Label>Usage Frequency (per month)</Label><Controller name="usageFrequency" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))} />} /></div>
        <div><Label>Pay-Per-Use Price ($)</Label><Controller name="payPerUsePrice" control={control} render={({ field }) => <Input type="number" step="0.01" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Calculate Savings</Button>
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
        <h3 className="text-xl font-semibold">Savings Analysis</h3>
        {results ? (
            <div className="space-y-4">
                <Card className={results.monthlySavings >= 0 ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}>
                    <CardContent className="p-4 text-center">
                        <p className="text-sm text-muted-foreground">{results.monthlySavings >= 0 ? 'You are saving' : 'You are losing'}</p>
                        <p className="text-3xl font-bold">{formatCurrency(Math.abs(results.monthlySavings))}/month</p>
                        <p className="text-sm text-muted-foreground">({formatCurrency(Math.abs(results.annualSavings))} annually)</p>
                    </CardContent>
                </Card>
            </div>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter details to analyze your subscription</p></div>
        )}
      </div>
    </form>
  );
}
