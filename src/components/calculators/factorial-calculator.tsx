
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

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
  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { number: 5 },
  });

  const calculateFactorial = (data: FormData) => {
    const result = factorial(data.number);
    setResults({ result: result.toExponential(5) });
  };

  return (
    <form onSubmit={handleSubmit(calculateFactorial)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Input</h3>
        <div>
          <Label htmlFor="number">Number</Label>
          <Controller name="number" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} />
          {errors.number && <p className="text-destructive text-sm mt-1">{errors.number.message}</p>}
        </div>
        <Button type="submit" className="w-full">Calculate Factorial</Button>
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
