
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
import { Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const formSchema = z.object({
  solveFor: z.enum(['voltage', 'current', 'resistance']),
  voltage: z.number().optional(),
  current: z.number().optional(),
  resistance: z.number().optional(),
});
type FormData = z.infer<typeof formSchema>;

export default function OhmsLawCalculator() {
  const [result, setResult] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

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
      res = data.voltage! / data.resistance!;
      unit = 'Ω';
    }
    setResult(`${res.toFixed(2)} ${unit}`);
    setFormData(data);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!result || !formData) return;

    let content = '';
    const filename = `ohms-law-calculation.${format}`;
    const { solveFor, voltage, current, resistance } = formData;
    const value = result.split(" ")[0];

    if (format === 'txt') {
      content = `Ohm's Law Calculation\n\nInputs:\n- Solving for: ${solveFor}\n- Voltage: ${voltage || '?'}\n- Current: ${current || '?'}\n- Resistance: ${resistance || '?'}\n\nResult:\n${result}`;
    } else {
      content = `Solving For,Voltage (V),Current (A),Resistance (Ω),Result\n${solveFor},${voltage || ''},${current || ''},${resistance || ''},${value}`;
    }

    const blob = new Blob([content], { type: `text/${format}` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
        <div><Label>Voltage (V)</Label><Controller name="voltage" control={control} render={({ field }) => <Input type="number" disabled={solveFor === 'voltage'} {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
        <div><Label>Current (A)</Label><Controller name="current" control={control} render={({ field }) => <Input type="number" disabled={solveFor === 'current'} {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
        <div><Label>Resistance (Ω)</Label><Controller name="resistance" control={control} render={({ field }) => <Input type="number" disabled={solveFor === 'resistance'} {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Calculate</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={!result}>
                  <Download className="mr-2 h-4 w-4" /> Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleExport('txt')}>Download as .txt</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('csv')}>Download as .csv</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Result</h3>
        {result ? (
            <Card><CardContent className="p-6 text-center"><p className="text-4xl font-bold">{result}</p></CardContent></Card>
        ) : (
             <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter two values to calculate the third</p></div>
        )}
      </div>
    </form>
  );
}
