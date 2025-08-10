
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

  const { control, handleSubmit, watch, setValue } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: 'length',
      fromUnit: 'meters',
      toUnit: 'feet',
      value: 10,
    },
  });

  const category = watch('category');

  const handleCategoryChange = (newCategory: string) => {
    setValue('category', newCategory);
    const units = Object.keys(conversionFactors[newCategory]);
    setValue('fromUnit', units[0]);
    setValue('toUnit', units[1] || units[0]);
  }

  const convertUnits = (data: FormData) => {
    const { category, fromUnit, toUnit, value } = data;
    
    let convertedValue;
    if (category === 'temperature') {
      if (fromUnit === 'celsius' && toUnit === 'fahrenheit') convertedValue = (value * 9/5) + 32;
      else if (fromUnit === 'fahrenheit' && toUnit === 'celsius') convertedValue = (value - 32) * 5/9;
      else if (fromUnit === 'celsius' && toUnit === 'kelvin') convertedValue = value + 273.15;
      else if (fromUnit === 'kelvin' && toUnit === 'celsius') convertedValue = value - 273.15;
      else if (fromUnit === 'fahrenheit' && toUnit === 'kelvin') convertedValue = (value - 32) * 5/9 + 273.15;
      else if (fromUnit === 'kelvin' && toUnit === 'fahrenheit') convertedValue = (value - 273.15) * 9/5 + 32;
      else convertedValue = value; // same unit
    } else {
      const factors = conversionFactors[category];
      const valueInBaseUnit = value / factors[fromUnit];
      convertedValue = valueInBaseUnit * factors[toUnit];
    }
    
    setResult(convertedValue.toFixed(4));
  };

  return (
    <form onSubmit={handleSubmit(convertUnits)} className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Unit Conversion</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Category</Label>
            <Select onValueChange={handleCategoryChange} defaultValue={category}>
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
                      {Object.keys(conversionFactors[category]).map(unit => <SelectItem key={unit} value={unit} className="capitalize">{unit}</SelectItem>)}
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
                      {Object.keys(conversionFactors[category]).map(unit => <SelectItem key={unit} value={unit} className="capitalize">{unit}</SelectItem>)}
                    </SelectContent>
                </Select>
              )} />
            </div>
          </div>
          <div>
            <Label>Value</Label>
            <Controller name="value" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
          </div>
          <Button type="submit" className="w-full">Convert</Button>
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
