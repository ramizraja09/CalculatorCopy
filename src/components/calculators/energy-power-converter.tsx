
"use client";

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const energyUnits = { joules: 'Joules', calories: 'Calories', 'kilowatt-hours': 'Kilowatt-hours' };
const powerUnits = { watts: 'Watts', horsepower: 'Horsepower' };

const energyFactors = { joules: 1, calories: 4.184, 'kilowatt-hours': 3_600_000 };
const powerFactors = { watts: 1, horsepower: 745.7 };

const formSchema = z.object({
  value: z.number().min(0),
  fromUnit: z.string(),
  toUnit: z.string(),
});

type FormData = z.infer<typeof formSchema>;

function ConverterTab({ category, units, factors }: { category: 'energy' | 'power', units: { [key: string]: string }, factors: { [key: string]: number } }) {
  const [result, setResult] = useState<string | null>(null);
  const { control, watch } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      value: 100,
      fromUnit: Object.keys(units)[0],
      toUnit: Object.keys(units)[1],
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
  }, [formData, factors]);

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
  )
}

export default function EnergyPowerConverter() {
  return (
    <Tabs defaultValue="energy" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="energy">Energy</TabsTrigger>
        <TabsTrigger value="power">Power</TabsTrigger>
      </TabsList>
      <TabsContent value="energy">
        <ConverterTab category="energy" units={energyUnits} factors={energyFactors} />
      </TabsContent>
      <TabsContent value="power">
        <ConverterTab category="power" units={powerUnits} factors={powerFactors} />
      </TabsContent>
    </Tabs>
  );
}
