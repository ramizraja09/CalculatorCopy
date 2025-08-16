
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
import { Download, Info, Zap } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Image from 'next/image';

const getCategory = (heatIndexF: number) => {
    if (heatIndexF < 80) return { category: "Comfortable", color: "bg-green-100 text-green-800", level: 0 };
    if (heatIndexF < 90) return { category: "Caution", color: "bg-yellow-100 text-yellow-800", level: 1 };
    if (heatIndexF < 103) return { category: "Extreme Caution", color: "bg-orange-100 text-orange-800", level: 2 };
    if (heatIndexF < 124) return { category: "Danger", color: "bg-red-100 text-red-800", level: 3 };
    return { category: "Extreme Danger", color: "bg-red-200 text-red-900", level: 4 };
}

// --- Tab 1: Relative Humidity Calculator ---
const humiditySchema = z.object({
  temperature: z.number(),
  unit: z.enum(['F', 'C']),
  humidity: z.number().min(0).max(100),
});
type HumidityFormData = z.infer<typeof humiditySchema>;

function HumidityCalculator({ onCalculate }: { onCalculate: (results: any, formData: any) => void }) {
    const { control, handleSubmit } = useForm<HumidityFormData>({
        resolver: zodResolver(humiditySchema),
        defaultValues: { temperature: 85, unit: 'F', humidity: 70 },
    });

    const calculate = (data: HumidityFormData) => {
        const tempF = data.unit === 'F' ? data.temperature : (data.temperature * 9/5) + 32;
        if (tempF < 80 || data.humidity < 40) {
            onCalculate({ error: "The heat index formula is typically not applied for temperatures below 80°F or humidity below 40%, as the 'feels like' temperature is close to the actual temperature." }, data);
            return;
        }
        const hi = -42.379 + 2.04901523 * tempF + 10.14333127 * data.humidity - 0.22475541 * tempF * data.humidity - 6.83783e-3 * tempF**2 - 5.481717e-2 * data.humidity**2 + 1.22874e-3 * tempF**2 * data.humidity + 8.5282e-4 * tempF * data.humidity**2 - 1.99e-6 * tempF**2 * data.humidity**2;
        onCalculate({ heatIndexF: hi, heatIndexC: (hi - 32) * 5/9, category: getCategory(hi), error: null }, data);
    };

    return (
        <form onSubmit={handleSubmit(calculate)} className="space-y-4">
            <div className="space-y-2">
                <Label>Air Temperature</Label>
                <div className="flex gap-2">
                    <Controller name="temperature" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
                    <Controller name="unit" control={control} render={({ field }) => (
                         <Select onValueChange={field.onChange} value={field.value}>
                           <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                           <SelectContent><SelectItem value="F">Fahrenheit °F</SelectItem><SelectItem value="C">Celsius °C</SelectItem></SelectContent>
                         </Select>
                    )} />
                </div>
            </div>
            <div className="space-y-2">
                <Label>Relative Humidity</Label>
                 <div className="flex items-center gap-2">
                    <Controller name="humidity" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />} />
                    <span className="font-semibold">%</span>
                </div>
            </div>
             <div className="flex gap-2 pt-4">
                <Button type="submit" className="w-full">Calculate</Button>
            </div>
        </form>
    )
}

// --- Tab 2: Dew Point Calculator ---
const dewPointSchema = z.object({
  temperature: z.number(),
  tempUnit: z.enum(['F', 'C']),
  dewPoint: z.number(),
  dewPointUnit: z.enum(['F', 'C']),
});
type DewPointFormData = z.infer<typeof dewPointSchema>;

function DewPointCalculator({ onCalculate }: { onCalculate: (results: any, formData: any) => void }) {
    const { control, handleSubmit } = useForm<DewPointFormData>({
        resolver: zodResolver(dewPointSchema),
        defaultValues: { temperature: 86, tempUnit: 'F', dewPoint: 77, dewPointUnit: 'F' },
    });

    const calculate = (data: DewPointFormData) => {
        const tempC = data.tempUnit === 'C' ? data.temperature : (data.temperature - 32) * 5/9;
        const dewPointC = data.dewPointUnit === 'C' ? data.dewPoint : (data.dewPoint - 32) * 5/9;
        
        // Calculate relative humidity from dew point
        const rh = 100 * (Math.exp((17.625 * dewPointC) / (243.04 + dewPointC)) / Math.exp((17.625 * tempC) / (243.04 + tempC)));
        
        const tempF = tempC * 9/5 + 32;

        if (tempF < 80 || rh < 40) {
            onCalculate({ error: "The heat index formula is typically not applied for temperatures below 80°F or humidity below 40%." }, data);
            return;
        }

        const hi = -42.379 + 2.04901523 * tempF + 10.14333127 * rh - 0.22475541 * tempF * rh - 6.83783e-3 * tempF**2 - 5.481717e-2 * rh**2 + 1.22874e-3 * tempF**2 * rh + 8.5282e-4 * tempF * rh**2 - 1.99e-6 * tempF**2 * rh**2;
        onCalculate({ heatIndexF: hi, heatIndexC: (hi - 32) * 5/9, category: getCategory(hi), error: null }, data);
    };

    return (
        <form onSubmit={handleSubmit(calculate)} className="space-y-4">
            <div className="space-y-2">
                <Label>Air Temperature</Label>
                <div className="flex gap-2">
                    <Controller name="temperature" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
                    <Controller name="tempUnit" control={control} render={({ field }) => (
                         <Select onValueChange={field.onChange} value={field.value}><SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="F">Fahrenheit °F</SelectItem><SelectItem value="C">Celsius °C</SelectItem></SelectContent></Select>
                    )} />
                </div>
            </div>
            <div className="space-y-2">
                <Label>Dew Point Temperature</Label>
                 <div className="flex gap-2">
                    <Controller name="dewPoint" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
                    <Controller name="dewPointUnit" control={control} render={({ field }) => (
                         <Select onValueChange={field.onChange} value={field.value}><SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="F">Fahrenheit °F</SelectItem><SelectItem value="C">Celsius °C</SelectItem></SelectContent></Select>
                    )} />
                </div>
            </div>
             <div className="flex gap-2 pt-4">
                <Button type="submit" className="w-full">Calculate</Button>
            </div>
        </form>
    );
}

// --- Main Component ---
export default function HeatIndexCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<any>(null);

  const handleCalculation = (calcResults: any, calcFormData: any) => {
    setResults(calcResults);
    setFormData(calcFormData);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `heat-index-calculation.${format}`;

    if (format === 'txt') {
      content = `Heat Index Calculation\n\nInputs:\n${Object.entries(formData).map(([k,v]) => `- ${k}: ${v}`).join('\n')}\n\nResult:\n- Heat Index: ${results.heatIndexF.toFixed(1)}°F / ${results.heatIndexC.toFixed(1)}°C\n- Category: ${results.category.category}`;
    } else {
       content = `Category,Value\n${Object.entries(formData).map(([k,v]) => `${k},${v}`).join('\n')}\nResult Category,Value\nHeat Index (°F),${results.heatIndexF.toFixed(1)}\nHeat Index (°C),${results.heatIndexC.toFixed(1)}\nCategory,${results.category.category}`;
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
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
            <Tabs defaultValue="humidity" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="humidity">Use Relative Humidity</TabsTrigger>
                    <TabsTrigger value="dewpoint">Use Dew Point</TabsTrigger>
                </TabsList>
                <TabsContent value="humidity">
                    <Card><CardContent className="p-6"><HumidityCalculator onCalculate={handleCalculation} /></CardContent></Card>
                </TabsContent>
                <TabsContent value="dewpoint">
                     <Card><CardContent className="p-6"><DewPointCalculator onCalculate={handleCalculation} /></CardContent></Card>
                </TabsContent>
            </Tabs>
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
            <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter conditions to calculate</p></div>
          )}
        </div>
      </div>
       <Card className="col-span-1 md:col-span-2">
        <CardHeader><CardTitle>Heat Index Chart</CardTitle></CardHeader>
        <CardContent>
          <Image 
            src="https://placehold.co/800x600.png"
            alt="Heat Index Chart from the National Weather Service"
            width={800}
            height={600}
            className="w-full h-auto rounded-md"
            data-ai-hint="heat index"
          />
           <p className="text-xs text-muted-foreground mt-2 text-center">Source: U.S. National Weather Service</p>
        </CardContent>
      </Card>
    </div>
  );
}
