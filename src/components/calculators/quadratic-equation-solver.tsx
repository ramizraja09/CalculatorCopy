
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download } from 'lucide-react';

const formSchema = z.object({
  a: z.number().refine(val => val !== 0, { message: "a cannot be zero" }),
  b: z.number(),
  c: z.number(),
});

type FormData = z.infer<typeof formSchema>;

export default function QuadraticEquationSolver() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { a: 1, b: -3, c: 2 },
  });

  const solve = (data: FormData) => {
    const { a, b, c } = data;
    const discriminant = b * b - 4 * a * c;
    if (discriminant > 0) {
      const x1 = (-b + Math.sqrt(discriminant)) / (2 * a);
      const x2 = (-b - Math.sqrt(discriminant)) / (2 * a);
      setResults({ roots: `x = ${x1.toFixed(3)} and x = ${x2.toFixed(3)}` });
    } else if (discriminant === 0) {
      const x = -b / (2 * a);
      setResults({ roots: `x = ${x.toFixed(3)}` });
    } else {
      const realPart = (-b / (2 * a)).toFixed(3);
      const imaginaryPart = (Math.sqrt(-discriminant) / (2 * a)).toFixed(3);
      setResults({ roots: `x = ${realPart} ± ${imaginaryPart}i` });
    }
    setFormData(data);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `quadratic-result.${format}`;
    const equation = `${formData.a}x² + ${formData.b}x + ${formData.c} = 0`;

    if (format === 'txt') {
      content = `Quadratic Equation Calculation\n\nEquation: ${equation}\n\nResult:\n${results.roots}`;
    } else {
      content = `Equation,Result\n"${equation}","${results.roots}"`;
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
    <form onSubmit={handleSubmit(solve)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Equation: ax² + bx + c = 0</h3>
        <div><Label>a</Label><Controller name="a" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
        <div><Label>b</Label><Controller name="b" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
        <div><Label>c</Label><Controller name="c" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Solve for x</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={!results}>
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
        <h3 className="text-xl font-semibold">Roots</h3>
        {results ? (
            <Card><CardContent className="p-6 text-center"><p className="text-2xl font-bold">{results.roots}</p></CardContent></Card>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter coefficients to find roots</p></div>
        )}
      </div>
    </form>
  );
}
