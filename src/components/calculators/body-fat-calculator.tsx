
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
  height: z.number().min(1),
  neck: z.number().min(1),
  waist: z.number().min(1),
  hip: z.number().optional(),
}).refine(data => data.gender === 'female' ? data.hip && data.hip > 0 : true, {
    message: "Hip measurement is required for females.",
    path: ["hip"],
});

type FormData = z.infer<typeof formSchema>;

export default function BodyFatCalculator() {
  const [results, setResults] = useState<any>(null);
  const { control, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { unit: 'imperial', gender: 'male', height: 70, neck: 15, waist: 34 },
  });

  const unit = watch('unit');
  const gender = watch('gender');

  const calculateBodyFat = (data: FormData) => {
    let { height, neck, waist, hip } = data;

    if (data.unit === 'imperial') {
        height *= 2.54;
        neck *= 2.54;
        waist *= 2.54;
        if (hip) hip *= 2.54;
    }

    let bodyFatPercentage = 0;
    if (data.gender === 'male') {
        bodyFatPercentage = 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(height)) - 450;
    } else if (hip) {
        bodyFatPercentage = 495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.22100 * Math.log10(height)) - 450;
    }
    
    setResults({ bodyFat: bodyFatPercentage });
  };

  return (
    <form onSubmit={handleSubmit(calculateBodyFat)} className="grid md:grid-cols-2 gap-8">
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
        <div><Label>Height ({unit === 'imperial' ? 'in' : 'cm'})</Label><Controller name="height" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
        <div><Label>Neck ({unit === 'imperial' ? 'in' : 'cm'})</Label><Controller name="neck" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
        <div><Label>Waist ({unit === 'imperial' ? 'in' : 'cm'})</Label><Controller name="waist" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
        {gender === 'female' && <div><Label>Hip ({unit === 'imperial' ? 'in' : 'cm'})</Label><Controller name="hip" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>}
        {errors.hip && <p className="text-destructive text-sm mt-1">{errors.hip.message}</p>}
        <Button type="submit" className="w-full">Calculate Body Fat</Button>
      </div>

      {/* Results */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Results</h3>
        {results ? (
            <Card>
                <CardContent className="p-6 text-center">
                    <p className="text-sm text-muted-foreground">Estimated Body Fat</p>
                    <p className="text-4xl font-bold my-2">{results.bodyFat.toFixed(1)}%</p>
                </CardContent>
            </Card>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter details to estimate body fat</p></div>
        )}
      </div>
    </form>
  );
}
