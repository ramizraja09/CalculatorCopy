
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info } from 'lucide-react';
import { parse, compile } from 'mathjs';

const formSchema = z.object({
  expression: z.string().nonempty("Please enter a function."),
  xMin: z.number(),
  xMax: z.number(),
}).refine(data => data.xMax > data.xMin, {
    message: "X Max must be greater than X Min.",
    path: ["xMax"],
});

type FormData = z.infer<typeof formSchema>;

export default function GraphingCalculator() {
  const [plotData, setPlotData] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      expression: '2*x + 1',
      xMin: -10,
      xMax: 10,
    },
  });

  const generatePlotData = (data: FormData) => {
    try {
      const node = parse(data.expression);
      const code = node.compile();
      const points = [];
      const step = (data.xMax - data.xMin) / 100;

      for (let x = data.xMin; x <= data.xMax; x += step) {
        const y = code.evaluate({ x });
        if (typeof y === 'number' && isFinite(y)) {
          points.push({ x: x.toFixed(2), y: y.toFixed(2) });
        }
      }
      
      if (points.length === 0) {
          setError("Could not generate any valid points for this function in the given range.");
          setPlotData(null);
          return;
      }
      
      setPlotData(points);
      setError(null);
    } catch (e) {
      setError("Invalid function. Please use 'x' as the variable (e.g., '2*x^2 + 3*x - 5').");
      setPlotData(null);
    }
  };

  return (
    <form onSubmit={handleSubmit(generatePlotData)} className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Function & Range</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="expression">Function f(x)</Label>
            <Controller name="expression" control={control} render={({ field }) => <Input {...field} placeholder="e.g., x^2 or sin(x)" />} />
             {errors.expression && <p className="text-destructive text-sm mt-1">{errors.expression.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="xMin">X Min</Label>
              <Controller name="xMin" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
            </div>
            <div>
              <Label htmlFor="xMax">X Max</Label>
              <Controller name="xMax" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
            </div>
          </div>
          {errors.xMax && <p className="text-destructive text-sm mt-1">{errors.xMax.message}</p>}
          <Button type="submit" className="w-full">Plot Function</Button>
        </CardContent>
      </Card>
      
      <h3 className="text-xl font-semibold">Graph</h3>
       {error ? (
            <Alert variant="destructive">
                <Info className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        ) : plotData ? (
        <Card>
          <CardContent className="p-2 h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={plotData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="x" type="number" domain={['dataMin', 'dataMax']} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="y" stroke="hsl(var(--primary))" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      ) : (
        <Card className="flex items-center justify-center h-96 bg-muted/50 border-dashed">
          <p className="text-sm text-muted-foreground">Enter a function to plot</p>
        </Card>
      )}
    </form>
  );
}
