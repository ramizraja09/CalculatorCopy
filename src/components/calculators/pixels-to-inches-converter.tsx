
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const formSchema = z.object({
  pixels: z.number().int().min(1, "Pixels must be a positive integer"),
  dpi: z.number().int().min(1, "DPI must be positive"),
});

type FormData = z.infer<typeof formSchema>;

export default function PixelsToInchesConverter() {
  const [result, setResult] = useState<number | null>(null);
  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { pixels: 300, dpi: 300 },
  });

  const convert = (data: FormData) => {
    const inches = data.pixels / data.dpi;
    setResult(inches);
  };

  return (
    <form onSubmit={handleSubmit(convert)} className="grid md:grid-cols-2 gap-8">
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Input</h3>
        <div><Label>Pixels (px)</Label><Controller name="pixels" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />} /></div>
        <div><Label>Dots Per Inch (DPI/PPI)</Label><Controller name="dpi" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />} /></div>
        <Button type="submit" className="w-full">Convert</Button>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Result in Inches</h3>
        {result !== null ? (
            <Card>
                <CardContent className="p-6 text-center">
                    <p className="text-4xl font-bold">{result.toFixed(3)}"</p>
                </CardContent>
            </Card>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter pixels and DPI to convert</p></div>
        )}
      </div>
    </form>
  );
}
