
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download } from 'lucide-react';

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
  const [formData, setFormData] = useState<FormData | null>(null);

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
    setFormData(data);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!result || !formData) return;
    
    let content = '';
    const filename = `time-calculation-result.${format}`;
    const { h1, m1, s1, op, h2, m2, s2 } = formData;
    const expression = `${h1}h ${m1}m ${s1}s ${op === 'add' ? '+' : '-'} ${h2}h ${m2}m ${s2}s`;

    if (format === 'txt') {
      content = `Time Calculation\n\nExpression: ${expression}\nResult: ${result}`;
    } else {
      content = `Expression,Result\n"${expression}","${result}"`;
    }

    const blob = new Blob([content], { type: `text/${format}` });
    const url = URL.createObjectURL(blob);
    const aEl = document.createElement('a');
    aEl.href = url;
    aEl.download = filename;
    document.body.appendChild(aEl);
    aEl.click();
    document.body.removeChild(aEl);
    URL.revokeObjectURL(url);
  };

  return (
    <form onSubmit={handleSubmit(calculateTime)} className="grid md:grid-cols-1 gap-8">
      <div className="flex flex-col items-center gap-4">
        {/* Time 1 */}
        <div className="grid grid-cols-3 gap-2 w-full max-w-sm">
            <div><Label className="text-xs">Hours</Label><Controller name="h1" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))} />} /></div>
            <div><Label className="text-xs">Minutes</Label><Controller name="m1" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))} />} /></div>
            <div><Label className="text-xs">Seconds</Label><Controller name="s1" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))} />} /></div>
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
            <div><Label className="text-xs">Hours</Label><Controller name="h2" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))} />} /></div>
            <div><Label className="text-xs">Minutes</Label><Controller name="m2" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))} />} /></div>
            <div><Label className="text-xs">Seconds</Label><Controller name="s2" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))} />} /></div>
        </div>
      </div>
      <div className="flex justify-center gap-2">
        <Button type="submit" className="w-full max-w-xs">Calculate</Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" disabled={!result} className="w-full max-w-[150px]">
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleExport('txt')}>Download as .txt</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('csv')}>Download as .csv</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {result && <Card><CardContent className="p-6 text-center"><p className="text-4xl font-bold">{result}</p></CardContent></Card>}
    </form>
  );
}
