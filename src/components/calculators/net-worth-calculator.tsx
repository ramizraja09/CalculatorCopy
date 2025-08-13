
"use client";

import { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Trash, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const itemSchema = z.object({
  name: z.string().nonempty('Name is required'),
  amount: z.number().min(0, 'Amount must be non-negative'),
});

const formSchema = z.object({
  assets: z.array(itemSchema),
  liabilities: z.array(itemSchema),
});

type FormData = z.infer<typeof formSchema>;

const defaultAssets = [ { name: 'Checking Account', amount: 5000 }, { name: 'Savings Account', amount: 20000 }, { name: 'Retirement (401k/IRA)', amount: 75000 }, { name: 'Car Value', amount: 15000 }, ];
const defaultLiabilities = [ { name: 'Credit Card Debt', amount: 3000 }, { name: 'Student Loans', amount: 25000 }, ];

export default function NetWorthCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { assets: defaultAssets, liabilities: defaultLiabilities },
  });

  const { fields: assetFields, append: appendAsset, remove: removeAsset } = useFieldArray({ control, name: "assets" });
  const { fields: liabilityFields, append: appendLiability, remove: removeLiability } = useFieldArray({ control, name: "liabilities" });

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const processSubmit = (data: FormData) => {
    const totalAssets = data.assets.reduce((acc, item) => acc + item.amount, 0);
    const totalLiabilities = data.liabilities.reduce((acc, item) => acc + item.amount, 0);
    const netWorth = totalAssets - totalLiabilities;
    setResults({
        totalAssets,
        totalLiabilities,
        netWorth,
        chartData: [
            { name: 'Net Worth', assets: totalAssets, liabilities: -totalLiabilities }
        ]
    });
    setFormData(data);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `net-worth-calculation.${format}`;

    if (format === 'txt') {
      content = `Net Worth Calculation\n\nAssets:\n`;
      formData.assets.forEach(item => {
        content += `- ${item.name}: ${formatCurrency(item.amount)}\n`;
      });
      content += `\nLiabilities:\n`;
      formData.liabilities.forEach(item => {
        content += `- ${item.name}: ${formatCurrency(item.amount)}\n`;
      });
      content += `\nResults:\n- Total Assets: ${formatCurrency(results.totalAssets)}\n- Total Liabilities: ${formatCurrency(results.totalLiabilities)}\n- Net Worth: ${formatCurrency(results.netWorth)}\n`;
    } else {
      content = 'Type,Name,Amount\n';
      formData.assets.forEach(item => {
        content += `Asset,"${item.name}",${item.amount}\n`;
      });
      formData.liabilities.forEach(item => {
        content += `Liability,"${item.name}",${item.amount}\n`;
      });
      content += `\nResult Category,Value\n`;
      content += `Total Assets,${results.totalAssets}\n`;
      content += `Total Liabilities,${results.totalLiabilities}\n`;
      content += `Net Worth,${results.netWorth}\n`;
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
    <form onSubmit={handleSubmit(processSubmit)}>
        <div className="grid md:grid-cols-2 gap-8">
            {/* Inputs Column */}
            <div className="space-y-4">
                <Card>
                    <CardHeader><CardTitle>Assets</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                        {assetFields.map((field, index) => (
                            <div key={field.id} className="flex gap-2 items-center">
                                <Label htmlFor={`assets.${index}.name`} className="sr-only">Asset Name</Label>
                                <Controller name={`assets.${index}.name`} control={control} render={({ field }) => <Input placeholder="Asset Name" {...field} />} />
                                <Label htmlFor={`assets.${index}.amount`} className="sr-only">Asset Amount</Label>
                                <Controller name={`assets.${index}.amount`} control={control} render={({ field }) => <Input type="number" placeholder="0" className="w-32" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeAsset(index)}><Trash className="h-4 w-4" /></Button>
                            </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={() => appendAsset({ name: '', amount: 0 })}>Add Asset</Button>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Liabilities</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                        {liabilityFields.map((field, index) => (
                            <div key={field.id} className="flex gap-2 items-center">
                                <Label htmlFor={`liabilities.${index}.name`} className="sr-only">Liability Name</Label>
                                <Controller name={`liabilities.${index}.name`} control={control} render={({ field }) => <Input placeholder="Liability Name" {...field} />} />
                                <Label htmlFor={`liabilities.${index}.amount`} className="sr-only">Liability Amount</Label>
                                <Controller name={`liabilities.${index}.amount`} control={control} render={({ field }) => <Input type="number" placeholder="0" className="w-32" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeLiability(index)}><Trash className="h-4 w-4" /></Button>
                            </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={() => appendLiability({ name: '', amount: 0 })}>Add Liability</Button>
                    </CardContent>
                </Card>
                <div className="flex gap-2">
                    <Button type="submit" className="flex-1">Calculate Net Worth</Button>
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
                <h3 className="text-xl font-semibold">Your Net Worth</h3>
                {results ? (
                    <div className="space-y-4">
                        <Card>
                            <CardContent className="p-4 text-center">
                                <p className="text-sm text-muted-foreground">Total Net Worth</p>
                                <p className="text-3xl font-bold">{formatCurrency(results.netWorth)}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4 grid grid-cols-2 gap-2 text-sm">
                                <div><p className="text-muted-foreground">Total Assets</p><p className="font-semibold text-green-600">{formatCurrency(results.totalAssets)}</p></div>
                                <div><p className="text-muted-foreground">Total Liabilities</p><p className="font-semibold text-destructive">{formatCurrency(results.totalLiabilities)}</p></div>
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-60 bg-muted/50 rounded-lg border border-dashed">
                        <p className="text-sm text-muted-foreground">Enter your assets and liabilities to calculate</p>
                    </div>
                )}
            </div>
        </div>
        {results && (
             <div className="md:col-span-2 mt-8">
                <h3 className="text-xl font-semibold mb-4">Assets vs. Liabilities</h3>
                <Card>
                    <CardContent className="p-4">
                        <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={results.chartData} layout="vertical" barSize={60}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
                              <YAxis type="category" dataKey="name" hide />
                              <Tooltip formatter={(value: number) => formatCurrency(Math.abs(value))} />
                              <Legend />
                              <Bar dataKey="assets" name="Assets" fill="hsl(var(--chart-2))" stackId="a" />
                              <Bar dataKey="liabilities" name="Liabilities" fill="hsl(var(--destructive))" stackId="a" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )}
    </form>
  );
}
