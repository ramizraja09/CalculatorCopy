
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
  gender: z.enum(['male', 'female']),
  heightFt: z.number().optional(),
  heightIn: z.number().optional(),
  heightCm: z.number().optional(),
}).refine(data => data.unit === 'metric' ? data.heightCm! > 0 : data.heightFt! > 0, {
    message: "Height is required",
    path: ['heightCm']
});

type FormData = z.infer<typeof formSchema>;

export default function IdealWeightCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { unit: 'imperial', gender: 'male', heightFt: 5, heightIn: 10 },
  });

  const unit = watch('unit');

  const calculateIdealWeight = (data: FormData) => {
    const { unit, gender } = data;
    const heightInches = unit === 'metric' ? data.heightCm! / 2.54 : (data.heightFt! * 12) + (data.heightIn || 0);

    let baseWeight = gender === 'male' ? 50 : 45.5;
    let weightPerInch = 2.3;
    let idealWeightKg = baseWeight + weightPerInch * (heightInches - 60);

    if (heightInches < 60) {
        idealWeightKg = gender === 'male' ? 50 - (2.3 * (60 - heightInches)) : 45.5 - (2.3 * (60 - heightInches));
    }
    
    setResults({
        robinson: { kg: idealWeightKg.toFixed(1), lbs: (idealWeightKg * 2.20462).toFixed(1) }
    });
    setFormData(data);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `ideal-weight-calculation.${format}`;
    const { unit, gender, heightCm, heightFt, heightIn } = formData;
    const resultText = unit === 'imperial' ? `${results.robinson.lbs} lbs` : `${results.robinson.kg} kg`;

    if (format === 'txt') {
      content = `Ideal Weight Calculation\n\nInputs:\n- Gender: ${gender}\n`;
      if(unit === 'metric') {
        content += `- Height: ${heightCm} cm\n`;
      } else {
        content += `- Height: ${heightFt} ft ${heightIn} in\n`;
      }
      content += `\nResult:\n- Ideal Weight (Robinson Formula): ${resultText}`;
    } else {
       content = `Gender,Height,Ideal Weight\n${gender},"${unit === 'metric' ? `${heightCm}cm` : `${heightFt}'${heightIn}"`}",${resultText}`;
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
    <form onSubmit={handleSubmit(calculateIdealWeight)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Inputs</h3>
        <Controller name="unit" control={control} render={({ field }) => (
            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 gap-4">
                <Label className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><RadioGroupItem value="imperial" className="mr-2"/>Imperial</Label>
                <Label className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><RadioGroupItem value="metric" className="mr-2"/>Metric</Label>
            </RadioGroup>
        )}/>
        <Controller name="gender" control={control} render={({ field }) => (
            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 gap-4">
                <Label className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><RadioGroupItem value="male" className="mr-2"/>Male</Label>
                <Label className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><RadioGroupItem value="female" className="mr-2"/>Female</Label>
            </RadioGroup>
        )}/>
         {unit === 'imperial' ? (
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Height (ft)</Label><Controller name="heightFt" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))} />} /></div>
            <div><Label>Height (in)</Label><Controller name="heightIn" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))} />} /></div>
          </div>
        ) : (
            <div><Label>Height (cm)</Label><Controller name="heightCm" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
        )}
        {errors.heightCm && <p className="text-destructive text-sm mt-1">{errors.heightCm.message}</p>}
        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Calculate Ideal Weight</Button>
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
        <h3 className="text-xl font-semibold">Results (Robinson Formula)</h3>
        {results ? (
            <Card>
                <CardContent className="p-6 text-center">
                    <p className="text-sm text-muted-foreground">Ideal Weight Range</p>
                    <p className="text-4xl font-bold my-2">{unit === 'imperial' ? `${results.robinson.lbs} lbs` : `${results.robinson.kg} kg`}</p>
                </CardContent>
            </Card>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter your details to calculate ideal weight</p></div>
        )}
      </div>
    </form>
  );
}
