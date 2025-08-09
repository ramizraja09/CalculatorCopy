
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const formSchema = z.object({
  savingsGoal: z.number().min(1, "Savings goal must be positive"),
  currentSavings: z.number().min(0, "Current savings cannot be negative"),
  yearsToGrow: z.number().min(1, "Must be at least 1 year"),
  annualRate: z.number().min(0, "Rate cannot be negative"),
});

type FormData = z.infer<typeof formSchema>;

export default function SavingsGoalCalculator() {
  const [results, setResults] = useState<any>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      savingsGoal: 25000,
      currentSavings: 5000,
      yearsToGrow: 5,
      annualRate: 5,
    },
  });

  const calculateSavings = (data: FormData) => {
    const { savingsGoal, currentSavings, yearsToGrow, annualRate } = data;
    const fv = savingsGoal;
    const pv = currentSavings;
    const nper = yearsToGrow * 12;
    const rate = annualRate / 100 / 12;

    let monthlyContribution;

    if (rate === 0) {
        monthlyContribution = (fv - pv) / nper;
    } else {
        const futureValueOfPresentSavings = pv * Math.pow(1 + rate, nper);
        monthlyContribution = (fv - futureValueOfPresentSavings) / ((Math.pow(1 + rate, nper) - 1) / rate);
    }
    
    if (!isFinite(monthlyContribution) || monthlyContribution < 0) {
        setResults({ error: "Goal is already met or exceeded by current savings growth." });
        return;
    }

    setResults({ monthlyContribution, error: null });
  };
  
  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  return (
    <form onSubmit={handleSubmit(calculateSavings)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Your Goal</h3>
        <div>
          <Label htmlFor="savingsGoal">Savings Goal ($)</Label>
          <Controller name="savingsGoal" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
          {errors.savingsGoal && <p className="text-destructive text-sm mt-1">{errors.savingsGoal.message}</p>}
        </div>
         <div>
          <Label htmlFor="currentSavings">Current Savings ($)</Label>
          <Controller name="currentSavings" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
           {errors.currentSavings && <p className="text-destructive text-sm mt-1">{errors.currentSavings.message}</p>}
        </div>
        <div>
          <Label htmlFor="yearsToGrow">Time to Save (Years)</Label>
          <Controller name="yearsToGrow" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />} />
          {errors.yearsToGrow && <p className="text-destructive text-sm mt-1">{errors.yearsToGrow.message}</p>}
        </div>
        <div>
          <Label htmlFor="annualRate">Expected Annual Return (%)</Label>
          <Controller name="annualRate" control={control} render={({ field }) => <Input type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
          {errors.annualRate && <p className="text-destructive text-sm mt-1">{errors.annualRate.message}</p>}
        </div>
        <Button type="submit" className="w-full">Calculate</Button>
      </div>

      {/* Results */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Results</h3>
        {results ? (
             results.error ? (
                <Card className="flex items-center justify-center h-60 bg-muted/50 border-dashed">
                    <p className="text-destructive text-center p-4">{results.error}</p>
                </Card>
            ) : (
            <Card>
                <CardContent className="p-6 text-center">
                    <p className="text-sm text-muted-foreground">You need to save</p>
                    <p className="text-4xl font-bold my-2">{formatCurrency(results.monthlyContribution)}</p>
                    <p className="text-muted-foreground">per month to reach your goal.</p>
                </CardContent>
            </Card>
        )) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter your goal details</p></div>
        )}
      </div>
    </form>
  );
}
