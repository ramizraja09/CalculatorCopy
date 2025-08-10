
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { derivative } from 'mathjs';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info } from 'lucide-react';


const formSchema = z.object({
  expression: z.string().nonempty("Please enter a function."),
  variable: z.string().nonempty("Please enter a variable.").length(1, "Variable must be a single character."),
});

type FormData = z.infer<typeof formSchema>;

export default function DerivativeCalculator() {
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      expression: 'x^2 + 2*x',
      variable: 'x',
    },
  });

  const calculateDerivative = (data: FormData) => {
    try {
      const { expression, variable } = data;
      const derived = derivative(expression, variable);
      setResult(derived.toString());
      setError(null);
    } catch (e) {
      setError("Could not calculate derivative. Please ensure your function and variable are valid (e.g., '2*x^3', 'x').");
      setResult(null);
    }
  };

  return (
    <form onSubmit={handleSubmit(calculateDerivative)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Input</h3>
        <div>
          <Label htmlFor="expression">Function</Label>
          <Controller name="expression" control={control} render={({ field }) => <Input {...field} placeholder="e.g. 2*x^3 + sin(x)" />} />
          {errors.expression && <p className="text-destructive text-sm mt-1">{errors.expression.message}</p>}
        </div>
        <div>
          <Label htmlFor="variable">With respect to...</Label>
          <Controller name="variable" control={control} render={({ field }) => <Input {...field} className="w-20" placeholder="x" />} />
           {errors.variable && <p className="text-destructive text-sm mt-1">{errors.variable.message}</p>}
        </div>
        <Button type="submit" className="w-full">Calculate Derivative</Button>
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
                    <p className="text-sm text-muted-foreground">d/dx</p>
                    <p className="text-2xl font-bold font-mono">{result}</p>
                </CardContent>
            </Card>
        ) : (
          !error && <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter a function to differentiate</p></div>
        )}
      </div>
    </form>
  );
}
