
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Download, Info } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const formSchema = z.object({
  subscriptionCost: z.number().min(0, "Cost must be non-negative"),
  usageFrequency: z.number().int().min(0, "Usage must be non-negative"),
  payPerUsePrice: z.number().min(0.01, "Price must be positive"),
});

type FormData = z.infer<typeof formSchema>;
const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

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
    const breakEvenUses = subscriptionCost / payPerUsePrice;

    setResults({
      monthlySavings,
      breakEvenUses,
      chartData: [
        { name: 'Cost Comparison', Subscription: subscriptionCost, 'Pay-Per-Use': payPerUseTotal }
      ]
    });
    setFormData(data);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `subscription-savings-calculation.${format}`;
    const { subscriptionCost, usageFrequency, payPerUsePrice } = formData;

    if (format === 'txt') {
      content = `Subscription Savings Calculation\n\nInputs:\n- Monthly Subscription Cost: ${formatCurrency(subscriptionCost)}\n- Monthly Usage Frequency: ${usageFrequency}\n- Pay-Per-Use Price: ${formatCurrency(payPerUsePrice)}\n\nResults:\n- Monthly Savings: ${formatCurrency(results.monthlySavings)}\n- Break-Even Uses: ${results.breakEvenUses.toFixed(2)}`;
    } else {
       content = `Monthly Subscription Cost,Monthly Usage Frequency,Pay-Per-Use Price,Monthly Savings,Break-Even Uses\n${subscriptionCost},${usageFrequency},${payPerUsePrice},${results.monthlySavings.toFixed(2)},${results.breakEvenUses.toFixed(2)}`;
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
      {/* Inputs Column */}
      <div className="space-y-4">
        <Card>
            <CardHeader><CardTitle>Subscription & Usage Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div><Label>Monthly Subscription Cost ($)</Label><Controller name="subscriptionCost" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
                <div><Label>Usage Frequency (per month)</Label><Controller name="usageFrequency" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))} />} /></div>
                <div><Label>Pay-Per-Use Price ($)</Label><Controller name="payPerUsePrice" control={control} render={({ field }) => <Input type="number" step="0.01" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
            </CardContent>
        </Card>
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
      {/* Results Column */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Savings Analysis</h3>
        {results ? (
            <div className="space-y-4">
                <Alert variant={results.monthlySavings >= 0 ? 'default' : 'destructive'} className={results.monthlySavings >= 0 ? 'border-green-500' : ''}>
                    <Info className="h-4 w-4" />
                    <AlertTitle>{results.monthlySavings >= 0 ? 'The Subscription is Cheaper!' : 'Pay-Per-Use is Cheaper!'}</AlertTitle>
                    <AlertDescription>
                        Based on your usage, you are {results.monthlySavings >= 0 ? 'saving' : 'losing'} <strong>{formatCurrency(Math.abs(results.monthlySavings))}</strong> per month.
                    </AlertDescription>
                </Alert>
                <Card>
                    <CardHeader><CardTitle className="text-base text-center">Break-Even Point</CardTitle></CardHeader>
                    <CardContent className="p-4 text-center">
                        <p className="text-sm text-muted-foreground">You need to use this service at least</p>
                        <p className="text-3xl font-bold">{Math.ceil(results.breakEvenUses)} times per month</p>
                        <p className="text-sm text-muted-foreground">for the subscription to be worthwhile.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="text-base text-center">Cost Comparison</CardTitle></CardHeader>
                    <CardContent className="h-64">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={results.chartData} barSize={50}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" hide />
                                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                <Legend />
                                <Bar dataKey="Subscription" fill="hsl(var(--chart-1))" />
                                <Bar dataKey="Pay-Per-Use" fill="hsl(var(--chart-2))" />
                            </BarChart>
                        </ResponsiveContainer>
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
