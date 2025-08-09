
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
  n: z.number().int().min(1, 'n must be at least 1'),
  r: z.number().int().min(1, 'r must be at least 1'),
}).refine(data => data.n >= data.r, {
    message: "n must be greater than or equal to r",
    path: ['r'],
});

type FormData = z.infer<typeof formSchema>;

const factorial = (num: number): number => {
  if (num < 0) return -1;
  if (num === 0) return 1;
  return num * factorial(num - 1);
};

export default function CombinationsPermutationsCalculator() {
  const [results, setResults] = useState<any>(null);
  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { n: 10, r: 3 },
  });

  const calculate = (data: FormData) => {
    const { n, r } = data;
    const nFact = factorial(n);
    const rFact = factorial(r);
    const nMinusRFact = factorial(n - r);

    const permutations = nFact / nMinusRFact;
    const combinations = nFact / (rFact * nMinusRFact);
    setResults({ combinations, permutations });
  };

  return (
    <form onSubmit={handleSubmit(calculate)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Inputs</h3>
        <div><Label>Total number of items (n)</Label><Controller name="n" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} />
        {errors.n && <p className="text-destructive text-sm mt-1">{errors.n.message}</p>}</div>
        <div><Label>Number of items to choose (r)</Label><Controller name="r" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} />
        {errors.r && <p className="text-destructive text-sm mt-1">{errors.r.message}</p>}</div>
        <Button type="submit" className="w-full">Calculate</Button>
      </div>

      {/* Results */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Results</h3>
        {results ? (
            <div className="grid grid-cols-1 gap-4">
                <Card><CardContent className="p-4 text-center"><p className="text-muted-foreground">Combinations (nCr)</p><p className="text-2xl font-bold">{results.combinations.toLocaleString()}</p></CardContent></Card>
                <Card><CardContent className="p-4 text-center"><p className="text-muted-foreground">Permutations (nPr)</p><p className="text-2xl font-bold">{results.permutations.toLocaleString()}</p></CardContent></Card>
            </div>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter n and r to calculate</p></div>
        )}
      </div>
    </form>
  );
}
