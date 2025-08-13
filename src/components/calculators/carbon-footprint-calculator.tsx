
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Emission Factors (kg CO2e per unit) - simplified for demonstration
const emissionFactors = {
  car: 0.17, // per km
  bus: 0.105, // per km
  train: 0.041, // per km
  energy: 0.233, // per kWh
  meat: 14.5, // per kg (beef equivalent)
};
const TREES_OFFSET_PER_YEAR_KG = 21; // kg CO2 per tree per year

const formSchema = z.object({
  distance: z.number().min(0),
  vehicleType: z.enum(['car', 'bus', 'train']),
  energyConsumption: z.number().min(0),
  meatConsumption: z.number().min(0),
});

type FormData = z.infer<typeof formSchema>;

export default function CarbonFootprintCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      distance: 15000,
      vehicleType: 'car',
      energyConsumption: 4000,
      meatConsumption: 5,
    },
  });

  const calculateFootprint = (data: FormData) => {
    const travelEmissions = data.distance * emissionFactors[data.vehicleType];
    const energyEmissions = data.energyConsumption * emissionFactors.energy;
    const dietEmissions = (data.meatConsumption * 12) * emissionFactors.meat; // Annualize

    const totalEmissionsKg = travelEmissions + energyEmissions + dietEmissions;
    const treesNeeded = totalEmissionsKg / TREES_OFFSET_PER_YEAR_KG;

    setResults({
      totalEmissions: totalEmissionsKg,
      treesNeeded: treesNeeded,
    });
    setFormData(data);
  };

  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `carbon-footprint-calculation.${format}`;
    const { distance, vehicleType, energyConsumption, meatConsumption } = formData;

    if (format === 'txt') {
      content = `Carbon Footprint Calculation\n\nInputs:\n- Annual Travel: ${distance} km via ${vehicleType}\n- Annual Energy: ${energyConsumption} kWh\n- Monthly Meat: ${meatConsumption} kg\n\nResult:\n- Total Emissions: ${results.totalEmissions.toFixed(0)} kg CO2e/year\n- Trees Needed to Offset: ${results.treesNeeded.toFixed(0)}`;
    } else {
       content = `Travel (km),Vehicle,Energy (kWh),Meat (kg/month),Total Emissions (kg CO2e),Trees Needed\n${distance},${vehicleType},${energyConsumption},${meatConsumption},${results.totalEmissions.toFixed(0)},${results.treesNeeded.toFixed(0)}`;
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
    <form onSubmit={handleSubmit(calculateFootprint)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs Column */}
      <div className="space-y-4">
        <Card>
            <CardHeader><CardTitle>Annual Travel</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label>Distance (km)</Label>
                    <Controller name="distance" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
                </div>
                <div>
                    <Label>Primary Vehicle Type</Label>
                    <Controller name="vehicleType" control={control} render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent><SelectItem value="car">Car (Gasoline)</SelectItem><SelectItem value="bus">Bus</SelectItem><SelectItem value="train">Train</SelectItem></SelectContent>
                        </Select>
                    )} />
                </div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle>Household & Diet</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div><Label>Annual Home Energy (kWh)</Label><Controller name="energyConsumption" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
                <div><Label>Monthly Meat Consumption (kg)</Label><Controller name="meatConsumption" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
            </CardContent>
        </Card>
        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Calculate Footprint</Button>
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
        <h3 className="text-xl font-semibold">Annual Footprint</h3>
        {results ? (
            <div className="space-y-4">
                <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-sm text-muted-foreground">Total Annual Emissions</p>
                        <p className="text-3xl font-bold">{results.totalEmissions.toFixed(0)} kg CO₂e</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                         <p className="text-sm text-muted-foreground">Trees Needed to Offset (per year)</p>
                         <p className="text-3xl font-bold">{results.treesNeeded.toFixed(0)}</p>
                    </CardContent>
                </Card>
            </div>
        ) : (
             <div className="flex items-center justify-center h-60 bg-muted/50 rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">Enter your data to estimate your footprint</p>
            </div>
        )}
      </div>
    </form>
  );
}
