
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
  unit: z.enum(['imperial', 'metric']),
  gender: z.enum(['male', 'female']),
  fatherHeightFt: z.number().optional(),
  fatherHeightIn: z.number().optional(),
  motherHeightFt: z.number().optional(),
  motherHeightIn: z.number().optional(),
  fatherHeightCm: z.number().optional(),
  motherHeightCm: z.number().optional(),
}).refine(data => {
    if(data.unit === 'imperial') return data.fatherHeightFt! > 0 && data.motherHeightFt! > 0;
    return data.fatherHeightCm! > 0 && data.motherHeightCm! > 0;
}, {message: "Parent heights are required.", path: ['fatherHeightFt']});

type FormData = z.infer<typeof formSchema>;

export default function ChildHeightPredictor() {
  const [results, setResults] = useState<any>(null);
  const { control, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { unit: 'imperial', gender: 'male', fatherHeightFt: 6, motherHeightFt: 5, motherHeightIn: 6 },
  });

  const unit = watch('unit');

  const predictHeight = (data: FormData) => {
    const fatherH = data.unit === 'imperial' ? (data.fatherHeightFt! * 12) + (data.fatherHeightIn || 0) : data.fatherHeightCm! / 2.54;
    const motherH = data.unit === 'imperial' ? (data.motherHeightFt! * 12) + (data.motherHeightIn || 0) : data.motherHeightCm! / 2.54;

    let predictedInches;
    if (data.gender === 'male') {
        predictedInches = ((fatherH + 5) + motherH) / 2;
    } else {
        predictedInches = (fatherH + (motherH - 5)) / 2;
    }
    
    const ft = Math.floor(predictedInches / 12);
    const inch = (predictedInches % 12).toFixed(1);
    const cm = (predictedInches * 2.54).toFixed(1);
    
    setResults({ ft, inch, cm });
  };

  return (
    <form onSubmit={handleSubmit(predictHeight)} className="grid md:grid-cols-2 gap-8">
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
                <Label className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><RadioGroupItem value="male" className="mr-2"/>Boy</Label>
                <Label className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><RadioGroupItem value="female" className="mr-2"/>Girl</Label>
            </RadioGroup>
        )}/>
        {unit === 'imperial' ? (
            <>
            <div>
              <Label>Father's Height</Label>
              <div className="flex gap-2"><Controller name="fatherHeightFt" control={control} render={({ field }) => <Input placeholder="ft" type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /><Controller name="fatherHeightIn" control={control} render={({ field }) => <Input placeholder="in" type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
            </div>
            <div>
              <Label>Mother's Height</Label>
              <div className="flex gap-2"><Controller name="motherHeightFt" control={control} render={({ field }) => <Input placeholder="ft" type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /><Controller name="motherHeightIn" control={control} render={({ field }) => <Input placeholder="in" type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
            </div>
            </>
        ) : (
            <>
            <div><Label>Father's Height (cm)</Label><Controller name="fatherHeightCm" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
            <div><Label>Mother's Height (cm)</Label><Controller name="motherHeightCm" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
            </>
        )}
        {errors.fatherHeightFt && <p className="text-destructive text-sm mt-1">{errors.fatherHeightFt.message}</p>}
        <Button type="submit" className="w-full">Predict Height</Button>
      </div>

      {/* Results */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Predicted Adult Height</h3>
        {results ? (
            <Card>
                <CardContent className="p-6 text-center">
                    <p className="text-sm text-muted-foreground">Estimated Height</p>
                    <p className="text-4xl font-bold my-2">{results.ft}' {results.inch}"</p>
                    <p className="text-muted-foreground">({results.cm} cm)</p>
                </CardContent>
            </Card>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter details to predict height</p></div>
        )}
      </div>
    </form>
  );
}
