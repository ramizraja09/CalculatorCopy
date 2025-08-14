
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const PIE_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-3))', 'hsl(var(--destructive))', 'hsl(var(--chart-2))'];

const formSchema = z.object({
  revenue: z.number().min(1, "Revenue must be positive"),
  cogs: z.number().min(0, "COGS must be non-negative"),
  operatingExpenses: z.number().min(0, "Operating Expenses must be non-negative"),
  taxes: z.number().min(0, "Taxes must be non-negative"),
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
      taxes: 5000,
    },
  });

  const calculateMargin = (data: FormData) => {
    const { revenue, cogs, operatingExpenses, taxes } = data;
    const grossProfit = revenue - cogs;
    const netProfit = grossProfit - operatingExpenses - taxes;

    const grossMargin = (grossProfit / revenue) * 100;
    const netMargin = (netProfit / revenue) * 100;

    setResults({
      grossMargin: grossMargin.toFixed(2),
      netMargin: netMargin.toFixed(2),
      grossProfit: grossProfit,
      netProfit: netProfit,
      pieData: [
        { name: 'COGS', value: cogs },
        { name: 'Operating Expenses', value: operatingExpenses },
        { name: 'Taxes', value: taxes },
        { name: 'Net Profit', value: netProfit },
      ].filter(item => item.value > 0),
    });
    setFormData(data);
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `profit-margin-calculation.${format}`;
    const { revenue, cogs, operatingExpenses, taxes } = formData;

    if (format === 'txt') {
      content = `Business Profit Margin Calculation\n\nInputs:\n- Revenue: ${formatCurrency(revenue)}\n- COGS: ${formatCurrency(cogs)}\n- Operating Expenses: ${formatCurrency(operatingExpenses)}\n- Taxes: ${formatCurrency(taxes)}\n\nResult:\n- Gross Profit Margin: ${results.grossMargin}%\n- Net Profit Margin: ${results.netMargin}%`;
    } else {
       content = `Revenue,COGS,Operating Expenses,Taxes,Gross Margin (%),Net Margin (%)\n${revenue},${cogs},${operatingExpenses},${taxes},${results.grossMargin},${results.netMargin}`;
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
          <Controller name="revenue" control={control} render={({ field }) => <Input id="revenue" type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
          {errors.revenue && <p className="text-destructive text-sm mt-1">{errors.revenue.message}</p>}
        </div>

        <div>
          <Label htmlFor="cogs">Cost of Goods Sold (COGS) ($)</Label>
          <Controller name="cogs" control={control} render={({ field }) => <Input id="cogs" type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
        </div>

        <div>
          <Label htmlFor="operatingExpenses">Operating Expenses ($)</Label>
          <Controller name="operatingExpenses" control={control} render={({ field }) => <Input id="operatingExpenses" type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
        </div>

         <div>
          <Label htmlFor="taxes">Taxes ($)</Label>
          <Controller name="taxes" control={control} render={({ field }) => <Input id="taxes" type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
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
                    <CardContent className="p-4 grid grid-cols-2 gap-4 text-center">
                        <div>
                            <p className="text-sm text-muted-foreground">Gross Profit Margin</p>
                            <p className="text-2xl font-bold">{results.grossMargin}%</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Net Profit Margin</p>
                            <p className="text-2xl font-bold">{results.netMargin}%</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="text-base text-center">Revenue Breakdown</CardTitle></CardHeader>
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
