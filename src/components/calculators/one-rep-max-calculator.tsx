
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
  weight: z.number().min(1, "Weight must be positive"),
  reps: z.number().int().min(1, "Reps must be at least 1").max(10, "Reps should be 10 or less for accuracy"),
});

type FormData = z.infer<typeof formSchema>;

export default function OneRepMaxCalculator() {
  const [results, setResults] = useState<any>(null);
  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { weight: 135, reps: 5 },
  });

  const calculate1rm = (data: FormData) => {
    // Brzycki formula
    const oneRepMax = data.weight * (36 / (37 - data.reps));
    setResults({ oneRepMax });
  };

  return (
    <form onSubmit={handleSubmit(calculate1rm)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Inputs</h3>
        <div>
          <Label htmlFor="weight">Weight Lifted</Label>
          <Controller name="weight" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
          {errors.weight && <p className="text-destructive text-sm mt-1">{errors.weight.message}</p>}
        </div>
        <div>
          <Label htmlFor="reps">Repetitions</Label>
          <Controller name="reps" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} />
          {errors.reps && <p className="text-destructive text-sm mt-1">{errors.reps.message}</p>}
        </div>
        <Button type="submit" className="w-full">Calculate 1RM</Button>
      </div>

      {/* Results */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Results</h3>
        {results ? (
            <Card>
                <CardContent className="p-6 text-center">
                    <p className="text-sm text-muted-foreground">Estimated One-Rep Max</p>
                    <p className="text-4xl font-bold my-2">{results.oneRepMax.toFixed(1)}</p>
                </CardContent>
            </Card>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter details to estimate your 1RM</p></div>
        )}
      </div>
    </form>
  );
}
