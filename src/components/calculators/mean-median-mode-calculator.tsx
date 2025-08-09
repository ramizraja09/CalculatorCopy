
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const formSchema = z.object({
  numbers: z.string().nonempty("Please enter at least one number."),
});

type FormData = z.infer<typeof formSchema>;

export default function MeanMedianModeCalculator() {
  const [results, setResults] = useState<any>(null);
  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { numbers: "1, 2, 2, 3, 4, 7, 9" },
  });

  const calculate = (data: FormData) => {
    const nums = data.numbers.split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
    if (nums.length === 0) return;

    // Mean
    const mean = nums.reduce((a, b) => a + b) / nums.length;

    // Median
    nums.sort((a, b) => a - b);
    const mid = Math.floor(nums.length / 2);
    const median = nums.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;

    // Mode
    const counts: { [key: number]: number } = {};
    nums.forEach(num => counts[num] = (counts[num] || 0) + 1);
    let maxCount = 0;
    let modes: number[] = [];
    for (const num in counts) {
      if (counts[num] > maxCount) {
        modes = [Number(num)];
        maxCount = counts[num];
      } else if (counts[num] === maxCount) {
        modes.push(Number(num));
      }
    }
    if (modes.length === Object.keys(counts).length) modes = []; // No mode if all have same frequency
    
    setResults({ mean: mean.toFixed(2), median: median, mode: modes.join(', ') || 'N/A' });
  };

  return (
    <form onSubmit={handleSubmit(calculate)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Inputs</h3>
        <div>
          <Label>Numbers (comma or space separated)</Label>
          <Controller name="numbers" control={control} render={({ field }) => <Textarea {...field} rows={5} />} />
        </div>
        <Button type="submit" className="w-full">Calculate</Button>
      </div>

      {/* Results */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Results</h3>
        {results ? (
            <Card>
                <CardContent className="p-4 grid grid-cols-3 gap-2 text-center">
                    <div><p className="font-semibold">Mean</p><p>{results.mean}</p></div>
                    <div><p className="font-semibold">Median</p><p>{results.median}</p></div>
                    <div><p className="font-semibold">Mode</p><p>{results.mode}</p></div>
                </CardContent>
            </Card>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter numbers to calculate</p></div>
        )}
      </div>
    </form>
  );
}
