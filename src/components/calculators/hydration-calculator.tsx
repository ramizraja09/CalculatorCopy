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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download } from 'lucide-react';

const formSchema = z.object({
  weight: z.number().min(1),
  unit: z.enum(['lbs', 'kg']),
  exerciseDuration: z.number().min(0),
  climate: z.enum(['temperate', 'hot']),
});

type FormData = z.infer<typeof formSchema>;

export default function HydrationCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { weight: 160, unit: 'lbs', exerciseDuration: 60, climate: 'temperate' },
  });

  const calculateHydration = (data: FormData) => {
    const weightLbs = data.unit === 'lbs' ? data.weight : data.weight * 2.20462;
    
    // Base intake: Half of body weight in ounces
    let baseOunces = weightLbs / 2;
    
    // Add for exercise: 12 oz for every 30 minutes
    const exerciseOunces = (data.exerciseDuration / 30) * 12;
    
    let totalOunces = baseOunces + exerciseOunces;
    
    // Adjust for climate
    if (data.climate === 'hot') {
      totalOunces *= 1.15; // Increase by 15% for hot climates
    }
    
    setResults({
      ounces: totalOunces.toFixed(0),
      liters: (totalOunces * 0.0295735).toFixed(1),
    });
    setFormData(data);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `hydration-calculation.${format}`;
    const { weight, unit, exerciseDuration, climate } = formData;

    if (format === 'txt') {
      content = `Hydration Calculation\n\nInputs:\n- Weight: ${weight} ${unit}\n- Exercise Duration: ${exerciseDuration} mins\n- Climate: ${climate}\n\nResult:\n- Recommended Intake: ${results.ounces} oz (${results.liters} L)`;
    } else {
       content = `Weight,Unit,Exercise (mins),Climate,Intake (oz),Intake (L)\n${weight},${unit},${exerciseDuration},${climate},${results.ounces},${results.liters}`;
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
    <form onSubmit={handleSubmit(calculateHydration)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Inputs</h3>
        <div>
          <Label>Weight</Label>
          <div className="flex gap-2">
            <Controller name="weight" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
            <Controller name="unit" control={control} render={({ field }) => (
                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 gap-2 items-center">
                    <Label className="px-3 py-2 border rounded-md text-center text-sm peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><RadioGroupItem value="lbs" className="sr-only"/>lbs</Label>
                    <Label className="px-3 py-2 border rounded-md text-center text-sm peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><RadioGroupItem value="kg" className="sr-only"/>kg</Label>
                </RadioGroup>
            )} />
          </div>
        </div>
        <div>
          <Label>Exercise Duration (minutes)</Label>
          <Controller name="exerciseDuration" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} />
        </div>
        <div>
          <Label>Climate</Label>
          <Controller name="climate" control={control} render={({ field }) => (
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent>
                <SelectItem value="temperate">Temperate</SelectItem>
                <SelectItem value="hot">Hot & Humid</SelectItem>
              </SelectContent>
            </Select>
          )} />
        </div>
        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Calculate Hydration Needs</Button>
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
        <h3 className="text-xl font-semibold">Recommended Daily Fluid Intake</h3>
        {results ? (
            <Card>
                <CardContent className="p-6 text-center">
                    <p className="text-sm text-muted-foreground">Total Water Needed</p>
                    <p className="text-4xl font-bold my-2">{results.ounces} oz</p>
                    <p className="text-muted-foreground">or {results.liters} liters</p>
                </CardContent>
            </Card>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter details to estimate hydration needs</p></div>
        )}
      </div>
    </form>
  );
}
