
"use client";

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const formSchema = z.object({
  temperature: z.number(),
  unit: z.enum(['F', 'C']),
  humidity: z.number().min(0).max(100),
});

type FormData = z.infer<typeof formSchema>;

// Steadman's formula for Heat Index
const calculateHeatIndex = (T: number, RH: number) => {
  const HI = -42.379 + 2.04901523 * T + 10.14333127 * RH - 0.22475541 * T * RH - 6.83783e-3 * T * T - 5.481717e-2 * RH * RH + 1.22874e-3 * T * T * RH + 8.5282e-4 * T * RH * RH - 1.99e-6 * T * T * RH * RH;
  return HI;
};

const getCategory = (heatIndex: number) => {
    if (heatIndex < 80) return { category: "Comfortable", color: "text-green-600" };
    if (heatIndex < 90) return { category: "Caution", color: "text-yellow-500" };
    if (heatIndex < 103) return { category: "Extreme Caution", color: "text-orange-500" };
    if (heatIndex < 124) return { category: "Danger", color: "text-red-500" };
    return { category: "Extreme Danger", color: "text-red-700" };
}

export default function HeatIndexCalculator() {
  const { control, watch } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { temperature: 85, unit: 'F', humidity: 70 },
  });

  const formValues = watch();

  let results: { heatIndexF: number; heatIndexC: number; category: { category: string; color: string; }} | null = null;
  const { temperature, unit, humidity } = formValues;
  const tempF = unit === 'F' ? temperature : (temperature * 9/5) + 32;
  if(tempF >= 80 && humidity >= 40) {
      const heatIndex = calculateHeatIndex(tempF, humidity);
      results = {
          heatIndexF: heatIndex,
          heatIndexC: (heatIndex - 32) * 5/9,
          category: getCategory(heatIndex),
      };
  }

  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formValues) return;
    
    let content = '';
    const filename = `heat-index-calculation.${format}`;
    const { temperature, unit, humidity } = formValues;

    if (format === 'txt') {
      content = `Heat Index Calculation\n\nInputs:\n- Temperature: ${temperature}°${unit}\n- Humidity: ${humidity}%\n\nResult:\n- Heat Index: ${results.heatIndexF.toFixed(1)}°F / ${results.heatIndexC.toFixed(1)}°C\n- Category: ${results.category.category}`;
    } else {
       content = `Temperature,Unit,Humidity(%),Heat Index (°F),Heat Index (°C),Category\n${temperature},${unit},${humidity},${results.heatIndexF.toFixed(1)},${results.heatIndexC.toFixed(1)},"${results.category.category}"`;
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
    <form onSubmit={(e) => e.preventDefault()} className="grid md:grid-cols-2 gap-8">
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Weather Conditions</h3>
        <div>
          <Label>Air Temperature</Label>
          <div className="flex gap-2">
            <Controller name="temperature" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
            <Controller name="unit" control={control} render={({ field }) => (
              <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-2 gap-2 items-center">
                  <Label className="px-3 py-2 border rounded-md text-center text-sm peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><RadioGroupItem value="F" className="sr-only"/>°F</Label>
                  <Label className="px-3 py-2 border rounded-md text-center text-sm peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><RadioGroupItem value="C" className="sr-only"/>°C</Label>
              </RadioGroup>
            )} />
          </div>
        </div>
        <div>
            <Label>Relative Humidity (%)</Label>
            <Controller name="humidity" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} />
        </div>
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={!results} className="w-full">
                    <Download className="mr-2 h-4 w-4" /> Export Results
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleExport('txt')}>Download as .txt</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('csv')}>Download as .csv</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">"Feels Like" Temperature</h3>
        {results ? (
            <Card>
                <CardContent className="p-6 text-center">
                    <p className="text-sm text-muted-foreground">Heat Index</p>
                    <p className="text-4xl font-bold my-2">{results.heatIndexF.toFixed(1)}°F / {results.heatIndexC.toFixed(1)}°C</p>
                    <p className={`font-semibold ${results.category.color}`}>{results.category.category}</p>
                </CardContent>
            </Card>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p className="text-sm text-muted-foreground text-center">Enter temperature (≥80°F) and humidity (≥40%)</p></div>
        )}
      </div>
    </form>
  );
}
