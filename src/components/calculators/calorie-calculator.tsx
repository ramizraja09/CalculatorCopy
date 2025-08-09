
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
  unit: z.enum(['metric', 'imperial']),
  gender: z.enum(['male', 'female']),
  age: z.number().int().min(1, 'Age must be positive'),
  heightCm: z.number().optional(),
  weightKg: z.number().optional(),
  heightFt: z.number().optional(),
  heightIn: z.number().optional(),
  weightLbs: z.number().optional(),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']),
}).refine(data => {
    if (data.unit === 'metric') return data.heightCm && data.weightKg;
    if (data.unit === 'imperial') return data.heightFt && data.weightLbs;
    return false;
}, { message: "Height and weight are required.", path: ['weightLbs'] });

type FormData = z.infer<typeof formSchema>;

const activityMultipliers = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export default function CalorieCalculator() {
  const [results, setResults] = useState<any>(null);

  const { control, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      unit: 'imperial',
      gender: 'male',
      age: 30,
      activityLevel: 'moderate',
      heightFt: 5, heightIn: 10, weightLbs: 160,
      heightCm: 178, weightKg: 72,
    },
  });

  const unit = watch('unit');

  const calculateCalories = (data: FormData) => {
    const { unit, gender, age, activityLevel } = data;
    const height = unit === 'metric' ? data.heightCm! : (data.heightFt! * 12 + (data.heightIn || 0)) * 2.54;
    const weight = unit === 'metric' ? data.weightKg! : data.weightLbs! / 2.20462;
    
    // Mifflin-St Jeor Equation for BMR
    let bmr = (10 * weight) + (6.25 * height) - (5 * age);
    bmr += (gender === 'male' ? 5 : -161);

    const tdee = bmr * activityMultipliers[activityLevel];

    setResults({
      maintain: tdee,
      mildLoss: tdee - 250,
      weightLoss: tdee - 500,
      extremeLoss: tdee - 1000,
      mildGain: tdee + 250,
      weightGain: tdee + 500,
    });
  };

  return (
    <form onSubmit={handleSubmit(calculateCalories)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Inputs</h3>
        <Controller name="unit" control={control} render={({ field }) => (
            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 gap-4">
                <Label className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><RadioGroupItem value="imperial" className="mr-2"/>Imperial</Label>
                <Label className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><RadioGroupItem value="metric" className="mr-2"/>Metric</Label>
            </RadioGroup>
        )}/>
        <Controller name="gender" control={control} render={({ field }) => (
            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 gap-4">
                <Label className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><RadioGroupItem value="male" className="mr-2"/>Male</Label>
                <Label className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><RadioGroupItem value="female" className="mr-2"/>Female</Label>
            </RadioGroup>
        )}/>
        <div>
            <Label htmlFor="age">Age</Label>
            <Controller name="age" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} />
        </div>
        {unit === 'imperial' && (
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Height (ft)</Label><Controller name="heightFt" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
            <div><Label>Height (in)</Label><Controller name="heightIn" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
            <div className="col-span-2"><Label>Weight (lbs)</Label><Controller name="weightLbs" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
          </div>
        )}
        {unit === 'metric' && (
           <div className="space-y-4">
            <div><Label>Height (cm)</Label><Controller name="heightCm" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
            <div><Label>Weight (kg)</Label><Controller name="weightKg" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
          </div>
        )}
         {errors.weightLbs && <p className="text-destructive text-sm mt-1">{errors.weightLbs.message}</p>}
        <div>
          <Label>Activity Level</Label>
          <Controller name="activityLevel" control={control} render={({ field }) => (
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent>
                <SelectItem value="sedentary">Sedentary (little to no exercise)</SelectItem>
                <SelectItem value="light">Lightly Active (light exercise/sports 1-3 days/week)</SelectItem>
                <SelectItem value="moderate">Moderately Active (moderate exercise/sports 3-5 days/week)</SelectItem>
                <SelectItem value="active">Very Active (hard exercise/sports 6-7 days a week)</SelectItem>
                <SelectItem value="very_active">Super Active (very hard exercise/sports & physical job)</SelectItem>
              </SelectContent>
            </Select>
          )} />
        </div>
        <Button type="submit" className="w-full">Calculate</Button>
      </div>

      {/* Results */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Results</h3>
        {results ? (
            <Card>
                <CardContent className="p-4 space-y-2">
                    <div className="text-center p-4 bg-primary/10 rounded-lg">
                        <p className="font-semibold text-primary">Maintain Weight</p>
                        <p className="text-2xl font-bold">{Math.round(results.maintain)} Calories/day</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="text-center">
                            <p className="font-semibold text-yellow-600">Weight Loss</p>
                            <p><span className="font-medium">Mild (0.5 lb/wk):</span> {Math.round(results.mildLoss)}</p>
                            <p><span className="font-medium">Normal (1 lb/wk):</span> {Math.round(results.weightLoss)}</p>
                            <p><span className="font-medium">Extreme (2 lb/wk):</span> {Math.round(results.extremeLoss)}</p>
                        </div>
                        <div className="text-center">
                            <p className="font-semibold text-green-600">Weight Gain</p>
                            <p><span className="font-medium">Mild (0.5 lb/wk):</span> {Math.round(results.mildGain)}</p>
                             <p><span className="font-medium">Normal (1 lb/wk):</span> {Math.round(results.weightGain)}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        ) : (
             <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter details to calculate calorie needs</p></div>
        )}
      </div>
    </form>
  );
}
