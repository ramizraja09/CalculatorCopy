
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const formSchema = z.object({
  shape: z.enum(['rectangle', 'circle', 'triangle']),
  length: z.number().optional(),
  width: z.number().optional(),
  radius: z.number().optional(),
  base: z.number().optional(),
  height: z.number().optional(),
}).refine(data => {
    if (data.shape === 'rectangle') return data.length! > 0 && data.width! > 0;
    if (data.shape === 'circle') return data.radius! > 0;
    if (data.shape === 'triangle') return data.base! > 0 && data.height! > 0;
    return false;
}, { message: "Please enter valid dimensions for the selected shape.", path: ['length']});


type FormData = z.infer<typeof formSchema>;

export default function AreaCalculator() {
  const [results, setResults] = useState<any>(null);
  const { control, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { shape: 'rectangle', length: 10, width: 5 },
  });

  const shape = watch('shape');

  const calculateArea = (data: FormData) => {
    let area = 0;
    if (data.shape === 'rectangle') area = data.length! * data.width!;
    if (data.shape === 'circle') area = Math.PI * data.radius! ** 2;
    if (data.shape === 'triangle') area = (data.base! * data.height!) / 2;
    setResults({ area });
  };

  return (
    <form onSubmit={handleSubmit(calculateArea)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Inputs</h3>
        <div>
          <Label>Shape</Label>
          <Controller name="shape" control={control} render={({ field }) => (
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent>
                <SelectItem value="rectangle">Rectangle</SelectItem>
                <SelectItem value="circle">Circle</SelectItem>
                <SelectItem value="triangle">Triangle</SelectItem>
              </SelectContent>
            </Select>
          )} />
        </div>
        {shape === 'rectangle' && <>
            <div><Label>Length</Label><Controller name="length" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
            <div><Label>Width</Label><Controller name="width" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
        </>}
        {shape === 'circle' && <>
            <div><Label>Radius</Label><Controller name="radius" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
        </>}
        {shape === 'triangle' && <>
            <div><Label>Base</Label><Controller name="base" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
            <div><Label>Height</Label><Controller name="height" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
        </>}
        {errors.length && <p className="text-destructive text-sm mt-1">{errors.length.message}</p>}
        <Button type="submit" className="w-full">Calculate Area</Button>
      </div>

      {/* Results */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Results</h3>
        {results ? (
            <Card>
                <CardContent className="p-6 text-center">
                    <p className="text-sm text-muted-foreground">Area</p>
                    <p className="text-4xl font-bold my-2">{results.area.toFixed(2)}</p>
                    <p className="text-muted-foreground">square units</p>
                </CardContent>
            </Card>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter dimensions to calculate area</p></div>
        )}
      </div>
    </form>
  );
}
