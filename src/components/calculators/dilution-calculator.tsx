
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
  c1: z.number().min(0.1, "Concentration must be positive"),
  v1: z.number().min(0.1, "Volume must be positive"),
  c2: z.number().min(0.1, "Concentration must be positive"),
});

type FormData = z.infer<typeof formSchema>;

export default function DilutionCalculator() {
  const [result, setResult] = useState<any>(null);

  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { c1: 10, v1: 100, c2: 2 },
  });

  const calculateDilution = (data: FormData) => {
    // Formula: C1 * V1 = C2 * V2
    const v2 = (data.c1 * data.v1) / data.c2;
    const solventVolume = v2 - data.v1;
    setResult({ finalVolume: v2, solventVolume });
  };

  return (
    <form onSubmit={handleSubmit(calculateDilution)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Stock Solution</h3>
        <div><Label>Concentration (C1)</Label><Controller name="c1" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
        <div><Label>Volume (V1)</Label><Controller name="v1" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
        <h3 className="text-xl font-semibold">Final Solution</h3>
        <div><Label>Concentration (C2)</Label><Controller name="c2" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
        <Button type="submit" className="w-full">Calculate</Button>
      </div>

      {/* Results */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Results</h3>
        {result ? (
            <Card>
                <CardContent className="p-4 text-center">
                    <p>Add <strong>{result.solventVolume.toFixed(2)}</strong> units of solvent to your initial volume of {control._getWatch('v1')} units to get a final volume of <strong>{result.finalVolume.toFixed(2)}</strong> units.</p>
                </CardContent>
            </Card>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter solution details</p></div>
        )}
      </div>
    </form>
  );
}
