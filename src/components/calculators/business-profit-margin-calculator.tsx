
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
  revenue: z.number().min(1, "Revenue must be positive"),
  cogs: z.number().min(0, "COGS must be non-negative"),
  operatingExpenses: z.number().min(0, "Operating Expenses must be non-negative"),
}).refine(data => data.revenue > data.cogs, {
    message: "Revenue must be greater than COGS.",
    path: ["revenue"],
});

type FormData = z.infer<typeof formSchema>;

export default function BusinessProfitMarginCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      revenue: 100000,
      cogs: 40000,
      operatingExpenses: 25000,
    },
  });

  const calculateMargin = (data: FormData) => {
    const { revenue, cogs, operatingExpenses } = data;
    const grossProfit = revenue - cogs;
    const netProfit = grossProfit - operatingExpenses;

    const grossMargin = (grossProfit / revenue) * 100;
    const netMargin = (netProfit / revenue) * 100;

    setResults({
      grossMargin: grossMargin.toFixed(2),
      netMargin: netMargin.toFixed(2),
      grossProfit: grossProfit,
      netProfit: netProfit,
    });
    setFormData(data);
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `profit-margin-calculation.${format}`;
    const { revenue, cogs, operatingExpenses } = formData;

    if (format === 'txt') {
      content = `Business Profit Margin Calculation\n\nInputs:\n- Revenue: ${formatCurrency(revenue)}\n- COGS: ${formatCurrency(cogs)}\n- Operating Expenses: ${formatCurrency(operatingExpenses)}\n\nResult:\n- Gross Profit Margin: ${results.grossMargin}%\n- Net Profit Margin: ${results.netMargin}%`;
    } else {
       content = `Revenue,COGS,Operating Expenses,Gross Margin (%),Net Margin (%)\n${revenue},${cogs},${operatingExpenses},${results.grossMargin},${results.netMargin}`;
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
    <form onSubmit={handleSubmit(calculateMargin)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs Column */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Financials</h3>
        
        <div>
          <Label htmlFor="revenue">Total Revenue ($)</Label>
          <Controller name="revenue" control={control} render={({ field }) => <Input id="revenue" type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
          {errors.revenue && <p className="text-destructive text-sm mt-1">{errors.revenue.message}</p>}
        </div>

        <div>
          <Label htmlFor="cogs">Cost of Goods Sold (COGS) ($)</Label>
          <Controller name="cogs" control={control} render={({ field }) => <Input id="cogs" type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
        </div>

        <div>
          <Label htmlFor="operatingExpenses">Operating Expenses ($)</Label>
          <Controller name="operatingExpenses" control={control} render={({ field }) => <Input id="operatingExpenses" type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
        </div>
        
        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Calculate Margin</Button>
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
        <h3 className="text-xl font-semibold">Profit Margins</h3>
        {results ? (
            <div className="space-y-4">
                <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-sm text-muted-foreground">Gross Profit Margin</p>
                        <p className="text-3xl font-bold">{results.grossMargin}%</p>
                        <p className="text-xs text-muted-foreground">Profit from sales: {formatCurrency(results.grossProfit)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                         <p className="text-sm text-muted-foreground">Net Profit Margin</p>
                         <p className="text-3xl font-bold">{results.netMargin}%</p>
                         <p className="text-xs text-muted-foreground">Overall profit: {formatCurrency(results.netProfit)}</p>
                    </CardContent>
                </Card>
            </div>
        ) : (
             <div className="flex items-center justify-center h-60 bg-muted/50 rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">Enter financials to calculate profit margins</p>
            </div>
        )}
      </div>
    </form>
  );
}
