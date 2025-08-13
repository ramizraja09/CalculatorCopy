
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

const formSchema = z.object({
  unit: z.enum(['metric', 'imperial']),
  gender: z.enum(['male', 'female']),
  age: z.number().int().min(1, 'Age must be positive'),
  heightCm: z.number().optional(),
  weightKg: z.number().optional(),
  heightFt: z.number().optional(),
  heightIn: z.number().optional(),
  weightLbs: z.number().optional(),
}).refine(data => {
    if (data.unit === 'metric') return data.heightCm && data.weightKg;
    if (data.unit === 'imperial') return data.heightFt && data.weightLbs;
    return false;
}, { message: "Height and weight are required.", path: ['weightLbs'] });

type FormData = z.infer<typeof formSchema>;

export default function BmrCalculator() {
  const [results, setResults] = useState<any>(null);

  const { control, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      unit: 'imperial',
      gender: 'male',
      age: 30,
      heightFt: 5, heightIn: 10, weightLbs: 160,
      heightCm: 178, weightKg: 72,
    },
  });

  const unit = watch('unit');

  const calculateBmr = (data: FormData) => {
    const { unit, gender, age } = data;
    const height = unit === 'metric' ? data.heightCm! : (data.heightFt! * 12 + (data.heightIn || 0)) * 2.54;
    const weight = unit === 'metric' ? data.weightKg! : data.weightLbs! / 2.20462;
    
    // Revised Harris-Benedict Equation
    let bmr = 0;
    if (gender === 'male') {
        bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
    } else {
        bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
    }

    setResults({ bmr });
  };

  return (
    <form onSubmit={handleSubmit(calculateBmr)} className="grid md:grid-cols-2 gap-8">
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
            <Controller name="age" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))} />} />
        </div>
        {unit === 'imperial' && (
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Height (ft)</Label><Controller name="heightFt" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))} />} /></div>
            <div><Label>Height (in)</Label><Controller name="heightIn" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))} />} /></div>
            <div className="col-span-2"><Label>Weight (lbs)</Label><Controller name="weightLbs" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
          </div>
        )}
        {unit === 'metric' && (
           <div className="space-y-4">
            <div><Label>Height (cm)</Label><Controller name="heightCm" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
            <div><Label>Weight (kg)</Label><Controller name="weightKg" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
          </div>
        )}
         {errors.weightLbs && <p className="text-destructive text-sm mt-1">{errors.weightLbs.message}</p>}
        <Button type="submit" className="w-full">Calculate BMR</Button>
      </div>

      {/* Results */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Results</h3>
        {results ? (
            <Card>
                <CardContent className="p-6 text-center">
                    <p className="text-sm text-muted-foreground">Your Basal Metabolic Rate (BMR) is</p>
                    <p className="text-4xl font-bold my-2">{Math.round(results.bmr)}</p>
                    <p className="text-muted-foreground">calories per day</p>
                </CardContent>
            </Card>
        ) : (
             <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter details to calculate your BMR</p></div>
        )}
      </div>
    </form>
  );
}
