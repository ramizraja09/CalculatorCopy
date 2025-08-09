
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
  packsPerDay: z.number().min(0.1),
  costPerPack: z.number().min(0.01),
});

type FormData = z.infer<typeof formSchema>;

export default function SmokingCostCalculator() {
  const [results, setResults] = useState<any>(null);
  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { packsPerDay: 1, costPerPack: 8.00 },
  });

  const calculateCost = (data: FormData) => {
    const dailyCost = data.packsPerDay * data.costPerPack;
    setResults({
        daily: dailyCost,
        weekly: dailyCost * 7,
        monthly: dailyCost * 30.44,
        yearly: dailyCost * 365,
    });
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  return (
    <form onSubmit={handleSubmit(calculateCost)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Inputs</h3>
        <div><Label>Packs Per Day</Label><Controller name="packsPerDay" control={control} render={({ field }) => <Input type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
        <div><Label>Cost Per Pack ($)</Label><Controller name="costPerPack" control={control} render={({ field }) => <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
        <Button type="submit" className="w-full">Calculate Cost</Button>
      </div>

      {/* Results */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Cost of Smoking</h3>
        {results ? (
            <Card>
                <CardContent className="p-4 grid grid-cols-2 gap-4 text-center">
                    <div><p className="font-semibold">Daily</p><p>{formatCurrency(results.daily)}</p></div>
                    <div><p className="font-semibold">Weekly</p><p>{formatCurrency(results.weekly)}</p></div>
                    <div><p className="font-semibold">Monthly</p><p>{formatCurrency(results.monthly)}</p></div>
                    <div><p className="font-semibold">Yearly</p><p>{formatCurrency(results.yearly)}</p></div>
                </CardContent>
            </Card>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter details to see the cost</p></div>
        )}
      </div>
    </form>
  );
}
