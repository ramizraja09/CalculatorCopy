
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const formSchema = z.object({
  currentAge: z.number().int().min(0).max(17, 'Child must be under 18'),
  collegeAge: z.number().int().min(18).default(18),
  annualCost: z.number().min(1, 'Annual cost is required'),
  yearsInCollege: z.number().int().min(1).max(10).default(4),
  currentSavings: z.number().min(0, 'Cannot be negative'),
  annualReturn: z.number().min(0, 'Cannot be negative'),
  costIncreaseRate: z.number().min(0, 'Cannot be negative'),
});

type FormData = z.infer<typeof formSchema>;

export default function CollegeSavingsCalculator() {
  const [results, setResults] = useState<any>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { currentAge: 5, collegeAge: 18, annualCost: 25000, yearsInCollege: 4, currentSavings: 10000, annualReturn: 6, costIncreaseRate: 5 },
  });

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const calculateSavings = (data: FormData) => {
    const { currentAge, collegeAge, annualCost, yearsInCollege, currentSavings, annualReturn, costIncreaseRate } = data;
    const yearsToCollege = collegeAge - currentAge;
    const monthlyReturn = annualReturn / 100 / 12;
    const monthsToCollege = yearsToCollege * 12;

    let totalFutureCost = 0;
    for (let i = 0; i < yearsInCollege; i++) {
        totalFutureCost += annualCost * Math.pow(1 + costIncreaseRate / 100, yearsToCollege + i);
    }
    
    const fvOfCurrentSavings = currentSavings * Math.pow(1 + monthlyReturn, monthsToCollege);
    const shortfall = totalFutureCost - fvOfCurrentSavings;

    let monthlyContribution = 0;
    if (shortfall > 0) {
        if (monthlyReturn === 0) {
            monthlyContribution = shortfall / monthsToCollege;
        } else {
            monthlyContribution = shortfall / ((Math.pow(1 + monthlyReturn, monthsToCollege) - 1) / monthlyReturn);
        }
    }

    setResults({ totalFutureCost, fvOfCurrentSavings, shortfall, monthlyContribution: Math.max(0, monthlyContribution) });
  };

  return (
    <form onSubmit={handleSubmit(calculateSavings)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs Column */}
      <div className="space-y-4">
        <Card><CardHeader><CardTitle>Student & College</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div><Label>Child's Current Age</Label><Controller name="currentAge" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
                    <div><Label>Age at College</Label><Controller name="collegeAge" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
                </div>
                 <div><Label>Annual College Cost (today's dollars)</Label><Controller name="annualCost" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                 <div><Label>Years in College</Label><Controller name="yearsInCollege" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
            </CardContent>
        </Card>
        <Card><CardHeader><CardTitle>Savings & Growth</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div><Label>Current College Savings ($)</Label><Controller name="currentSavings" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                <div><Label>Estimated Annual Return (%)</Label><Controller name="annualReturn" control={control} render={({ field }) => <Input type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                <div><Label>College Cost Inflation Rate (%)</Label><Controller name="costIncreaseRate" control={control} render={({ field }) => <Input type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
            </CardContent>
        </Card>
        <Button type="submit" className="w-full">Calculate</Button>
      </div>

      {/* Results Column */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Results</h3>
        {results ? (
             <div className="space-y-4">
                 <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-sm text-muted-foreground">You'll need to save</p>
                        <p className="text-3xl font-bold text-primary">{formatCurrency(results.monthlyContribution)}</p>
                        <p className="text-sm text-muted-foreground">per month to reach your goal.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 grid grid-cols-2 gap-2 text-sm">
                         <div><p className="text-muted-foreground">Projected Total Cost</p><p className="font-semibold">{formatCurrency(results.totalFutureCost)}</p></div>
                         <div><p className="text-muted-foreground">Projected Savings</p><p className="font-semibold">{formatCurrency(results.fvOfCurrentSavings)}</p></div>
                         <div><p className="text-muted-foreground">Shortfall</p><p className="font-semibold">{formatCurrency(results.shortfall)}</p></div>
                    </CardContent>
                </Card>
             </div>
        ) : (
             <div className="flex items-center justify-center h-60 bg-muted/50 rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">Enter your college savings details to see your plan</p>
            </div>
        )}
      </div>
    </form>
  );
}
