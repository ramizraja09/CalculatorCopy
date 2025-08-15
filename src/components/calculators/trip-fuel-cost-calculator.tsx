
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const formSchema = z.object({
  distance: z.number().min(0.1, "Distance must be positive"),
  distanceUnit: z.enum(['km', 'miles']),
  fuelEfficiency: z.number().min(0.1, "Fuel efficiency must be positive"),
  efficiencyUnit: z.enum(['km/L', 'L/100km', 'mpg_us', 'mpg_uk']),
  fuelPrice: z.number().min(0.01, "Fuel price must be positive"),
  priceUnit: z.enum(['per_liter', 'per_gallon']),
});

type FormData = z.infer<typeof formSchema>;
const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

const MILE_TO_KM = 1.60934;
const GALLON_TO_LITER_US = 3.78541;
const GALLON_TO_LITER_UK = 4.54609;

export default function TripFuelCostCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, reset } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      distance: 500,
      distanceUnit: 'km',
      fuelEfficiency: 10,
      efficiencyUnit: 'L/100km',
      fuelPrice: 3,
      priceUnit: 'per_liter',
    },
  });

  const calculateFuelCost = (data: FormData) => {
    const { distance, distanceUnit, fuelEfficiency, efficiencyUnit, fuelPrice, priceUnit } = data;

    // 1. Convert all inputs to base units (km, liters)
    const distanceKm = distanceUnit === 'km' ? distance : distance * MILE_TO_KM;
    const pricePerLiter = priceUnit === 'per_liter' ? fuelPrice : fuelPrice / GALLON_TO_LITER_US;

    let kmPerLiter;
    switch (efficiencyUnit) {
        case 'km/L':
            kmPerLiter = fuelEfficiency;
            break;
        case 'L/100km':
            kmPerLiter = 100 / fuelEfficiency;
            break;
        case 'mpg_us':
            kmPerLiter = fuelEfficiency * (MILE_TO_KM / GALLON_TO_LITER_US);
            break;
        case 'mpg_uk':
             kmPerLiter = fuelEfficiency * (MILE_TO_KM / GALLON_TO_LITER_UK);
            break;
        default:
            kmPerLiter = 0;
    }
    
    if (kmPerLiter <= 0) {
        setResults({ error: "Invalid fuel efficiency calculation." });
        return;
    }
    
    // 2. Calculate results
    const fuelNeededLiters = distanceKm / kmPerLiter;
    const totalCost = fuelNeededLiters * pricePerLiter;

    const roundTripCost = totalCost * 2;
    const costPerKm = totalCost / distanceKm;
    const costPerMile = totalCost / (distanceKm / MILE_TO_KM);

    setResults({
      totalCost,
      fuelNeededLiters,
      roundTripCost,
      costPerKm,
      costPerMile,
      chartData: [
        { name: 'Fuel Needed', Liters: fuelNeededLiters.toFixed(2) },
      ],
      error: null,
    });
    setFormData(data);
  };
  
  const handleClear = () => {
      reset();
      setResults(null);
      setFormData(null);
  }

  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `trip-fuel-cost-calculation.${format}`;

    if (format === 'txt') {
      content = `Trip Fuel Cost Calculation\n\nInputs:\n${Object.entries(formData).map(([k,v]) => `- ${k}: ${v}`).join('\n')}\n\nResult:\n- Total Cost: ${formatCurrency(results.totalCost)}\n- Fuel Needed: ${results.fuelNeededLiters.toFixed(2)} Liters`;
    } else {
       content = `Category,Value\n${Object.entries(formData).map(([k,v]) => `${k},${v}`).join('\n')}\nResult Category,Value\nTotal Cost,${results.totalCost.toFixed(2)}\nFuel Needed (Liters),${results.fuelNeededLiters.toFixed(2)}`;
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
    <form onSubmit={handleSubmit(calculateFuelCost)} className="grid md:grid-cols-2 gap-8 items-start">
      {/* Inputs Column */}
      <div className="space-y-4">
        <Card>
            <CardHeader>
                <CardTitle>Trip Details</CardTitle>
                 <p className="text-sm text-muted-foreground pt-2">Modify the values and click the Calculate button to use</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-[1fr,160px] gap-2 items-end">
                <Label htmlFor="distance">Trip Distance</Label>
                <div />
                <Controller name="distance" control={control} render={({ field }) => <Input id="distance" type="number" step="any" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
                <Controller name="distanceUnit" control={control} render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="km">kilometers (km)</SelectItem><SelectItem value="miles">miles</SelectItem></SelectContent></Select>
                )} />
              </div>

              <div className="grid grid-cols-[1fr,160px] gap-2 items-end">
                <Label htmlFor="fuelEfficiency">Fuel Efficiency</Label>
                <div />
                <Controller name="fuelEfficiency" control={control} render={({ field }) => <Input id="fuelEfficiency" type="number" step="any" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
                 <Controller name="efficiencyUnit" control={control} render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                        <SelectItem value="km/L">km per liter (km/L)</SelectItem>
                        <SelectItem value="L/100km">liters per 100km (L/100km)</SelectItem>
                        <SelectItem value="mpg_us">miles per gallon (mpg US)</SelectItem>
                        <SelectItem value="mpg_uk">miles per gallon (mpg UK)</SelectItem>
                    </SelectContent></Select>
                )} />
              </div>

              <div className="grid grid-cols-[1fr,160px] gap-2 items-end">
                <Label htmlFor="fuelPrice">Gas/Fuel Price</Label>
                <div />
                <Controller name="fuelPrice" control={control} render={({ field }) => <Input id="fuelPrice" type="number" step="0.01" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
                 <Controller name="priceUnit" control={control} render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                        <SelectItem value="per_liter">per liter</SelectItem>
                        <SelectItem value="per_gallon">per gallon (US)</SelectItem>
                    </SelectContent></Select>
                )} />
              </div>

            </CardContent>
        </Card>
        
        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Calculate</Button>
            <Button type="button" variant="secondary" onClick={handleClear} className="flex-1">Clear</Button>
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
                        <CardContent className="p-4 grid grid-cols-2 gap-4 text-sm text-center">
                             <div><p className="text-muted-foreground">Fuel Required</p><p className="font-semibold">{results.fuelNeededLiters.toFixed(2)} Liters</p></div>
                             <div><p className="text-muted-foreground">Round Trip Cost</p><p className="font-semibold">{formatCurrency(results.roundTripCost)}</p></div>
                             <div><p className="text-muted-foreground">Cost per km</p><p className="font-semibold">{formatCurrency(results.costPerKm)}</p></div>
                             <div><p className="text-muted-foreground">Cost per mile</p><p className="font-semibold">{formatCurrency(results.costPerMile)}</p></div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle className="text-base text-center">Fuel Needed</CardTitle></CardHeader>
                        <CardContent className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={results.chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" />
                                    <YAxis type="category" dataKey="name" hide />
                                    <Tooltip formatter={(value: number) => `${value} Liters`} />
                                    <Bar dataKey="Liters" fill="hsl(var(--primary))" barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
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

    