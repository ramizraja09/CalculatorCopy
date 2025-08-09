
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
  solveFor: z.enum(['voltage', 'current', 'resistance']),
  voltage: z.number().optional(),
  current: z.number().optional(),
  resistance: z.number().optional(),
});
type FormData = z.infer<typeof formSchema>;

export default function OhmsLawCalculator() {
  const [result, setResult] = useState<string | null>(null);

  const { control, handleSubmit, watch } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { solveFor: 'voltage', current: 2, resistance: 6 },
  });
  const solveFor = watch('solveFor');

  const calculate = (data: FormData) => {
    let res = 0;
    let unit = '';
    if (data.solveFor === 'voltage') {
      res = data.current! * data.resistance!;
      unit = 'V';
    } else if (data.solveFor === 'current') {
      res = data.voltage! / data.resistance!;
      unit = 'A';
    } else { // resistance
      res = data.voltage! / data.current!;
      unit = 'Ω';
    }
    setResult(`${res.toFixed(2)} ${unit}`);
  };

  return (
    <form onSubmit={handleSubmit(calculate)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Inputs</h3>
        <Controller name="solveFor" control={control} render={({ field }) => (
            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-3 gap-4">
                <Label className="p-4 border rounded-md text-center peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><RadioGroupItem value="voltage" className="mr-2"/>Voltage (V)</Label>
                <Label className="p-4 border rounded-md text-center peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><RadioGroupItem value="current" className="mr-2"/>Current (I)</Label>
                <Label className="p-4 border rounded-md text-center peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><RadioGroupItem value="resistance" className="mr-2"/>Resistance (R)</Label>
            </RadioGroup>
        )}/>
        <div><Label>Voltage (V)</Label><Controller name="voltage" control={control} render={({ field }) => <Input type="number" disabled={solveFor === 'voltage'} {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
        <div><Label>Current (A)</Label><Controller name="current" control={control} render={({ field }) => <Input type="number" disabled={solveFor === 'current'} {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
        <div><Label>Resistance (Ω)</Label><Controller name="resistance" control={control} render={({ field }) => <Input type="number" disabled={solveFor === 'resistance'} {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
        <Button type="submit" className="w-full">Calculate</Button>
      </div>

      {/* Results */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Result</h3>
        {result && <Card><CardContent className="p-6 text-center"><p className="text-4xl font-bold">{result}</p></CardContent></Card>}
      </div>
    </form>
  );
}
