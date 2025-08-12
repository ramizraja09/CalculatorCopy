"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download } from 'lucide-react';

const formSchema = z.object({
  unit: z.enum(['metric', 'imperial']),
  heightCm: z.number().optional(),
  weightKg: z.number().optional(),
  heightFt: z.number().optional(),
  heightIn: z.number().optional(),
  weightLbs: z.number().optional(),
}).refine(data => {
    if (data.unit === 'metric') return data.heightCm! > 0 && data.weightKg! > 0;
    if (data.unit === 'imperial') return data.heightFt! > 0 && data.weightLbs! > 0;
    return false;
}, { message: "Height and weight are required.", path: ['weightLbs'] });

type FormData = z.infer<typeof formSchema>;

export default function BsaCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { unit: 'imperial', heightFt: 5, heightIn: 10, weightLbs: 160 },
  });

  const unit = watch('unit');

  const calculateBsa = (data: FormData) => {
    const heightCm = unit === 'metric' ? data.heightCm! : (data.heightFt! * 12 + (data.heightIn || 0)) * 2.54;
    const weightKg = unit === 'metric' ? data.weightKg! : data.weightLbs! / 2.20462;
    // Du Bois formula
    const bsa = 0.007184 * Math.pow(heightCm, 0.725) * Math.pow(weightKg, 0.425);
    setResults({ bsa });
    setFormData(data);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `bsa-calculation.${format}`;
    const { unit, heightCm, weightKg, heightFt, heightIn, weightLbs } = formData;

    if (format === 'txt') {
        content = `BSA Calculation\n\nInputs:\n`;
        if(unit === 'metric') {
            content += `- Height: ${heightCm} cm\n- Weight: ${weightKg} kg\n`;
        } else {
            content += `- Height: ${heightFt} ft ${heightIn} in\n- Weight: ${weightLbs} lbs\n`;
        }
        content += `\nResult:\n- Body Surface Area: ${results.bsa.toFixed(2)} m²`;
    } else {
       content = `Unit,Height(cm),Weight(kg),Height(ft),Height(in),Weight(lbs),BSA(m²)\n`;
       content += `${unit},${heightCm || ''},${weightKg || ''},${heightFt || ''},${heightIn || ''},${weightLbs || ''},${results.bsa.toFixed(2)}`;
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
    <form onSubmit={handleSubmit(calculateBsa)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Inputs</h3>
        <Controller name="unit" control={control} render={({ field }) => (
            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 gap-4">
                <Label className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><RadioGroupItem value="imperial" className="mr-2"/>Imperial</Label>
                <Label className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><RadioGroupItem value="metric" className="mr-2"/>Metric</Label>
            </RadioGroup>
        )}/>
        {unit === 'imperial' && (
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Height (ft)</Label><Controller name="heightFt" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
            <div><Label>Height (in)</Label><Controller name="heightIn" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
            <div className="col-span-2"><Label>Weight (lbs)</Label><Controller name="weightLbs" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
          </div>
        )}
        {unit === 'metric' && (
           <div className="space-y-4">
            <div><Label>Height (cm)</Label><Controller name="heightCm" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
            <div><Label>Weight (kg)</Label><Controller name="weightKg" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
          </div>
        )}
         {errors.weightLbs && <p className="text-destructive text-sm mt-1">{errors.weightLbs.message}</p>}
        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Calculate BSA</Button>
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
                    <p className="text-sm text-muted-foreground">Body Surface Area</p>
                    <p className="text-4xl font-bold my-2">{results.bsa.toFixed(2)} m²</p>
                </CardContent>
            </Card>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter details to calculate BSA</p></div>
        )}
      </div>
    </form>
  );
}
