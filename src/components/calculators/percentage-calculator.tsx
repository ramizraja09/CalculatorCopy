
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

// Schema for "What is X% of Y?"
const formSchema1 = z.object({
  percentage: z.number(),
  value: z.number(),
});
type FormData1 = z.infer<typeof formSchema1>;

// Schema for "X is what % of Y?"
const formSchema2 = z.object({
  part: z.number(),
  whole: z.number().refine(val => val !== 0, "Total value cannot be zero"),
});
type FormData2 = z.infer<typeof formSchema2>;

export default function PercentageCalculator() {
  const [result1, setResult1] = useState<number | null>(null);
  const [result2, setResult2] = useState<number | null>(null);

  const { control: control1, handleSubmit: handleSubmit1 } = useForm<FormData1>({
    resolver: zodResolver(formSchema1),
    defaultValues: { percentage: 20, value: 50 },
  });

  const { control: control2, handleSubmit: handleSubmit2 } = useForm<FormData2>({
    resolver: zodResolver(formSchema2),
    defaultValues: { part: 10, whole: 50 },
  });
  
  const calculatePercentageOf = (data: FormData1) => {
    setResult1((data.percentage / 100) * data.value);
  };
  
  const calculateWhatPercent = (data: FormData2) => {
    setResult2((data.part / data.whole) * 100);
  };

  return (
    <div className="grid md:grid-cols-1 gap-8">
      {/* Calculator 1 */}
      <Card>
        <CardHeader><CardTitle>What is X% of Y?</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit1(calculatePercentageOf)} className="flex items-center gap-2">
            <Label>What is</Label>
            <Controller name="percentage" control={control1} render={({ field }) => <Input className="w-24" type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
            <Label>% of</Label>
            <Controller name="value" control={control1} render={({ field }) => <Input className="w-24" type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
            <Label>?</Label>
            <Button type="submit" className="ml-auto">Calculate</Button>
          </form>
          {result1 !== null && <p className="mt-4 font-bold text-lg">Result: {result1}</p>}
        </CardContent>
      </Card>
      
      {/* Calculator 2 */}
       <Card>
        <CardHeader><CardTitle>X is what % of Y?</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit2(calculateWhatPercent)} className="flex items-center gap-2">
            <Controller name="part" control={control2} render={({ field }) => <Input className="w-24" type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
            <Label>is what % of</Label>
            <Controller name="whole" control={control2} render={({ field }) => <Input className="w-24" type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
            <Label>?</Label>
            <Button type="submit" className="ml-auto">Calculate</Button>
          </form>
          {result2 !== null && <p className="mt-4 font-bold text-lg">Result: {result2.toFixed(2)}%</p>}
        </CardContent>
      </Card>
    </div>
  );
}
