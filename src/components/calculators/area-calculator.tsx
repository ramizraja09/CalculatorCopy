
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download } from 'lucide-react';


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
  const [formData, setFormData] = useState<FormData | null>(null);

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
    setFormData(data);
  };

  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `area-calculation.${format}`;
    let inputs = `Shape: ${formData.shape}`;
    if (formData.shape === 'rectangle') inputs += `, Length: ${formData.length}, Width: ${formData.width}`;
    if (formData.shape === 'circle') inputs += `, Radius: ${formData.radius}`;
    if (formData.shape === 'triangle') inputs += `, Base: ${formData.base}, Height: ${formData.height}`;


    if (format === 'txt') {
      content = `Area Calculation\n\nInputs:\n${inputs}\n\nResult:\nArea: ${results.area.toFixed(2)} square units`;
    } else {
       content = `Shape,Length,Width,Radius,Base,Height,Area\n${formData.shape},${formData.length || ''},${formData.width || ''},${formData.radius || ''},${formData.base || ''},${formData.height || ''},${results.area.toFixed(2)}`;
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
        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Calculate Area</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={!results}>
                  <Download className="mr-2 h-4 w-4" /> Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleExport('txt')}>Download as .txt</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('csv')}>Download as .csv</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
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
