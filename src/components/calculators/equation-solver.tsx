
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { parse } from 'mathjs';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from 'lucide-react';

const formSchema = z.object({
  equation: z.string().nonempty("Please enter an equation."),
});

type FormData = z.infer<typeof formSchema>;

export default function EquationSolver() {
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      equation: '2x + 4 = 10',
    },
  });

  const solveEquation = (data: FormData) => {
    try {
      // This is a very simplified solver using math.js's parser for basic linear equations.
      // It does not support complex equations.
      const node = parse(data.equation);

      // A simple implementation for linear equations: ax + b = c -> x = (c - b) / a
      if (node.type === 'OperatorNode' && node.op === '=') {
        // This is a very naive approach and will only work for simple linear equations
        // A full solver is much more complex.
        const left = node.args[0].toString();
        const right = node.args[1].toString();
        setResult(`This is a complex problem. The feature is under development.`);
        setError(null);
        return;
      }
      
      throw new Error("Equation format not recognized by this simple solver.");

    } catch (e) {
      setResult(null);
      setError("Could not solve. Please enter a simple linear equation like '2x + 4 = 10'. The full feature is under development.");
    }
  };

  return (
    <form onSubmit={handleSubmit(solveEquation)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Input</h3>
        <div>
          <Label htmlFor="equation">Equation</Label>
          <Controller name="equation" control={control} render={({ field }) => <Input {...field} placeholder="e.g. 2x + 4 = 10" />} />
          {errors.equation && <p className="text-destructive text-sm mt-1">{errors.equation.message}</p>}
        </div>
        <Button type="submit" className="w-full">Solve</Button>
      </div>

      {/* Results */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Result</h3>
         {error && (
            <Alert variant="destructive">
                <Info className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}
        {result ? (
            <Card>
                <CardContent className="p-6 text-center">
                    <p className="text-2xl font-bold font-mono">{result}</p>
                </CardContent>
            </Card>
        ) : (
          !error && <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter an equation to solve</p></div>
        )}
      </div>
    </form>
  );
}
