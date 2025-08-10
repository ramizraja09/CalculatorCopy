
"use client";

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Approximate conversion formula
const convert = (value: number, fromUnit: string) => {
    if (fromUnit === 'mesh') {
        // Approximate formula: Microns = 14832 / Mesh
        return 14832 / value;
    } else { // from micron
        return 14832 / value;
    }
}

const formSchema = z.object({
  value: z.number().min(0.1),
  unit: z.string(),
});

type FormData = z.infer<typeof formSchema>;

export default function MeshToMicronConverter() {
  const [result, setResult] = useState<string | null>(null);
  const { control, watch } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { value: 100, unit: 'mesh' },
  });

  const formData = watch();

  useEffect(() => {
    const { value, unit } = formData;
    if (value > 0) {
      const convertedValue = convert(value, unit);
      setResult(convertedValue.toFixed(2));
    }
  }, [formData]);

  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
        <div>
          <Label>From</Label>
          <div className="flex gap-2">
            <Controller name="value" control={control} render={({ field }) => <Input type="number" step="any" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
            <Controller name="unit" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mesh">Mesh</SelectItem>
                  <SelectItem value="micron">Microns (µm)</SelectItem>
                </SelectContent>
              </Select>
            )} />
          </div>
        </div>
        <div>
          <Label>To ({formData.unit === 'mesh' ? 'Microns' : 'Mesh'})</Label>
          <Card className="flex-1"><CardContent className="p-2 h-10 flex items-center justify-center font-semibold text-lg">{result ?? '...'}</CardContent></Card>
        </div>
      </div>
    </form>
  );
}
