
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
  number: z.number().min(0, "Number must be non-negative"),
  base: z.number().min(0, "Base must be non-negative").refine(val => val !== 1, "Base cannot be 1"),
});

type FormData = z.infer<typeof formSchema>;

export default function LogarithmCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { number: 100, base: 10 },
  });

  const calculateLog = (data: FormData) => {
    const result = Math.log(data.number) / Math.log(data.base);
    setResults({ result: isFinite(result) ? result.toFixed(5) : 'Invalid' });
    setFormData(data);
  };

  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `log-result.${format}`;
    const expression = `log base ${formData.base} of ${formData.number}`;

    if (format === 'txt') {
      content = `Logarithm Calculation\n\nExpression: ${expression}\n\nResult: ${results.result}`;
    } else {
      content = `Expression,Result\n"${expression}",${results.result}`;
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
    <form onSubmit={handleSubmit(calculateLog)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Inputs</h3>
        <div><Label>Logarithm of (Number)</Label><Controller name="number" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
        {errors.number && <p className="text-destructive text-sm mt-1">{errors.number.message}</p>}</div>
        <div><Label>Base</Label><Controller name="base" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
        {errors.base && <p className="text-destructive text-sm mt-1">{errors.base.message}</p>}</div>
        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Calculate Log</Button>
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
        <h3 className="text-xl font-semibold">Result</h3>
        {results ? (
            <Card><CardContent className="p-6 text-center"><p className="text-sm text-muted-foreground">Result</p><p className="text-4xl font-bold my-2">{results.result}</p></CardContent></Card>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter number and base to calculate</p></div>
        )}
      </div>
    </form>
  );
}
