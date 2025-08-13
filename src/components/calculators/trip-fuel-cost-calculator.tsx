
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
  distance: z.number().min(1, 'Distance must be positive'),
  fuelEfficiency: z.number().min(1, 'Fuel efficiency must be positive'),
  fuelPrice: z.number().min(0.01, 'Fuel price must be positive'),
});

type FormData = z.infer<typeof formSchema>;

export default function TripFuelCostCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      distance: 400,
      fuelEfficiency: 15,
      fuelPrice: 1.50,
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
    setFormData(data);
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `trip-fuel-cost-calculation.${format}`;
    const { distance, fuelEfficiency, fuelPrice } = formData;

    if (format === 'txt') {
      content = `Trip Fuel Cost Calculation\n\nInputs:\n- Trip Distance: ${distance} km\n- Fuel Efficiency: ${fuelEfficiency} km/L\n- Fuel Price: ${formatCurrency(fuelPrice)} per liter\n\nResult:\n- Fuel Required: ${results.fuelNeeded.toFixed(2)} L\n- Trip Cost: ${formatCurrency(results.totalCost)}`;
    } else {
      content = `Distance (km),Efficiency (km/L),Price/Liter,Fuel Required (L),Trip Cost\n${distance},${fuelEfficiency},${fuelPrice},${results.fuelNeeded.toFixed(2)},${results.totalCost.toFixed(2)}`;
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
    <form onSubmit={handleSubmit(calculateFuelCost)} className="grid md:grid-cols-2 gap-8">
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Trip Details</h3>
        
        <div>
          <Label htmlFor="distance">Trip Distance (km)</Label>
          <Controller name="distance" control={control} render={({ field }) => <Input id="distance" type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
          {errors.distance && <p className="text-destructive text-sm mt-1">{errors.distance.message}</p>}
        </div>

        <div>
          <Label htmlFor="fuelEfficiency">Vehicle Fuel Efficiency (km/L)</Label>
          <Controller name="fuelEfficiency" control={control} render={({ field }) => <Input id="fuelEfficiency" type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
          {errors.fuelEfficiency && <p className="text-destructive text-sm mt-1">{errors.fuelEfficiency.message}</p>}
        </div>

        <div>
          <Label htmlFor="fuelPrice">Price Per Liter ($)</Label>
          <Controller name="fuelPrice" control={control} render={({ field }) => <Input id="fuelPrice" type="number" step="0.01" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
          {errors.fuelPrice && <p className="text-destructive text-sm mt-1">{errors.fuelPrice.message}</p>}
        </div>
        
        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Calculate</Button>
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

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Trip Cost Summary</h3>
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
                             <p className="text-muted-foreground">Fuel Required</p>
                             <p className="font-semibold">{results.fuelNeeded.toFixed(2)} Liters</p>
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
