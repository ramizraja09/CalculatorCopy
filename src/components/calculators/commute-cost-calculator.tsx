
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
  distance: z.number().min(0.1, "Distance must be positive"),
  daysPerWeek: z.number().int().min(1).max(7),
  fuelEfficiency: z.number().min(1, "Fuel efficiency must be positive"),
  fuelPrice: z.number().min(0.01, "Fuel price must be positive"),
});

type FormData = z.infer<typeof formSchema>;

export default function CommuteCostCalculator() {
  const [results, setResults] = useState<any>(null);

  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      distance: 20,
      daysPerWeek: 5,
      fuelEfficiency: 25,
      fuelPrice: 3.50,
    },
  });

  const calculateCost = (data: FormData) => {
    const { distance, daysPerWeek, fuelEfficiency, fuelPrice } = data;
    const dailyDistance = distance * 2; // Round trip
    const weeklyDistance = dailyDistance * daysPerWeek;
    
    const gallonsPerWeek = weeklyDistance / fuelEfficiency;
    const weeklyCost = gallonsPerWeek * fuelPrice;
    
    setResults({
      daily: weeklyCost / daysPerWeek,
      weekly: weeklyCost,
      monthly: weeklyCost * 4.345, // Average weeks in a month
      yearly: weeklyCost * 52,
    });
  };
  
  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  return (
    <form onSubmit={handleSubmit(calculateCost)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs Column */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Commute Details</h3>
        <div><Label>One-Way Distance (miles)</Label><Controller name="distance" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
        <div><Label>Commuting Days Per Week</Label><Controller name="daysPerWeek" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
        <h3 className="text-xl font-semibold pt-4">Vehicle & Fuel</h3>
        <div><Label>Vehicle Fuel Efficiency (MPG)</Label><Controller name="fuelEfficiency" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
        <div><Label>Price Per Gallon ($)</Label><Controller name="fuelPrice" control={control} render={({ field }) => <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
        <Button type="submit" className="w-full">Calculate Commute Cost</Button>
      </div>

      {/* Results Column */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Estimated Fuel Cost</h3>
        {results ? (
            <Card>
                <CardContent className="p-4 grid grid-cols-2 gap-4 text-center">
                    <div><p className="font-semibold">Daily</p><p>{formatCurrency(results.daily)}</p></div>
                    <div><p className="font-semibold">Weekly</p><p>{formatCurrency(results.weekly)}</p></div>
                    <div><p className="font-semibold">Monthly</p><p className="text-2xl font-bold">{formatCurrency(results.monthly)}</p></div>
                    <div><p className="font-semibold">Yearly</p><p className="text-2xl font-bold">{formatCurrency(results.yearly)}</p></div>
                </CardContent>
            </Card>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter details to estimate commute cost</p></div>
        )}
      </div>
    </form>
  );
}
