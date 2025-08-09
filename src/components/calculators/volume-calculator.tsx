
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
  shape: z.enum(['cube', 'sphere', 'cylinder']),
  side: z.number().optional(),
  radius: z.number().optional(),
  height: z.number().optional(),
}).refine(data => {
    if (data.shape === 'cube') return data.side! > 0;
    if (data.shape === 'sphere') return data.radius! > 0;
    if (data.shape === 'cylinder') return data.radius! > 0 && data.height! > 0;
    return false;
}, { message: "Please enter valid dimensions for the selected shape.", path: ['side']});


type FormData = z.infer<typeof formSchema>;

export default function VolumeCalculator() {
  const [results, setResults] = useState<any>(null);
  const { control, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { shape: 'cube', side: 5 },
  });

  const shape = watch('shape');

  const calculateVolume = (data: FormData) => {
    let volume = 0;
    if (data.shape === 'cube') volume = data.side! ** 3;
    if (data.shape === 'sphere') volume = (4/3) * Math.PI * data.radius! ** 3;
    if (data.shape === 'cylinder') volume = Math.PI * data.radius! ** 2 * data.height!;
    setResults({ volume });
  };

  return (
    <form onSubmit={handleSubmit(calculateVolume)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Inputs</h3>
        <div>
          <Label>Shape</Label>
          <Controller name="shape" control={control} render={({ field }) => (
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent>
                <SelectItem value="cube">Cube</SelectItem>
                <SelectItem value="sphere">Sphere</SelectItem>
                <SelectItem value="cylinder">Cylinder</SelectItem>
              </SelectContent>
            </Select>
          )} />
        </div>
        {shape === 'cube' && <>
            <div><Label>Side Length</Label><Controller name="side" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
        </>}
        {shape === 'sphere' && <>
            <div><Label>Radius</Label><Controller name="radius" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
        </>}
        {shape === 'cylinder' && <>
            <div><Label>Radius</Label><Controller name="radius" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
            <div><Label>Height</Label><Controller name="height" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
        </>}
        {errors.side && <p className="text-destructive text-sm mt-1">{errors.side.message}</p>}
        <Button type="submit" className="w-full">Calculate Volume</Button>
      </div>

      {/* Results */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Results</h3>
        {results ? (
            <Card>
                <CardContent className="p-6 text-center">
                    <p className="text-sm text-muted-foreground">Volume</p>
                    <p className="text-4xl font-bold my-2">{results.volume.toFixed(2)}</p>
                    <p className="text-muted-foreground">cubic units</p>
                </CardContent>
            </Card>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter dimensions to calculate volume</p></div>
        )}
      </div>
    </form>
  );
}
