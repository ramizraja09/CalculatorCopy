
"use client";

import { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';


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
  };

  return (
    <form onSubmit={handleSubmit(processSubmit)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs Column */}
      <div className="space-y-4">
        <Card>
            <CardHeader><CardTitle>Assets</CardTitle></CardHeader>
            <CardContent className="space-y-2">
                {assetFields.map((field, index) => (
                    <div key={field.id} className="flex gap-2 items-center">
                        <Controller name={`assets.${index}.name`} control={control} render={({ field }) => <Input placeholder="Asset Name" {...field} />} />
                        <Controller name={`assets.${index}.amount`} control={control} render={({ field }) => <Input type="number" placeholder="Amount" className="w-32" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
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
                        <Controller name={`liabilities.${index}.name`} control={control} render={({ field }) => <Input placeholder="Liability Name" {...field} />} />
                        <Controller name={`liabilities.${index}.amount`} control={control} render={({ field }) => <Input type="number" placeholder="Amount" className="w-32" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeLiability(index)}><Trash className="h-4 w-4" /></Button>
                    </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => appendLiability({ name: '', amount: 0 })}>Add Liability</Button>
            </CardContent>
        </Card>
        <Button type="submit" className="w-full">Calculate Net Worth</Button>
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
                <Card>
                    <CardContent className="p-4">
                        <div className="h-24">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={results.chartData} layout="vertical" barGap={-15}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis type="number" hide />
                              <YAxis type="category" dataKey="name" hide />
                              <Tooltip formatter={(value: number) => formatCurrency(value)} />
                              <Legend />
                              <Bar dataKey="assets" name="Assets" fill="hsl(var(--chart-2))" stackId="a" />
                              <Bar dataKey="liabilities" name="Liabilities" fill="hsl(var(--destructive))" stackId="a" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        ) : (
             <div className="flex items-center justify-center h-60 bg-muted/50 rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">Enter your assets and liabilities to calculate</p>
            </div>
        )}
      </div>
    </form>
  );
}
