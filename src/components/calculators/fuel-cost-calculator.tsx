
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
  distance: z.number().min(1, 'Distance must be positive'),
  fuelEfficiency: z.number().min(1, 'Fuel efficiency must be positive'),
  fuelPrice: z.number().min(0.01, 'Fuel price must be positive'),
});

type FormData = z.infer<typeof formSchema>;

export default function FuelCostCalculator() {
  const [results, setResults] = useState<any>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      distance: 100,
      fuelEfficiency: 25,
      fuelPrice: 3.50,
    },
  });

  const calculateFuelCost = (data: FormData) => {
    const { distance, fuelEfficiency, fuelPrice } = data;
    const fuelNeeded = distance / fuelEfficiency;
    const totalCost = fuelNeeded * fuelPrice;

    setResults({
      totalCost,
      fuelNeeded,
      error: null,
    });
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  return (
    <form onSubmit={handleSubmit(calculateFuelCost)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs Column */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Inputs</h3>
        
        <div>
          <Label htmlFor="distance">Trip Distance (miles)</Label>
          <Controller name="distance" control={control} render={({ field }) => <Input id="distance" type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
          {errors.distance && <p className="text-destructive text-sm mt-1">{errors.distance.message}</p>}
        </div>

        <div>
          <Label htmlFor="fuelEfficiency">Vehicle Fuel Efficiency (MPG)</Label>
          <Controller name="fuelEfficiency" control={control} render={({ field }) => <Input id="fuelEfficiency" type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
          {errors.fuelEfficiency && <p className="text-destructive text-sm mt-1">{errors.fuelEfficiency.message}</p>}
        </div>

        <div>
          <Label htmlFor="fuelPrice">Price Per Gallon ($)</Label>
          <Controller name="fuelPrice" control={control} render={({ field }) => <Input id="fuelPrice" type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
          {errors.fuelPrice && <p className="text-destructive text-sm mt-1">{errors.fuelPrice.message}</p>}
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
                            <p className="text-sm text-muted-foreground">Total Fuel Cost</p>
                            <p className="text-3xl font-bold">{formatCurrency(results.totalCost)}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                             <p className="text-muted-foreground">Total Fuel Needed</p>
                             <p className="font-semibold">{results.fuelNeeded.toFixed(2)} gallons</p>
                        </CardContent>
                    </Card>
                </div>
            )
        ) : (
             <div className="flex items-center justify-center h-60 bg-muted/50 rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">Enter your trip details to estimate the fuel cost</p>
            </div>
        )}
      </div>
    </form>
  );
}
