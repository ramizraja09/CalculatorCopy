
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
  ft1: z.number().int().min(0),
  in1: z.number().min(0),
  op: z.enum(['add', 'subtract']),
  ft2: z.number().int().min(0),
  in2: z.number().min(0),
});
type FormData = z.infer<typeof formSchema>;

export default function FeetAndInchesCalculator() {
  const [result, setResult] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { ft1: 5, in1: 8, op: 'add', ft2: 3, in2: 6 },
  });

  const calculate = (data: FormData) => {
    const totalInches1 = data.ft1 * 12 + data.in1;
    const totalInches2 = data.ft2 * 12 + data.in2;
    const totalInches = data.op === 'add' ? totalInches1 + totalInches2 : totalInches1 - totalInches2;

    const feet = Math.floor(Math.abs(totalInches) / 12);
    const inches = Math.abs(totalInches) % 12;
    
    setResult(`${totalInches < 0 ? '-' : ''}${feet}' ${inches.toFixed(2)}"`);
    setFormData(data);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!result || !formData) return;
    
    let content = '';
    const filename = `feet-inches-calculation.${format}`;
    const { ft1, in1, op, ft2, in2 } = formData;
    const expression = `${ft1}'${in1}" ${op === 'add' ? '+' : '-'} ${ft2}'${in2}"`;

    if (format === 'txt') {
      content = `Feet and Inches Calculation\n\nExpression: ${expression}\n\nResult: ${result}`;
    } else {
       content = `Expression,Result\n"${expression}","${result}"`;
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
    <form onSubmit={handleSubmit(calculate)} className="grid md:grid-cols-1 gap-4">
      <div className="flex flex-col items-center gap-4">
        {/* Measurement 1 */}
        <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
            <div><Label className="text-xs">Feet</Label><Controller name="ft1" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />} /></div>
            <div><Label className="text-xs">Inches</Label><Controller name="in1" control={control} render={({ field }) => <Input type="number" step="any" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
        </div>
        {/* Operator */}
        <Controller name="op" control={control} render={({ field }) => (
            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4">
                <Label className="p-4 border rounded-md text-center text-2xl peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><RadioGroupItem value="add" className="sr-only"/>+</Label>
                <Label className="p-4 border rounded-md text-center text-2xl peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><RadioGroupItem value="subtract" className="sr-only"/>-</Label>
            </RadioGroup>
        )}/>
        {/* Measurement 2 */}
        <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
            <div><Label className="text-xs">Feet</Label><Controller name="ft2" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />} /></div>
            <div><Label className="text-xs">Inches</Label><Controller name="in2" control={control} render={({ field }) => <Input type="number" step="any" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
        </div>
      </div>
       <div className="flex justify-center gap-2">
        <Button type="submit" className="w-full max-w-[150px]">Calculate</Button>
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
