
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
  number: z.number(),
  root: z.number().int().min(2, "Root must be 2 or greater"),
});

type FormData = z.infer<typeof formSchema>;

export default function RootCalculator() {
  const [results, setResults] = useState<any>(null);
  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { number: 27, root: 3 },
  });

  const calculateRoot = (data: FormData) => {
    const result = Math.pow(data.number, 1 / data.root);
    setResults({ result: result.toFixed(5) });
  };

  return (
    <form onSubmit={handleSubmit(calculateRoot)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Inputs</h3>
        <div><Label>Number</Label><Controller name="number" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
        <div><Label>Root (e.g., 2 for square root)</Label><Controller name="root" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
        <Button type="submit" className="w-full">Calculate Root</Button>
      </div>

      {/* Results */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Result</h3>
        {results ? (
            <Card><CardContent className="p-6 text-center"><p className="text-4xl font-bold">{results.result}</p></CardContent></Card>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter number and root to calculate</p></div>
        )}
      </div>
    </form>
  );
}
