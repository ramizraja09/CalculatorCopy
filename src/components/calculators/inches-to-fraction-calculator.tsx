
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
  decimal: z.number().min(0),
});

type FormData = z.infer<typeof formSchema>;

// Greatest Common Divisor function
const gcd = (a: number, b: number): number => b ? gcd(b, a % b) : a;

export default function InchesToFractionCalculator() {
  const [result, setResult] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { decimal: 5.75 },
  });

  const convert = (data: FormData) => {
    const whole = Math.floor(data.decimal);
    const fractional = data.decimal - whole;

    if (fractional === 0) {
        setResult(`${whole}"`);
        setFormData(data);
        return;
    }

    // Convert decimal to fraction
    const precision = 10000;
    let numerator = Math.round(fractional * precision);
    let denominator = precision;
    const commonDivisor = gcd(numerator, denominator);
    numerator /= commonDivisor;
    denominator /= commonDivisor;

    if (whole > 0) {
        setResult(`${whole} ${numerator}/${denominator}"`);
    } else {
        setResult(`${numerator}/${denominator}"`);
    }
    setFormData(data);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (result === null || !formData) return;
    
    let content = '';
    const filename = `inches-to-fraction-calculation.${format}`;
    const { decimal } = formData;

    if (format === 'txt') {
      content = `Inches to Fraction Calculation\n\nInputs:\n- Decimal: ${decimal}\n\nResult:\n- Fraction: ${result}`;
    } else {
       content = `Decimal,Fraction\n${decimal},"${result}"`;
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
    <form onSubmit={handleSubmit(convert)} className="grid md:grid-cols-2 gap-8">
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Enter Decimal Inches</h3>
        <div><Label>Inches</Label><Controller name="decimal" control={control} render={({ field }) => <Input type="number" step="any" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Convert to Fraction</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={result === null}>
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

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Result as Fraction</h3>
        {result !== null ? (
            <Card>
                <CardContent className="p-6 text-center">
                    <p className="text-4xl font-bold">{result}</p>
                </CardContent>
            </Card>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter a decimal to convert</p></div>
        )}
      </div>
    </form>
  );
}
