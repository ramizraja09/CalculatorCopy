
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
  numbers: z.string().nonempty("Please enter at least two numbers separated by commas."),
});

type FormData = z.infer<typeof formSchema>;

const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
const lcm = (a: number, b: number): number => (a * b) / gcd(a, b);
const findLcmOfList = (numbers: number[]) => {
  if (numbers.length < 2) return NaN;
  return numbers.reduce((acc, curr) => lcm(acc, curr));
}

export default function LcmCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { numbers: "12, 15" },
  });

  const calculateLcm = (data: FormData) => {
    const numberList = data.numbers.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
    if (numberList.length < 2) {
      setResults({ error: "Please enter at least two valid numbers." });
      return;
    }
    const result = findLcmOfList(numberList.map(Math.abs));
    setResults({ result });
    setFormData(data);
  };

  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `lcm-result.${format}`;

    if (format === 'txt') {
      content = `LCM Calculation\n\nInput Numbers: ${formData.numbers}\n\nResult:\nLeast Common Multiple (LCM): ${results.result}`;
    } else {
      content = `Input Numbers,LCM\n"${formData.numbers}",${results.result}`;
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
    <form onSubmit={handleSubmit(calculateLcm)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Input</h3>
        <div>
          <Label htmlFor="numbers">Numbers (comma-separated)</Label>
          <Controller name="numbers" control={control} render={({ field }) => <Input {...field} />} />
          {errors.numbers && <p className="text-destructive text-sm mt-1">{errors.numbers.message}</p>}
        </div>
        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Calculate LCM</Button>
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
            results.error ? (
                <Card className="flex items-center justify-center h-40 bg-muted/50 border-dashed"><p className="text-destructive">{results.error}</p></Card>
            ) : (
            <Card><CardContent className="p-6 text-center"><p className="text-sm text-muted-foreground">Least Common Multiple (LCM)</p><p className="text-4xl font-bold my-2">{results.result}</p></CardContent></Card>
            )
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter numbers to find the LCM</p></div>
        )}
      </div>
    </form>
  );
}
