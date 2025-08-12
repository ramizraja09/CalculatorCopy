
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const formSchema = z.object({
  distance: z.number().min(0.1, "Distance must be positive"),
  daysPerWeek: z.number().int().min(1).max(7),
  fuelEfficiency: z.number().min(1, "Fuel efficiency must be positive"),
  fuelPrice: z.number().min(0.01, "Fuel price must be positive"),
});

type FormData = z.infer<typeof formSchema>;

export default function CommuteCostCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

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
    setFormData(data);
  };
  
  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `commute-cost-calculation.${format}`;
    const { distance, daysPerWeek, fuelEfficiency, fuelPrice } = formData;

    if (format === 'txt') {
      content = `Commute Cost Calculation\n\nInputs:\n- One-Way Distance: ${distance} miles\n- Commuting Days Per Week: ${daysPerWeek}\n- Fuel Efficiency: ${fuelEfficiency} MPG\n- Fuel Price: ${formatCurrency(fuelPrice)} per gallon\n\nResults:\n- Daily Cost: ${formatCurrency(results.daily)}\n- Weekly Cost: ${formatCurrency(results.weekly)}\n- Monthly Cost: ${formatCurrency(results.monthly)}\n- Yearly Cost: ${formatCurrency(results.yearly)}`;
    } else {
       content = `Category,Value\nOne-Way Distance (miles),${distance}\nDays Per Week,${daysPerWeek}\nFuel Efficiency (MPG),${fuelEfficiency}\nFuel Price ($),${fuelPrice}\nDaily Cost ($),${results.daily.toFixed(2)}\nWeekly Cost ($),${results.weekly.toFixed(2)}\nMonthly Cost ($),${results.monthly.toFixed(2)}\nYearly Cost ($),${results.yearly.toFixed(2)}`;
    }

    const blob = new Blob([content], { type: `text/${format}` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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
        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Calculate Commute Cost</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={!results}>
                  <Download className="mr-2 h-4 w-4" /> Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleExport('txt')}>Download as .txt</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('csv')}>Download as .csv</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
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
