
"use client";

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const units = {
  'square-meters': 'Square Meters',
  'square-kilometers': 'Square Kilometers',
  'square-miles': 'Square Miles',
  'square-feet': 'Square Feet',
  'square-inches': 'Square Inches',
  acres: 'Acres',
  hectares: 'Hectares',
  ares: 'Ares',
};

// All conversions relative to square meters
const factors: { [key: string]: number } = {
  'square-meters': 1,
  'square-kilometers': 1_000_000,
  'square-miles': 2_589_988.11,
  'square-feet': 0.092903,
  'square-inches': 0.00064516,
  acres: 4046.86,
  hectares: 10000,
  ares: 100,
};

const formSchema = z.object({
  value: z.number().min(0),
  fromUnit: z.string(),
  toUnit: z.string(),
});

type FormData = z.infer<typeof formSchema>;

export default function AreaConverter() {
  const [result, setResult] = useState<string | null>(null);
  const { control, watch } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      value: 1,
      fromUnit: 'acres',
      toUnit: 'square-feet',
    },
  });

  const formData = watch();

  useEffect(() => {
    const { value, fromUnit, toUnit } = formData;
    const fromFactor = factors[fromUnit];
    const toFactor = factors[toUnit];
    if (fromFactor !== undefined && toFactor !== undefined) {
      const valueInBase = value * fromFactor;
      const convertedValue = valueInBase / toFactor;
      setResult(convertedValue.toLocaleString(undefined, { maximumFractionDigits: 5 }));
    }
  }, [formData]);

  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
        <div>
          <Label>From</Label>
          <div className="flex gap-2">
            <Controller name="value" control={control} render={({ field }) => <Input type="number" step="any" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
            <Controller name="fromUnit" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(units).map(([key, name]) => <SelectItem key={key} value={key} className="capitalize">{name.replace(/-/g, ' ')}</SelectItem>)}
                </SelectContent>
              </Select>
            )} />
          </div>
        </div>
        <div>
          <Label>To</Label>
          <div className="flex gap-2">
             <Card className="flex-1"><CardContent className="p-2 h-10 flex items-center justify-center font-semibold text-lg">{result ?? '...'}</CardContent></Card>
             <Controller name="toUnit" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(units).map(([key, name]) => <SelectItem key={key} value={key} className="capitalize">{name.replace(/-/g, ' ')}</SelectItem>)}
                </SelectContent>
              </Select>
            )} />
          </div>
        </div>
      </div>
    </form>
  );
}
