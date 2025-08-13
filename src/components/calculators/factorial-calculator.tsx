
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
  number: z.number().int().min(0, "Number must be non-negative").max(170, "Number is too large"),
});

type FormData = z.infer<typeof formSchema>;

const factorial = (num: number): number => {
  if (num < 0) return NaN;
  if (num === 0) return 1;
  let result = 1;
  for(let i = 2; i <= num; i++) {
    result *= i;
  }
  return result;
};


export default function FactorialCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { number: 5 },
  });

  const calculateFactorial = (data: FormData) => {
    const result = factorial(data.number);
    setResults({ result: result.toExponential(5) });
    setFormData(data);
  };

  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `factorial-result.${format}`;
    const expression = `${formData.number}!`;

    if (format === 'txt') {
      content = `Factorial Calculation\n\nExpression: ${expression}\nResult: ${results.result}`;
    } else {
      content = `Expression,Result\n"${expression}","${results.result}"`;
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
    <form onSubmit={handleSubmit(calculateFactorial)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Input</h3>
        <div>
          <Label htmlFor="number">Number</Label>
          <Controller name="number" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))} />} />
          {errors.number && <p className="text-destructive text-sm mt-1">{errors.number.message}</p>}
        </div>
        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Calculate Factorial</Button>
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
            <Card>
                <CardContent className="p-6 text-center">
                    <p className="text-sm text-muted-foreground">Factorial</p>
                    <p className="text-4xl font-bold my-2 break-all">{results.result}</p>
                </CardContent>
            </Card>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter a number to calculate its factorial</p></div>
        )}
      </div>
    </form>
  );
}
