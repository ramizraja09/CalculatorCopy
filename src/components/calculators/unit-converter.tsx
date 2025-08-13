
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


const conversionFactors: { [key: string]: { [key: string]: number } } = {
  length: {
    meters: 1,
    kilometers: 0.001,
    miles: 0.000621371,
    feet: 3.28084,
    inches: 39.3701,
  },
  weight: {
    kilograms: 1,
    grams: 1000,
    pounds: 2.20462,
    ounces: 35.274,
  },
  temperature: {
    celsius: 1,
    fahrenheit: 1,
    kelvin: 1,
  }
};

const formSchema = z.object({
  category: z.string(),
  fromUnit: z.string(),
  toUnit: z.string(),
  value: z.number(),
});

type FormData = z.infer<typeof formSchema>;

export default function UnitConverter() {
  const [result, setResult] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, watch, setValue, trigger } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: 'length',
      fromUnit: 'meters',
      toUnit: 'feet',
      value: 10,
    },
  });

  const currentFormData = watch();

  const handleCategoryChange = (newCategory: string) => {
    setValue('category', newCategory);
    const units = Object.keys(conversionFactors[newCategory]);
    setValue('fromUnit', units[0]);
    setValue('toUnit', units[1] || units[0]);
    setResult(null);
    setFormData(null);
    trigger();
  }

  const convertUnits = (data: FormData) => {
    if (!data.fromUnit || !data.toUnit) return;

    const { category, fromUnit, toUnit, value } = data;
    
    let convertedValue;
    if (category === 'temperature') {
        if (fromUnit === toUnit) {
            convertedValue = value;
        } else if (fromUnit === 'celsius' && toUnit === 'fahrenheit') {
            convertedValue = (value * 9/5) + 32;
        } else if (fromUnit === 'fahrenheit' && toUnit === 'celsius') {
            convertedValue = (value - 32) * 5/9;
        } else if (fromUnit === 'celsius' && toUnit === 'kelvin') {
            convertedValue = value + 273.15;
        } else if (fromUnit === 'kelvin' && toUnit === 'celsius') {
            convertedValue = value - 273.15;
        } else if (fromUnit === 'fahrenheit' && toUnit === 'kelvin') {
            convertedValue = (value - 32) * 5/9 + 273.15;
        } else { // kelvin to fahrenheit
            convertedValue = (value - 273.15) * 9/5 + 32;
        }
    } else {
      const factors = conversionFactors[category];
      const valueInBaseUnit = value / factors[fromUnit];
      convertedValue = valueInBaseUnit * factors[toUnit];
    }
    
    setResult(convertedValue.toLocaleString(undefined, { maximumFractionDigits: 4 }));
    setFormData(data);
  };
  
   const handleExport = (format: 'txt' | 'csv') => {
    if (!result || !formData) return;
    
    let content = '';
    const filename = `${formData.category}-conversion.${format}`;
    const { value, fromUnit, toUnit } = formData;

    if (format === 'txt') {
      content = `Unit Conversion\n\nInputs:\n- Value: ${value}\n- From: ${fromUnit}\n- To: ${toUnit}\n\nResult:\n- Converted Value: ${result}`;
    } else {
       content = `Value,From Unit,To Unit,Result\n${value},${fromUnit},${toUnit},${result}`;
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
    <form onSubmit={handleSubmit(convertUnits)} className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Unit Conversion</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Category</Label>
            <Select onValueChange={handleCategoryChange} value={currentFormData.category}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  {Object.keys(conversionFactors).map(cat => <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>)}
                </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>From</Label>
              <Controller name="fromUnit" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                      {Object.keys(conversionFactors[currentFormData.category]).map(unit => <SelectItem key={unit} value={unit} className="capitalize">{unit}</SelectItem>)}
                    </SelectContent>
                </Select>
              )} />
            </div>
            <div>
              <Label>To</Label>
              <Controller name="toUnit" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                      {Object.keys(conversionFactors[currentFormData.category]).map(unit => <SelectItem key={unit} value={unit} className="capitalize">{unit}</SelectItem>)}
                    </SelectContent>
                </Select>
              )} />
            </div>
          </div>
          <div>
            <Label>Value</Label>
            <Controller name="value" control={control} render={({ field }) => <Input type="number" step="any" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
          </div>
           <div className="flex gap-2">
              <Button type="submit" className="flex-1">Convert</Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" disabled={!result}>
                    <Download className="mr-2 h-4 w-4" /> Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleExport('txt')}>Download as .txt</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('csv')}>Download as .csv</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
        </CardContent>
      </Card>

      {result !== null && (
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-muted-foreground">Result</p>
            <p className="text-3xl font-bold">{result}</p>
          </CardContent>
        </Card>
      )}
    </form>
  );
}
