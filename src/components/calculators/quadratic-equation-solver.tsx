
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
  a: z.number().refine(val => val !== 0, { message: "a cannot be zero" }),
  b: z.number(),
  c: z.number(),
});

type FormData = z.infer<typeof formSchema>;

export default function QuadraticEquationSolver() {
  const [results, setResults] = useState<any>(null);
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
  };

  return (
    <form onSubmit={handleSubmit(solve)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Equation: ax² + bx + c = 0</h3>
        <div><Label>a</Label><Controller name="a" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
        <div><Label>b</Label><Controller name="b" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
        <div><Label>c</Label><Controller name="c" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
        <Button type="submit" className="w-full">Solve for x</Button>
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
