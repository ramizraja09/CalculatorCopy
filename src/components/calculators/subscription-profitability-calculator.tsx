
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
  subscriptionPrice: z.number().min(0.01),
  acquisitionCost: z.number().min(0),
  churnRate: z.number().min(0.1).max(100),
});

type FormData = z.infer<typeof formSchema>;

export default function SubscriptionProfitabilityCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subscriptionPrice: 20,
      acquisitionCost: 50,
      churnRate: 5,
    },
  });

  const calculateProfitability = (data: FormData) => {
    const { subscriptionPrice, acquisitionCost, churnRate } = data;
    const averageLifetimeMonths = 1 / (churnRate / 100);
    const lifetimeValue = subscriptionPrice * averageLifetimeMonths;
    const netProfit = lifetimeValue - acquisitionCost;
    const profitMargin = (netProfit / lifetimeValue) * 100;

    setResults({
      lifetimeValue,
      netProfit,
      profitMargin: isFinite(profitMargin) ? profitMargin : 0,
      averageLifetimeMonths
    });
    setFormData(data);
  };
  
  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `subscription-profitability-calculation.${format}`;
    const { subscriptionPrice, acquisitionCost, churnRate } = formData;

    if (format === 'txt') {
      content = `Subscription Profitability Calculation\n\nInputs:\n- Subscription Price: ${formatCurrency(subscriptionPrice)}/mo\n- Acquisition Cost: ${formatCurrency(acquisitionCost)}\n- Monthly Churn Rate: ${churnRate}%\n\nResults:\n- Customer Lifetime Value (LTV): ${formatCurrency(results.lifetimeValue)}\n- Net Profit per Customer: ${formatCurrency(results.netProfit)}\n- Profit Margin: ${results.profitMargin.toFixed(1)}%`;
    } else {
       content = `Subscription Price,Acquisition Cost,Churn Rate (%),LTV,Net Profit,Profit Margin (%)\n${subscriptionPrice},${acquisitionCost},${churnRate},${results.lifetimeValue.toFixed(2)},${results.netProfit.toFixed(2)},${results.profitMargin.toFixed(1)}`;
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
    <form onSubmit={handleSubmit(calculateProfitability)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs Column */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Subscription Metrics</h3>
        <div><Label>Monthly Subscription Price ($)</Label><Controller name="subscriptionPrice" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
        <div><Label>Customer Acquisition Cost (CAC) ($)</Label><Controller name="acquisitionCost" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
        <div><Label>Monthly Churn Rate (%)</Label><Controller name="churnRate" control={control} render={({ field }) => <Input type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
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
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Profitability Analysis</h3>
        {results ? (
            <div className="space-y-4">
                <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-sm text-muted-foreground">Customer Lifetime Value (LTV)</p>
                        <p className="text-3xl font-bold">{formatCurrency(results.lifetimeValue)}</p>
                        <p className="text-xs text-muted-foreground">(Avg. {results.averageLifetimeMonths.toFixed(1)} month lifetime)</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 grid grid-cols-2 gap-2 text-center">
                        <div><p className="text-muted-foreground">Net Profit</p><p className="font-semibold">{formatCurrency(results.netProfit)}</p></div>
                        <div><p className="text-muted-foreground">Profit Margin</p><p className="font-semibold">{results.profitMargin.toFixed(1)}%</p></div>
                    </CardContent>
                </Card>
            </div>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter your subscription metrics</p></div>
        )}
      </div>
    </form>
  );
}
