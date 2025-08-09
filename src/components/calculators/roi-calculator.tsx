
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const formSchema = z.object({
  initialInvestment: z.number().min(0.01, 'Initial investment must be positive'),
  finalValue: z.number().min(0, 'Final value must be non-negative'),
  investmentLength: z.number().min(0.1, 'Investment length must be positive'),
});

type FormData = z.infer<typeof formSchema>;

export default function RoiCalculator() {
  const [results, setResults] = useState<any>(null);

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
    
    // CAGR (Compound Annual Growth Rate)
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
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  const formatPercent = (value: number) => `${value.toFixed(2)}%`;

  return (
    <form onSubmit={handleSubmit(calculateReturn)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs Column */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Inputs</h3>
        
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
        
        <Button type="submit" className="w-full">Calculate Return</Button>
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
                        <CardContent className="p-4 grid grid-cols-2 gap-4 text-center">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Return</p>
                                <p className="text-2xl font-bold text-primary">{formatCurrency(results.totalReturn)}</p>
                            </div>
                             <div>
                                <p className="text-sm text-muted-foreground">Return on Investment (ROI)</p>
                                <p className="text-2xl font-bold text-primary">{formatPercent(results.roi)}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4 text-center">
                             <p className="text-sm text-muted-foreground">Annualized Return (CAGR)</p>
                             <p className="text-2xl font-bold">{formatPercent(results.cagr)}</p>
                        </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-semibold mb-4 text-center">Investment Growth</h4>
                        <div className="h-60">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[{ name: 'Value', initial: results.chartData[0].value, final: results.chartData[1].value }]} layout="vertical" margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis type="number" tickFormatter={(value) => formatCurrency(value)}/>
                              <YAxis type="category" dataKey="name" hide />
                              <Tooltip formatter={(value: number) => formatCurrency(value)} />
                              <Legend />
                              <Bar dataKey="initial" stackId="a" fill="hsl(var(--primary))" name="Initial Investment" />
                              <Bar dataKey="final" stackId="a" fill="hsl(var(--chart-2))" name="Gains" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                </div>
            )
        ) : (
             <div className="flex items-center justify-center h-60 bg-muted/50 rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">Enter your investment details to see the returns</p>
            </div>
        )}
      </div>
    </form>
  );
}
