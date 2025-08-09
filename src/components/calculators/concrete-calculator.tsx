
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
  length: z.number().min(0.1, 'Length must be positive'),
  width: z.number().min(0.1, 'Width must be positive'),
  thickness: z.number().min(0.1, 'Thickness must be positive'),
});

type FormData = z.infer<typeof formSchema>;

export default function ConcreteCalculator() {
  const [results, setResults] = useState<any>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      length: 10,
      width: 10,
      thickness: 4,
    },
  });

  const calculateConcrete = (data: FormData) => {
    const { length, width, thickness } = data;
    const volumeFeet = length * width * (thickness / 12);
    const volumeYards = volumeFeet / 27;

    setResults({
      volumeYards,
      volumeFeet,
      error: null,
    });
  };

  return (
    <form onSubmit={handleSubmit(calculateConcrete)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs Column */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Slab Dimensions</h3>
        
        <div>
          <Label htmlFor="length">Length (feet)</Label>
          <Controller name="length" control={control} render={({ field }) => <Input id="length" type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
          {errors.length && <p className="text-destructive text-sm mt-1">{errors.length.message}</p>}
        </div>

        <div>
          <Label htmlFor="width">Width (feet)</Label>
          <Controller name="width" control={control} render={({ field }) => <Input id="width" type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
          {errors.width && <p className="text-destructive text-sm mt-1">{errors.width.message}</p>}
        </div>

        <div>
          <Label htmlFor="thickness">Thickness (inches)</Label>
          <Controller name="thickness" control={control} render={({ field }) => <Input id="thickness" type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
          {errors.thickness && <p className="text-destructive text-sm mt-1">{errors.thickness.message}</p>}
        </div>
        
        <Button type="submit" className="w-full">Calculate</Button>
      </div>

      {/* Results Column */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Results</h3>
        {results ? (
            results.error ? (
                <Card className="flex items-center justify-center h-60 bg-muted/50 border-dashed">
                    <p className="text-destructive">{results.error}</p>
                </Card>
            ) : (
                <div className="space-y-4">
                    <Card>
                        <CardContent className="p-4 text-center">
                            <p className="text-sm text-muted-foreground">Concrete Needed</p>
                            <p className="text-3xl font-bold">{results.volumeYards.toFixed(2)} yd³</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                             <p className="text-muted-foreground">Equivalent in Cubic Feet</p>
                             <p className="font-semibold">{results.volumeFeet.toFixed(2)} ft³</p>
                        </CardContent>
                    </Card>
                </div>
            )
        ) : (
             <div className="flex items-center justify-center h-60 bg-muted/50 rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">Enter dimensions to estimate concrete needed</p>
            </div>
        )}
      </div>
    </form>
  );
}
