
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
  h1: z.number().int().min(0),
  m1: z.number().int().min(0).max(59),
  s1: z.number().int().min(0).max(59),
  op: z.enum(['add', 'subtract']),
  h2: z.number().int().min(0),
  m2: z.number().int().min(0).max(59),
  s2: z.number().int().min(0).max(59),
});
type FormData = z.infer<typeof formSchema>;

export default function TimeCalculator() {
  const [result, setResult] = useState<string | null>(null);
  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { h1: 1, m1: 30, s1: 0, op: 'add', h2: 0, m2: 45, s2: 30 },
  });

  const calculateTime = (data: FormData) => {
    const totalS1 = data.h1 * 3600 + data.m1 * 60 + data.s1;
    const totalS2 = data.h2 * 3600 + data.m2 * 60 + data.s2;
    const totalSeconds = data.op === 'add' ? totalS1 + totalS2 : totalS1 - totalS2;
    const h = Math.floor(Math.abs(totalSeconds) / 3600);
    const m = Math.floor((Math.abs(totalSeconds) % 3600) / 60);
    const s = Math.abs(totalSeconds) % 60;
    setResult(`${totalSeconds < 0 ? '-' : ''}${h}h ${m}m ${s}s`);
  };

  return (
    <form onSubmit={handleSubmit(calculateTime)} className="grid md:grid-cols-1 gap-8">
      <div className="flex flex-col items-center gap-4">
        {/* Time 1 */}
        <div className="grid grid-cols-3 gap-2 w-full max-w-sm">
            <div><Label className="text-xs">Hours</Label><Controller name="h1" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
            <div><Label className="text-xs">Minutes</Label><Controller name="m1" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
            <div><Label className="text-xs">Seconds</Label><Controller name="s1" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
        </div>
        {/* Operator */}
        <Controller name="op" control={control} render={({ field }) => (
            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4">
                <Label className="p-4 border rounded-md text-center text-2xl peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><RadioGroupItem value="add" className="sr-only"/>+</Label>
                <Label className="p-4 border rounded-md text-center text-2xl peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><RadioGroupItem value="subtract" className="sr-only"/>-</Label>
            </RadioGroup>
        )}/>
        {/* Time 2 */}
        <div className="grid grid-cols-3 gap-2 w-full max-w-sm">
            <div><Label className="text-xs">Hours</Label><Controller name="h2" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
            <div><Label className="text-xs">Minutes</Label><Controller name="m2" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
            <div><Label className="text-xs">Seconds</Label><Controller name="s2" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
        </div>
      </div>
      <Button type="submit" className="w-full">Calculate</Button>
      {result && <Card><CardContent className="p-6 text-center"><p className="text-4xl font-bold">{result}</p></CardContent></Card>}
    </form>
  );
}
