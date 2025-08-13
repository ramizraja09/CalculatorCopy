
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
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const formSchema = z.object({
  propertyValue: z.number().min(1, "Property value must be positive"),
  firstMortgage: z.number().min(1, "First mortgage balance is required"),
  secondLien: z.number().min(0, "Must be non-negative").optional(),
  otherLiens: z.number().min(0, "Must be non-negative").optional(),
}).refine(data => data.firstMortgage + (data.secondLien || 0) + (data.otherLiens || 0) <= data.propertyValue, {
  message: "Total liens cannot be greater than property value.",
  path: ["propertyValue"],
});

type FormData = z.infer<typeof formSchema>;

const PIE_COLORS = ['hsl(var(--chart-2))', 'hsl(var(--chart-1))'];

export default function LtvCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      propertyValue: 350000,
      firstMortgage: 200000,
      secondLien: 50000,
      otherLiens: 0,
    },
  });

  const calculateLtv = (data: FormData) => {
    const { propertyValue, firstMortgage, secondLien = 0, otherLiens = 0 } = data;
    
    const firstMortgageLtv = (firstMortgage / propertyValue) * 100;
    const totalLiens = firstMortgage + secondLien + otherLiens;
    const cumulativeLtv = (totalLiens / propertyValue) * 100;
    const equity = propertyValue - totalLiens;

    setResults({
      firstMortgageLtv: firstMortgageLtv.toFixed(2),
      cumulativeLtv: cumulativeLtv.toFixed(2),
      pieData: [
        { name: 'Equity', value: equity },
        { name: 'Total Liens', value: totalLiens },
      ]
    });
    setFormData(data);
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `ltv-calculation.${format}`;
    const { propertyValue, firstMortgage, secondLien, otherLiens } = formData;

    if (format === 'txt') {
      content = `Loan-to-Value (LTV) Calculation\n\nInputs:\n- Property Value: ${formatCurrency(propertyValue)}\n- First Mortgage: ${formatCurrency(firstMortgage)}\n- Second Lien: ${formatCurrency(secondLien || 0)}\n- Other Liens: ${formatCurrency(otherLiens || 0)}\n\nResult:\n- First Mortgage LTV: ${results.firstMortgageLtv}%\n- Cumulative LTV: ${results.cumulativeLtv}%`;
    } else {
       content = `Property Value,First Mortgage,Second Lien,Other Liens,First Mortgage LTV (%),Cumulative LTV (%)\n${propertyValue},${firstMortgage},${secondLien || 0},${otherLiens || 0},${results.firstMortgageLtv},${results.cumulativeLtv}`;
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
    <form onSubmit={handleSubmit(calculateLtv)} className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>To find out your loan-to-value ratio, enter the amounts below.</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 items-center gap-4">
                        <Label htmlFor="propertyValue">Current appraised value or market value of home</Label>
                        <Controller name="propertyValue" control={control} render={({ field }) => <Input id="propertyValue" type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
                    </div>
                     {errors.propertyValue && <p className="text-destructive text-sm col-span-2 text-right -mt-4">{errors.propertyValue.message}</p>}
                    <div className="grid md:grid-cols-2 items-center gap-4">
                        <Label htmlFor="firstMortgage">Outstanding balance on first mortgage</Label>
                        <Controller name="firstMortgage" control={control} render={({ field }) => <Input id="firstMortgage" type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
                    </div>
                     {errors.firstMortgage && <p className="text-destructive text-sm col-span-2 text-right -mt-4">{errors.firstMortgage.message}</p>}

                    <div className="space-y-6 pt-4 border-t">
                        <h4 className="font-semibold text-lg">Have a second mortgage or other lien on the property?</h4>
                        <div className="grid md:grid-cols-2 items-center gap-4">
                            <Label htmlFor="secondLien">Current balance on home equity line or home equity loan</Label>
                            <Controller name="secondLien" control={control} render={({ field }) => <Input id="secondLien" type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
                        </div>
                        <div className="grid md:grid-cols-2 items-center gap-4">
                            <Label htmlFor="otherLiens">Any other liens on the property (tax liens, mechanics liens, etc)</Label>
                            <Controller name="otherLiens" control={control} render={({ field }) => <Input id="otherLiens" type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
                        </div>
                    </div>

                    <div className="flex justify-center pt-4 gap-2">
                        <Button type="submit" className="w-full max-w-xs">Calculate</Button>
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

                </CardContent>
            </Card>
        </div>
        <div className="space-y-4">
            <h3 className="text-xl font-semibold">LTV Breakdown</h3>
            {results ? (
                <div className="space-y-4">
                    <Card>
                        <CardContent className="p-0">
                            <div className="flex justify-between p-4">
                                <p className="font-semibold">First mortgage loan-to-value</p>
                                <p>{results.firstMortgageLtv}%</p>
                            </div>
                            <div className="flex justify-between p-4 border-t bg-muted/50">
                                <p className="font-semibold">Cumulative loan-to-value</p>
                                <p className="font-bold">{results.cumulativeLtv}%</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle className="text-base text-center">Equity vs. Liens</CardTitle></CardHeader>
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
                <Card className="flex items-center justify-center h-full bg-muted/50 border-dashed p-8">
                    <p className="text-sm text-muted-foreground">Enter loan and property details to see results.</p>
                </Card>
            )}
        </div>
    </form>
  );
}
