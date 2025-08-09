
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const formSchema = z.object({
  weight: z.number().min(1),
  unit: z.enum(['lbs', 'kg']),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']),
  goal: z.enum(['maintenance', 'fat_loss', 'muscle_gain']),
});

type FormData = z.infer<typeof formSchema>;

const proteinFactors = {
    sedentary: { maintenance: 1.2, fat_loss: 1.4, muscle_gain: 1.6 },
    light: { maintenance: 1.4, fat_loss: 1.6, muscle_gain: 1.8 },
    moderate: { maintenance: 1.6, fat_loss: 1.8, muscle_gain: 2.0 },
    active: { maintenance: 1.8, fat_loss: 2.0, muscle_gain: 2.2 },
    very_active: { maintenance: 2.0, fat_loss: 2.2, muscle_gain: 2.4 },
}

export default function ProteinIntakeCalculator() {
  const [results, setResults] = useState<any>(null);
  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { weight: 160, unit: 'lbs', activityLevel: 'moderate', goal: 'maintenance' },
  });

  const calculateProtein = (data: FormData) => {
    const weightKg = data.unit === 'lbs' ? data.weight / 2.20462 : data.weight;
    const factor = proteinFactors[data.activityLevel][data.goal];
    const proteinGrams = weightKg * factor;
    
    setResults({
      proteinGrams,
    });
  };

  return (
    <form onSubmit={handleSubmit(calculateProtein)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Inputs</h3>
        <div>
          <Label>Weight</Label>
          <div className="flex gap-2">
            <Controller name="weight" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
            <Controller name="unit" control={control} render={({ field }) => (
                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 gap-2 items-center">
                    <Label className="px-3 py-2 border rounded-md text-center text-sm peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><RadioGroupItem value="lbs" className="sr-only"/>lbs</Label>
                    <Label className="px-3 py-2 border rounded-md text-center text-sm peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><RadioGroupItem value="kg" className="sr-only"/>kg</Label>
                </RadioGroup>
            )} />
          </div>
        </div>
        <div>
          <Label>Activity Level</Label>
          <Controller name="activityLevel" control={control} render={({ field }) => (
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent>
                <SelectItem value="sedentary">Sedentary</SelectItem>
                <SelectItem value="light">Lightly Active</SelectItem>
                <SelectItem value="moderate">Moderately Active</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="very_active">Very Active</SelectItem>
              </SelectContent>
            </Select>
          )} />
        </div>
         <div>
          <Label>Primary Goal</Label>
          <Controller name="goal" control={control} render={({ field }) => (
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="fat_loss">Fat Loss</SelectItem>
                <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
              </SelectContent>
            </Select>
          )} />
        </div>
        <Button type="submit" className="w-full">Calculate Protein</Button>
      </div>

      {/* Results */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Recommended Daily Protein Intake</h3>
        {results ? (
            <Card>
                <CardContent className="p-6 text-center">
                    <p className="text-4xl font-bold my-2">{results.proteinGrams.toFixed(0)}g</p>
                    <p className="text-muted-foreground">grams per day</p>
                </CardContent>
            </Card>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter details to estimate protein needs</p></div>
        )}
      </div>
    </form>
  );
}
