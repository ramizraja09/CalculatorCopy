
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Equal } from 'lucide-react';

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
      <Button type="submit" className="w-full">Solve</Button>
      
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
