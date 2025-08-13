
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download } from 'lucide-react';


const formSchema = z.object({
  num1: z.number().int(),
  den1: z.number().int().refine(val => val !== 0, { message: "Denominator cannot be zero" }),
  num2: z.number().int(),
  den2: z.number().int().refine(val => val !== 0, { message: "Denominator cannot be zero" }),
  operator: z.enum(['+', '-', '*', '/']),
});

type FormData = z.infer<typeof formSchema>;

const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);

export default function FractionCalculator() {
  const [result, setResult] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { num1: 1, den1: 2, operator: '+', num2: 1, den2: 4 },
  });

  const calculateFractions = (data: FormData) => {
    let resNum, resDen;
    switch (data.operator) {
      case '+':
        resNum = data.num1 * data.den2 + data.num2 * data.den1;
        resDen = data.den1 * data.den2;
        break;
      case '-':
        resNum = data.num1 * data.den2 - data.num2 * data.den1;
        resDen = data.den1 * data.den2;
        break;
      case '*':
        resNum = data.num1 * data.num2;
        resDen = data.den1 * data.den2;
        break;
      case '/':
        resNum = data.num1 * data.den2;
        resDen = data.den1 * data.num2;
        break;
    }
    const commonDivisor = gcd(Math.abs(resNum), Math.abs(resDen));
    setResult(`${resNum / commonDivisor} / ${resDen / commonDivisor}`);
    setFormData(data);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!result || !formData) return;
    const { num1, den1, operator, num2, den2 } = formData;
    
    let content = '';
    const filename = `fraction-result.${format}`;
    const expression = `${num1}/${den1} ${operator} ${num2}/${den2}`;

    if (format === 'txt') {
      content = `Fraction Calculation\n\nExpression: ${expression}\nResult: ${result}`;
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
    <div data-results-container>
      <form onSubmit={handleSubmit(calculateFractions)} className="space-y-4">
        <div className="flex items-center justify-center gap-4">
          {/* Fraction 1 */}
          <div className="flex flex-col items-center gap-1">
            <Controller name="num1" control={control} render={({ field }) => <Input className="w-20 text-center" type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))} />} />
            <div className="h-px w-20 bg-foreground"></div>
            <Controller name="den1" control={control} render={({ field }) => <Input className="w-20 text-center" type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))} />} />
          </div>
          {/* Operator */}
          <Controller name="operator" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="+">+</SelectItem><SelectItem value="-">-</SelectItem><SelectItem value="*">*</SelectItem><SelectItem value="/">/</SelectItem></SelectContent>
              </Select>
          )} />
          {/* Fraction 2 */}
          <div className="flex flex-col items-center gap-1">
            <Controller name="num2" control={control} render={({ field }) => <Input className="w-20 text-center" type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))} />} />
            <div className="h-px w-20 bg-foreground"></div>
            <Controller name="den2" control={control} render={({ field }) => <Input className="w-20 text-center" type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))} />} />
          </div>
        </div>
        <div className="flex justify-center gap-2">
            <Button type="submit" className="flex-1 max-w-xs">Calculate</Button>
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
    </div>
  );
}
