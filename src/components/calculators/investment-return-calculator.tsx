
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const formSchema = z.object({
  initialInvestment: z.number().min(0.01, 'Initial investment must be positive'),
  finalValue: z.number().min(0, 'Final value must be non-negative'),
  investmentLength: z.number().min(0.1, 'Investment length must be positive'),
});

type FormData = z.infer<typeof formSchema>;

export default function InvestmentReturnCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      initialInvestment: 10000,
      finalValue: 15000,
      investmentLength: 5,
    },
  });

  const calculateReturn = (data: FormData) => {
    const { initialInvestment, finalValue, investmentLength } = data;

    if (initialInvestment <= 0) {
        setResults({ error: "Initial investment must be a positive number." });
        return;
    }

    const totalReturn = finalValue - initialInvestment;
    const roi = (totalReturn / initialInvestment) * 100;
    
    const cagr = (Math.pow(finalValue / initialInvestment, 1 / investmentLength) - 1) * 100;

    setResults({
      totalReturn,
      roi,
      cagr: isFinite(cagr) ? cagr : 0,
      chartData: [
        { name: 'Initial', value: initialInvestment },
        { name: 'Return', value: totalReturn > 0 ? totalReturn : 0 },
      ],
      error: null,
    });
    setFormData(data);
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  const formatPercent = (value: number) => `${value.toFixed(2)}%`;
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `investment-return-calculation.${format}`;
    const { initialInvestment, finalValue, investmentLength } = formData;

    if (format === 'txt') {
      content = `Investment Return Calculation\n\nInputs:\n`;
      content += `- Initial Investment: ${formatCurrency(initialInvestment)}\n- Final Value: ${formatCurrency(finalValue)}\n- Investment Length: ${investmentLength} years\n\n`;
      content += `Results:\n- Total Return: ${formatCurrency(results.totalReturn)}\n- ROI: ${formatPercent(results.roi)}\n- CAGR: ${formatPercent(results.cagr)}\n`;
    } else {
      content = 'Category,Value\n';
      content += `Initial Investment,${initialInvestment}\nFinal Value,${finalValue}\nInvestment Length (years),${investmentLength}\n\n`;
      content += 'Result Category,Value\n';
      content += `Total Return,${results.totalReturn.toFixed(2)}\nROI (%),${results.roi.toFixed(2)}\nCAGR (%),${results.cagr.toFixed(2)}\n`;
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
    <form onSubmit={handleSubmit(calculateReturn)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs Column */}
      <div className="space-y-4">
        <Card>
            <CardHeader><CardTitle>Investment Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="initialInvestment">Initial Investment ($)</Label>
                <Controller name="initialInvestment" control={control} render={({ field }) => <Input id="initialInvestment" type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
                {errors.initialInvestment && <p className="text-destructive text-sm mt-1">{errors.initialInvestment.message}</p>}
              </div>

              <div>
                <Label htmlFor="finalValue">Final Value ($)</Label>
                <Controller name="finalValue" control={control} render={({ field }) => <Input id="finalValue" type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
                {errors.finalValue && <p className="text-destructive text-sm mt-1">{errors.finalValue.message}</p>}
              </div>

              <div>
                <Label htmlFor="investmentLength">Investment Length (years)</Label>
                <Controller name="investmentLength" control={control} render={({ field }) => <Input id="investmentLength" type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
                {errors.investmentLength && <p className="text-destructive text-sm mt-1">{errors.investmentLength.message}</p>}
              </div>
            </CardContent>
        </Card>
        
        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Calculate Return</Button>
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
        <h3 className="text-xl font-semibold">Results</h3>
        {results ? (
            results.error ? (
                <Card className="flex items-center justify-center h-60 bg-muted/50 border-dashed">
                    <p className="text-destructive">{results.error}</p>
                </Card>
            ) : (
                <div className="space-y-4">
                    <Card>
                        <CardHeader><CardTitle className="text-base text-muted-foreground text-center">Total Return</CardTitle></CardHeader>
                        <CardContent className="text-center">
                            <p className="text-3xl font-bold text-primary">{formatCurrency(results.totalReturn)}</p>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardContent className="p-4 grid grid-cols-2 gap-4 text-center">
                             <div>
                                <p className="text-sm text-muted-foreground">Return on Investment (ROI)</p>
                                <p className="text-xl font-bold">{formatPercent(results.roi)}</p>
                            </div>
                             <div>
                                <p className="text-sm text-muted-foreground">Annualized Return (CAGR)</p>
                                <p className="text-xl font-bold">{formatPercent(results.cagr)}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                      <CardHeader><CardTitle className="text-base">Investment Breakdown</CardTitle></CardHeader>
                      <CardContent className="p-4 h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[{ name: 'Value', initial: results.chartData[0].value, return: results.chartData[1].value }]} layout="vertical" margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis type="number" tickFormatter={(value) => formatCurrency(value)}/>
                              <YAxis type="category" dataKey="name" hide />
                              <Tooltip formatter={(value: number) => formatCurrency(value)} />
                              <Legend />
                              <Bar dataKey="initial" stackId="a" fill="hsl(var(--chart-1))" name="Initial Investment" />
                              <Bar dataKey="return" stackId="a" fill="hsl(var(--chart-2))" name="Total Return" />
                            </BarChart>
                          </ResponsiveContainer>
                      </CardContent>
                    </Card>
                </div>
            )
        ) : (
             <div className="flex items-center justify-center h-full min-h-[30rem] bg-muted/50 rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">Enter your investment details to see the returns</p>
            </div>
        )}
      </div>
    </form>
  );
}
