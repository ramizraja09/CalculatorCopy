
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
  heightCm: z.number().optional(),
  weightKg: z.number().optional(),
  heightFt: z.number().optional(),
  heightIn: z.number().optional(),
  weightLbs: z.number().optional(),
}).refine(data => {
    if (data.unit === 'metric') {
        return data.heightCm && data.heightCm > 0 && data.weightKg && data.weightKg > 0;
    }
    if (data.unit === 'imperial') {
        return data.heightFt && data.heightFt > 0 && data.weightLbs && data.weightLbs > 0;
    }
    return false;
}, {
    message: "Please enter valid height and weight.",
    path: ["weightLbs"], 
});

type FormData = z.infer<typeof formSchema>;

const getBmiCategory = (bmi: number) => {
    if (bmi < 18.5) return { category: "Underweight", color: "text-blue-500" };
    if (bmi < 25) return { category: "Normal weight", color: "text-green-500" };
    if (bmi < 30) return { category: "Overweight", color: "text-yellow-500" };
    return { category: "Obese", color: "text-red-500" };
};

export default function BmiCalculator() {
  const [results, setResults] = useState<any>(null);

  const { control, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      unit: 'imperial',
      heightFt: 5,
      heightIn: 10,
      weightLbs: 160,
      heightCm: 178,
      weightKg: 72,
    },
  });

  const unit = watch('unit');

  const calculateBmi = (data: FormData) => {
    let bmi = 0;
    if (data.unit === 'metric' && data.heightCm && data.weightKg) {
        const heightMeters = data.heightCm / 100;
        bmi = data.weightKg / (heightMeters * heightMeters);
    } else if (data.unit === 'imperial' && data.heightFt && data.weightLbs) {
        const totalInches = (data.heightFt * 12) + (data.heightIn || 0);
        bmi = (data.weightLbs / (totalInches * totalInches)) * 703;
    }

    if (bmi > 0) {
        setResults({
            bmi: bmi.toFixed(1),
            category: getBmiCategory(bmi),
            error: null
        });
    }
  };

  return (
    <form onSubmit={handleSubmit(calculateBmi)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs Column */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Inputs</h3>
        
        <Controller
          name="unit"
          control={control}
          render={({ field }) => (
            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 gap-4">
                <Label htmlFor="imperial" className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                    <RadioGroupItem value="imperial" id="imperial" className="mr-2" />
                    Imperial
                </Label>
                <Label htmlFor="metric" className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                    <RadioGroupItem value="metric" id="metric" className="mr-2" />
                    Metric
                </Label>
            </RadioGroup>
        )}/>

        {unit === 'imperial' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
                <Label htmlFor="heightFt">Height (ft)</Label>
                <Controller name="heightFt" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} />
            </div>
             <div>
                <Label htmlFor="heightIn">Height (in)</Label>
                <Controller name="heightIn" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} />
            </div>
             <div className="col-span-2">
                <Label htmlFor="weightLbs">Weight (lbs)</Label>
                <Controller name="weightLbs" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
            </div>
          </div>
        )}

        {unit === 'metric' && (
           <div className="space-y-4">
            <div>
                <Label htmlFor="heightCm">Height (cm)</Label>
                <Controller name="heightCm" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
            </div>
            <div>
                <Label htmlFor="weightKg">Weight (kg)</Label>
                <Controller name="weightKg" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
            </div>
          </div>
        )}
        {errors.weightLbs && <p className="text-destructive text-sm mt-1">{errors.weightLbs.message}</p>}
        
        <Button type="submit" className="w-full">Calculate BMI</Button>
      </div>

      {/* Results Column */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Results</h3>
        {results ? (
            <Card>
                <CardContent className="p-6 text-center">
                    <p className="text-sm text-muted-foreground">Your BMI is</p>
                    <p className="text-4xl font-bold my-2">{results.bmi}</p>
                    <p className={`text-lg font-semibold ${results.category.color}`}>{results.category.category}</p>
                </CardContent>
            </Card>
        ) : (
             <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">Enter your details to calculate your BMI</p>
            </div>
        )}
      </div>
    </form>
  );
}
