"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Download, Info } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Image from 'next/image';

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
    if (heatIndex < 80) return { category: "Comfortable", color: "bg-green-100 text-green-800", level: 0 };
    if (heatIndex < 90) return { category: "Caution", color: "bg-yellow-100 text-yellow-800", level: 1 };
    if (heatIndex < 103) return { category: "Extreme Caution", color: "bg-orange-100 text-orange-800", level: 2 };
    if (heatIndex < 124) return { category: "Danger", color: "bg-red-100 text-red-800", level: 3 };
    return { category: "Extreme Danger", color: "bg-red-200 text-red-900", level: 4 };
}

export default function HeatIndexCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, watch } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { temperature: 85, unit: 'F', humidity: 70 },
  });

  const formValues = watch();

  const handleCalculation = (data: FormData) => {
    const { temperature, unit, humidity } = data;
    const tempF = unit === 'F' ? temperature : (temperature * 9/5) + 32;
    
    if (tempF < 80 || humidity < 40) {
        setResults({ 
            error: "The heat index formula is typically not applied for temperatures below 80°F or humidity below 40%, as the 'feels like' temperature is close to the actual temperature." 
        });
        setFormData(data);
        return;
    }
    
    const heatIndexF = calculateHeatIndex(tempF, humidity);
    const heatIndexC = (heatIndexF - 32) * 5/9;
    
    setResults({
        heatIndexF,
        heatIndexC,
        category: getCategory(heatIndexF),
        error: null,
    });
    setFormData(data);
  };

  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `heat-index-calculation.${format}`;
    const { temperature, unit, humidity } = formData;

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
    <div className="space-y-8">
      <form onSubmit={handleSubmit(handleCalculation)} className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Weather Conditions</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Air Temperature</Label>
                <div className="flex gap-2">
                  <Controller name="temperature" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
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
                  <Controller name="humidity" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))} />} />
              </div>
            </CardContent>
          </Card>
          <div className="flex gap-2">
              <Button type="submit" className="flex-1">Calculate</Button>
              <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                      <Button variant="outline" disabled={!results}>
                          <Download className="mr-2 h-4 w-4" /> Export Results
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
          <h3 className="text-xl font-semibold">"Feels Like" Temperature</h3>
          {results ? (
            results.error ? (
              <Alert variant="destructive">
                  <Info className="h-4 w-4" />
                  <AlertTitle>Note</AlertTitle>
                  <AlertDescription>{results.error}</AlertDescription>
              </Alert>
            ) : (
              <Card className={results.category.color}>
                  <CardContent className="p-6 text-center">
                      <p className="text-sm">Heat Index</p>
                      <p className="text-4xl font-bold my-2">{results.heatIndexF.toFixed(1)}°F / {results.heatIndexC.toFixed(1)}°C</p>
                      <p className="font-semibold">{results.category.category}</p>
                  </CardContent>
              </Card>
            )
          ) : (
            <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter temperature and humidity</p></div>
          )}
        </div>
      </form>
       <Card className="col-span-1 md:col-span-2">
        <CardHeader><CardTitle>Heat Index Chart</CardTitle></CardHeader>
        <CardContent>
          <Image 
            src="https://www.weather.gov/images/safety/heat_index.png"
            alt="Heat Index Chart from the National Weather Service"
            width={1600}
            height={1200}
            className="w-full h-auto rounded-md"
            data-ai-hint="heat index"
          />
           <p className="text-xs text-muted-foreground mt-2 text-center">Source: U.S. National Weather Service</p>
        </CardContent>
      </Card>
    </div>
  );
}
