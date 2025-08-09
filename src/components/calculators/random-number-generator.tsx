
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
  min: z.number().int(),
  max: z.number().int(),
}).refine(data => data.max > data.min, {
    message: "Max must be greater than Min",
    path: ['max'],
});

type FormData = z.infer<typeof formSchema>;

export default function RandomNumberGenerator() {
  const [result, setResult] = useState<number | null>(null);
  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { min: 1, max: 100 },
  });

  const generateRandom = (data: FormData) => {
    const { min, max } = data;
    const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
    setResult(randomNumber);
  };

  return (
    <form onSubmit={handleSubmit(generateRandom)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Range</h3>
        <div>
            <Label>Min</Label>
            <Controller name="min" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} />
        </div>
         <div>
            <Label>Max</Label>
            <Controller name="max" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} />
        </div>
        {errors.max && <p className="text-destructive text-sm mt-1">{errors.max.message}</p>}
        <Button type="submit" className="w-full">Generate</Button>
      </div>
      {/* Results */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Result</h3>
        {result !== null ? (
            <Card>
                <CardContent className="p-6 text-center">
                    <p className="text-6xl font-bold">{result}</p>
                </CardContent>
            </Card>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Click "Generate" to get a random number</p></div>
        )}
      </div>
    </form>
  );
}
