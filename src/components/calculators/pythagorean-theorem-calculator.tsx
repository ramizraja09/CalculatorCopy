
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
  solveFor: z.enum(['a', 'b', 'c']),
  a: z.number().optional(),
  b: z.number().optional(),
  c: z.number().optional(),
}).refine(data => {
    if (data.solveFor === 'c') return data.a! > 0 && data.b! > 0;
    if (data.solveFor === 'a') return data.b! > 0 && data.c! > 0 && data.c! > data.b!;
    if (data.solveFor === 'b') return data.a! > 0 && data.c! > 0 && data.c! > data.a!;
    return false;
}, { message: "Invalid inputs for calculation.", path: ['a']});

type FormData = z.infer<typeof formSchema>;

export default function PythagoreanTheoremCalculator() {
  const [result, setResult] = useState<string | null>(null);
  const { control, handleSubmit, watch } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { solveFor: 'c', a: 3, b: 4 },
  });

  const solveFor = watch('solveFor');

  const calculate = (data: FormData) => {
    let res;
    if(data.solveFor === 'c') res = Math.sqrt(data.a!**2 + data.b!**2);
    if(data.solveFor === 'a') res = Math.sqrt(data.c!**2 - data.b!**2);
    if(data.solveFor === 'b') res = Math.sqrt(data.c!**2 - data.a!**2);
    setResult(res!.toFixed(4));
  };

  return (
    <form onSubmit={handleSubmit(calculate)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Inputs</h3>
        <Controller name="solveFor" control={control} render={({ field }) => (
            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-3 gap-4">
                <Label className="p-4 border rounded-md text-center peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><RadioGroupItem value="a" className="mr-2"/>Solve for a</Label>
                <Label className="p-4 border rounded-md text-center peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><RadioGroupItem value="b" className="mr-2"/>Solve for b</Label>
                <Label className="p-4 border rounded-md text-center peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><RadioGroupItem value="c" className="mr-2"/>Solve for c</Label>
            </RadioGroup>
        )}/>
        <div><Label>a</Label><Controller name="a" control={control} render={({ field }) => <Input type="number" disabled={solveFor === 'a'} {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
        <div><Label>b</Label><Controller name="b" control={control} render={({ field }) => <Input type="number" disabled={solveFor === 'b'} {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
        <div><Label>c (hypotenuse)</Label><Controller name="c" control={control} render={({ field }) => <Input type="number" disabled={solveFor === 'c'} {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
        <Button type="submit" className="w-full">Calculate</Button>
      </div>
      {/* Results */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Result</h3>
        {result && <Card><CardContent className="p-6 text-center"><p className="text-4xl font-bold">{solveFor} = {result}</p></CardContent></Card>}
      </div>
    </form>
  );
}
