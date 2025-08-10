
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
  length: z.number().min(0.1, "Length must be positive"),
  width: z.number().min(0.1, "Width must be positive"),
});

type FormData = z.infer<typeof formSchema>;

export default function AcreageCalculator() {
  const [results, setResults] = useState<any>(null);

  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { length: 208.71, width: 208.71 },
  });

  const calculateAcreage = (data: FormData) => {
    const squareFeet = data.length * data.width;
    const acres = squareFeet / 43560; // 1 acre = 43,560 sq ft
    setResults({ acres, squareFeet });
  };

  return (
    <form onSubmit={handleSubmit(calculateAcreage)} className="grid md:grid-cols-2 gap-8">
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Plot Dimensions (in feet)</h3>
        <div><Label>Length (ft)</Label><Controller name="length" control={control} render={({ field }) => <Input type="number" step="any" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
        <div><Label>Width (ft)</Label><Controller name="width" control={control} render={({ field }) => <Input type="number" step="any" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
        <Button type="submit" className="w-full">Calculate Acreage</Button>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Result</h3>
        {results ? (
            <Card>
                <CardContent className="p-6 text-center">
                    <p className="text-sm text-muted-foreground">Total Acreage</p>
                    <p className="text-4xl font-bold my-2">{results.acres.toFixed(4)} acres</p>
                    <p className="text-muted-foreground">({results.squareFeet.toLocaleString()} sq ft)</p>
                </CardContent>
            </Card>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter dimensions to calculate acreage</p></div>
        )}
      </div>
    </form>
  );
}
