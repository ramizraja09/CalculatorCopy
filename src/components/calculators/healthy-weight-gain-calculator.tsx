
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const formSchema = z.object({
  tdee: z.number().min(1, 'TDEE must be positive'),
  goal: z.enum(['slow', 'steady', 'fast']),
});

type FormData = z.infer<typeof formSchema>;

const surplusCalories = {
    slow: 250,
    steady: 500,
    fast: 750,
}

export default function HealthyWeightGainCalculator() {
  const [results, setResults] = useState<any>(null);
  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { tdee: 2500, goal: 'steady' },
  });

  const calculateCalories = (data: FormData) => {
    const surplus = surplusCalories[data.goal];
    const targetCalories = data.tdee + surplus;

    setResults({
        targetCalories,
        surplus
    });
  };

  return (
    <form onSubmit={handleSubmit(calculateCalories)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Inputs</h3>
        <div>
          <Label htmlFor="tdee">Maintenance Calories (TDEE)</Label>
          <Controller name="tdee" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} />
          <p className="text-xs text-muted-foreground mt-1">If you don't know this, use our TDEE Calculator first.</p>
          {errors.tdee && <p className="text-destructive text-sm mt-1">{errors.tdee.message}</p>}
        </div>
        <div>
          <Label>Weight Gain Goal</Label>
          <Controller name="goal" control={control} render={({ field }) => (
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent>
                <SelectItem value="slow">Slow Gain (~0.5 lbs/week)</SelectItem>
                <SelectItem value="steady">Steady Gain (~1 lb/week)</SelectItem>
                <SelectItem value="fast">Fast Gain (~1.5 lbs/week)</SelectItem>
              </SelectContent>
            </Select>
          )} />
        </div>
        <Button type="submit" className="w-full">Calculate Calorie Target</Button>
      </div>

      {/* Results */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Results</h3>
        {results ? (
            <Card>
                <CardContent className="p-6 text-center">
                    <p className="text-sm text-muted-foreground">Target Daily Calorie Intake</p>
                    <p className="text-4xl font-bold my-2">{Math.round(results.targetCalories)}</p>
                    <p className="text-muted-foreground">({Math.round(results.surplus)} calorie surplus)</p>
                </CardContent>
            </Card>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter details to calculate calorie goal</p></div>
        )}
      </div>
    </form>
  );
}
