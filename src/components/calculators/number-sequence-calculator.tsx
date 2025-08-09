
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
  sequence: z.string().refine(val => val.split(',').length >= 3, "Enter at least 3 numbers."),
  terms: z.number().int().min(1).max(20),
});

type FormData = z.infer<typeof formSchema>;

export default function NumberSequenceCalculator() {
  const [results, setResults] = useState<any>(null);
  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { sequence: '2, 4, 6', terms: 5 },
  });

  const calculateSequence = (data: FormData) => {
    const nums = data.sequence.split(',').map(Number).filter(n => !isNaN(n));
    if (nums.length < 2) return;

    const diff = nums[1] - nums[0];
    const ratio = nums[1] / nums[0];
    let isArithmetic = true;
    let isGeometric = ratio !== 0;

    for (let i = 1; i < nums.length - 1; i++) {
        if (nums[i+1] - nums[i] !== diff) isArithmetic = false;
        if (nums[i+1] / nums[i] !== ratio) isGeometric = false;
    }

    let nextTerms: number[] = [...nums];
    let type = "Unknown";
    
    if (isArithmetic) {
      type = `Arithmetic (d=${diff})`;
      let last = nums[nums.length-1];
      for (let i=0; i<data.terms; i++) { last += diff; nextTerms.push(last); }
    } else if (isGeometric) {
      type = `Geometric (r=${ratio})`
      let last = nums[nums.length-1];
      for (let i=0; i<data.terms; i++) { last *= ratio; nextTerms.push(last); }
    }
    setResults({ type, sequence: nextTerms.join(', ') });
  };

  return (
    <form onSubmit={handleSubmit(calculateSequence)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Inputs</h3>
        <div><Label>Sequence (comma-separated)</Label><Controller name="sequence" control={control} render={({ field }) => <Input {...field} />} /></div>
        <div><Label>Terms to Predict</Label><Controller name="terms" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
        <Button type="submit" className="w-full">Calculate Next Terms</Button>
      </div>
      {/* Results */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Results</h3>
        {results ? (
            <Card><CardContent className="p-4"><p><strong>Type:</strong> {results.type}</p><p className="break-words"><strong>Sequence:</strong> {results.sequence}</p></CardContent></Card>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter a sequence to continue it</p></div>
        )}
      </div>
    </form>
  );
}
