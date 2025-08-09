
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
  weightLbs: z.number().min(1),
  exerciseMinutes: z.number().min(0),
});

type FormData = z.infer<typeof formSchema>;

export default function WaterIntakeCalculator() {
  const [results, setResults] = useState<any>(null);
  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { weightLbs: 160, exerciseMinutes: 30 },
  });

  const calculateWaterIntake = (data: FormData) => {
    // General formula: weight (lbs) / 2.2 * 30-35 ml. We'll use an average and add for exercise.
    // A simpler common formula is weight in lbs * 2/3 for ounces
    const baseOunces = data.weightLbs * (2/3);
    const exerciseOunces = (data.exerciseMinutes / 30) * 12;
    const totalOunces = baseOunces + exerciseOunces;
    setResults({ totalOunces });
  };

  return (
    <form onSubmit={handleSubmit(calculateWaterIntake)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Inputs</h3>
        <div><Label>Weight (lbs)</Label><Controller name="weightLbs" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
        <div><Label>Daily Exercise (minutes)</Label><Controller name="exerciseMinutes" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
        <Button type="submit" className="w-full">Calculate Intake</Button>
      </div>

      {/* Results */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Recommended Daily Intake</h3>
        {results ? (
            <Card>
                <CardContent className="p-6 text-center">
                    <p className="text-sm text-muted-foreground">Total Water Needed</p>
                    <p className="text-4xl font-bold my-2">{results.totalOunces.toFixed(0)} oz</p>
                    <p className="text-muted-foreground">({(results.totalOunces / 8).toFixed(1)} glasses or {(results.totalOunces * 0.0295735).toFixed(1)} liters)</p>
                </CardContent>
            </Card>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter details to estimate water needs</p></div>
        )}
      </div>
    </form>
  );
}
