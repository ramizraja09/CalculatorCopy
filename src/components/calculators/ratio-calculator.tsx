
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Equal, Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const formSchema = z.object({
  a: z.string().optional(),
  b: z.string().optional(),
  c: z.string().optional(),
  d: z.string().optional(),
}).refine(data => {
    const values = [data.a, data.b, data.c, data.d];
    const emptyCount = values.filter(v => v === undefined || v === '').length;
    return emptyCount === 1;
}, {
    message: "Please enter exactly three values to solve for the fourth.",
    path: ['a'], 
});

type FormData = z.infer<typeof formSchema>;

export default function RatioCalculator() {
  const [result, setResult] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { a: "2", b: "3", c: "10", d: "" },
  });

  const solveRatio = (data: FormData) => {
    const a = data.a !== '' ? parseFloat(data.a as string) : undefined;
    const b = data.b !== '' ? parseFloat(data.b as string) : undefined;
    const c = data.c !== '' ? parseFloat(data.c as string) : undefined;
    const d = data.d !== '' ? parseFloat(data.d as string) : undefined;

    let solvedValue;
    let missingVar;

    if (a === undefined) {
        solvedValue = (b! * c!) / d!;
        missingVar = `A = ${solvedValue.toFixed(4)}`;
    } else if (b === undefined) {
        solvedValue = (a! * d!) / c!;
        missingVar = `B = ${solvedValue.toFixed(4)}`;
    } else if (c === undefined) {
        solvedValue = (a! * d!) / b!;
        missingVar = `C = ${solvedValue.toFixed(4)}`;
    } else {
        solvedValue = (b! * c!) / a!;
        missingVar = `D = ${solvedValue.toFixed(4)}`;
    }
    setResult(missingVar);
    setFormData(data);
  };

  const handleExport = (format: 'txt' | 'csv') => {
    if (!result || !formData) return;
    
    let content = '';
    const filename = `ratio-result.${format}`;
    const {a,b,c,d} = formData;
    const solvedVar = result.split(" = ")[0];
    const solvedVal = result.split(" = ")[1];

    if (format === 'txt') {
      content = `Ratio Calculation\n\nInputs:\nA: ${a}\nB: ${b}\nC: ${c}\nD: ${d}\n\nResult:\n${result}`;
    } else {
      content = `A,B,C,D,Solved Variable,Solved Value\n${a || ''},${b || ''},${c || ''},${d || ''},${solvedVar},${solvedVal}`;
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
    <form onSubmit={handleSubmit(solveRatio)} className="space-y-4">
      <div className="flex flex-col md:flex-row items-center justify-center gap-4">
        {/* Ratio A:B */}
        <div className="flex items-center gap-2">
            <Controller name="a" control={control} render={({ field }) => <Input placeholder="A" className="w-24 text-center" type="number" step="any" {...field} />} />
            <Label className="text-xl">:</Label>
            <Controller name="b" control={control} render={({ field }) => <Input placeholder="B" className="w-24 text-center" type="number" step="any" {...field} />} />
        </div>
        
        <Equal />

        {/* Ratio C:D */}
         <div className="flex items-center gap-2">
            <Controller name="c" control={control} render={({ field }) => <Input placeholder="C" className="w-24 text-center" type="number" step="any" {...field} />} />
            <Label className="text-xl">:</Label>
            <Controller name="d" control={control} render={({ field }) => <Input placeholder="D" className="w-24 text-center" type="number" step="any" {...field} />} />
        </div>
      </div>
       {errors.a && <p className="text-destructive text-sm mt-1 text-center">{errors.a.message}</p>}
      <div className="flex justify-center gap-2">
        <Button type="submit" className="w-full max-w-xs">Solve</Button>
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
      
      {result && (
        <Card className="mt-4">
          <CardContent className="p-4 text-center">
            <p className="text-muted-foreground">Result</p>
            <p className="text-3xl font-bold">{result}</p>
          </CardContent>
        </Card>
      )}
    </form>
  );
}
