
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
  bodyFat: z.number().min(1, 'Body fat % is required').max(80),
}).refine(data => {
    if (data.unit === 'metric') return data.heightCm! > 0 && data.weightKg! > 0;
    if (data.unit === 'imperial') return data.heightFt! > 0 && data.weightLbs! > 0;
    return false;
}, { message: "Height and weight are required.", path: ['weightLbs'] });

type FormData = z.infer<typeof formSchema>;

export default function FfmiCalculator() {
  const [results, setResults] = useState<any>(null);
  const { control, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { unit: 'imperial', heightFt: 5, heightIn: 10, weightLbs: 180, bodyFat: 15 },
  });

  const unit = watch('unit');

  const calculateFfmi = (data: FormData) => {
    const heightMeters = unit === 'metric' 
      ? data.heightCm! / 100 
      : ((data.heightFt! * 12) + (data.heightIn || 0)) * 0.0254;

    const weightKg = unit === 'metric' 
      ? data.weightKg! 
      : data.weightLbs! / 2.20462;

    const fatMass = weightKg * (data.bodyFat / 100);
    const leanMass = weightKg - fatMass;
    const ffmi = leanMass / (heightMeters ** 2);
    
    // Adjusted FFMI (for taller individuals)
    const adjustedFfmi = ffmi + 6.1 * (1.8 - heightMeters);

    setResults({ ffmi, adjustedFfmi });
  };

  return (
    <form onSubmit={handleSubmit(calculateFfmi)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Inputs</h3>
        <Controller name="unit" control={control} render={({ field }) => (
            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 gap-4">
                <Label className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><RadioGroupItem value="imperial" className="mr-2"/>Imperial</Label>
                <Label className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><RadioGroupItem value="metric" className="mr-2"/>Metric</Label>
            </RadioGroup>
        )}/>
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
            <Label>Body Fat (%)</Label>
            <Controller name="bodyFat" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
            {errors.bodyFat && <p className="text-destructive text-sm mt-1">{errors.bodyFat.message}</p>}
        </div>
        <Button type="submit" className="w-full">Calculate FFMI</Button>
      </div>

      {/* Results */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Results</h3>
        {results ? (
            <div className="space-y-4">
                <Card>
                    <CardContent className="p-6 text-center">
                        <p className="text-sm text-muted-foreground">FFMI</p>
                        <p className="text-4xl font-bold my-2">{results.ffmi.toFixed(1)}</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardContent className="p-6 text-center">
                        <p className="text-sm text-muted-foreground">Adjusted FFMI</p>
                        <p className="text-2xl font-bold my-2">{results.adjustedFfmi.toFixed(1)}</p>
                        <p className="text-xs text-muted-foreground">(Normalized for height)</p>
                    </CardContent>
                </Card>
            </div>
        ) : (
             <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter details to calculate your FFMI</p></div>
        )}
      </div>
    </form>
  );
}
