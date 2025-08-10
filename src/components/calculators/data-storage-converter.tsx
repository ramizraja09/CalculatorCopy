
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
  bytes: 'Bytes',
  kilobytes: 'Kilobytes (KB)',
  megabytes: 'Megabytes (MB)',
  gigabytes: 'Gigabytes (GB)',
  terabytes: 'Terabytes (TB)',
};

// All conversions relative to bytes
const factors: { [key: string]: number } = {
  bytes: 1,
  kilobytes: 1024,
  megabytes: 1024 ** 2,
  gigabytes: 1024 ** 3,
  terabytes: 1024 ** 4,
};

const formSchema = z.object({
  value: z.number().min(0),
  fromUnit: z.string(),
  toUnit: z.string(),
});

type FormData = z.infer<typeof formSchema>;

export default function DataStorageConverter() {
  const [result, setResult] = useState<string | null>(null);
  const { control, watch } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      value: 1,
      fromUnit: 'gigabytes',
      toUnit: 'megabytes',
    },
  });

  const formData = watch();

  useEffect(() => {
    const { value, fromUnit, toUnit } = formData;
    const fromFactor = factors[fromUnit];
    const toFactor = factors[toUnit];
    if (fromFactor && toFactor) {
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
            <Controller name="value" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
            <Controller name="fromUnit" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(units).map(([key, name]) => <SelectItem key={key} value={key}>{name}</SelectItem>)}
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
                  {Object.entries(units).map(([key, name]) => <SelectItem key={key} value={key}>{name}</SelectItem>)}
                </SelectContent>
              </Select>
            )} />
          </div>
        </div>
      </div>
    </form>
  );
}
