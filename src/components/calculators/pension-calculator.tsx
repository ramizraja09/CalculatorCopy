
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const formSchema = z.object({
  currentAge: z.number().int().min(18, "Must be at least 18"),
  retirementAge: z.number().int().min(19, "Must be older than current age"),
  currentPensionPot: z.number().min(0, "Cannot be negative"),
  monthlyContribution: z.number().min(0, "Cannot be negative"),
  annualGrowthRate: z.number().min(0, "Cannot be negative"),
  annuityRate: z.number().min(0.1, "Annuity rate must be positive").max(20),
}).refine(data => data.retirementAge > data.currentAge, {
  message: "Retirement age must be after current age.",
  path: ["retirementAge"],
});

type FormData = z.infer<typeof formSchema>;

export default function PensionCalculator() {
  const [results, setResults] = useState<any>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currentAge: 35,
      retirementAge: 67,
      currentPensionPot: 75000,
      monthlyContribution: 400,
      annualGrowthRate: 5,
      annuityRate: 5,
    },
  });

  const calculatePension = (data: FormData) => {
    const {
      currentAge,
      retirementAge,
      currentPensionPot,
      monthlyContribution,
      annualGrowthRate,
      annuityRate
    } = data;
    
    const yearsToRetirement = retirementAge - currentAge;
    const monthsToRetirement = yearsToRetirement * 12;
    const monthlyRate = annualGrowthRate / 100 / 12;

    const fvOfCurrentPot = currentPensionPot * Math.pow(1 + monthlyRate, monthsToRetirement);
    const fvOfContributions = monthlyContribution * ( (Math.pow(1 + monthlyRate, monthsToRetirement) - 1) / monthlyRate );
    const projectedPensionPot = fvOfCurrentPot + fvOfContributions;
    const estimatedAnnualIncome = projectedPensionPot * (annuityRate / 100);

    const schedule = [];
    let balance = currentPensionPot;
    for (let year = 1; year <= yearsToRetirement; year++) {
        for (let month = 1; month <= 12; month++) {
            balance = balance * (1 + monthlyRate) + monthlyContribution;
        }
        schedule.push({
            age: currentAge + year,
            balance: balance,
        });
    }

    setResults({
      projectedPensionPot,
      estimatedAnnualIncome,
      schedule,
    });
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  return (
    <form onSubmit={handleSubmit(calculatePension)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs Column */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Your Details</h3>
        <div className="grid grid-cols-2 gap-4">
            <div><Label>Current Age</Label><Controller name="currentAge" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
            <div><Label>Retirement Age</Label><Controller name="retirementAge" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
        </div>
        {errors.retirementAge && <p className="text-destructive text-sm mt-1">{errors.retirementAge.message}</p>}
        
        <h3 className="text-xl font-semibold pt-4">Pension & Contributions</h3>
        <div><Label>Current Pension Pot ($)</Label><Controller name="currentPensionPot" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
        <div><Label>Monthly Contribution ($)</Label><Controller name="monthlyContribution" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
        
        <h3 className="text-xl font-semibold pt-4">Assumptions</h3>
        <div><Label>Annual Growth Rate (%)</Label><Controller name="annualGrowthRate" control={control} render={({ field }) => <Input type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
        <div><Label>Annuity Rate at Retirement (%)</Label><Controller name="annuityRate" control={control} render={({ field }) => <Input type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
        
        <Button type="submit" className="w-full">Calculate</Button>
      </div>

      {/* Results Column */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Retirement Projections</h3>
        {results ? (
            <div className="space-y-4">
                 <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-sm text-muted-foreground">Projected Pension Pot at Retirement</p>
                        <p className="text-3xl font-bold">{formatCurrency(results.projectedPensionPot)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-sm text-muted-foreground">Estimated Annual Income in Retirement</p>
                        <p className="text-3xl font-bold">{formatCurrency(results.estimatedAnnualIncome)}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <h4 className="font-semibold mb-4 text-center">Pension Growth</h4>
                        <div className="h-60">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={results.schedule} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="age" name="Age" />
                              <YAxis tickFormatter={(value) => formatCurrency(value)} />
                              <Tooltip formatter={(value: number) => formatCurrency(value)} />
                              <Legend />
                              <Line type="monotone" dataKey="balance" name="Pension Value" stroke="hsl(var(--primary))" dot={false} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        ) : (
             <div className="flex items-center justify-center h-60 bg-muted/50 rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">Enter your pension details to see projections</p>
            </div>
        )}
      </div>
    </form>
  );
}
