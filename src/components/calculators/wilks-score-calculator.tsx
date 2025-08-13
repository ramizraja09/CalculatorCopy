
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
  gender: z.enum(['male', 'female']),
  bodyWeight: z.number().min(1),
  totalLifted: z.number().min(1),
  unit: z.enum(['kg', 'lbs']),
});

type FormData = z.infer<typeof formSchema>;

// Wilks Coefficients
const maleCoeffs = { a: -216.0475144, b: 16.2606339, c: -0.002388645, d: -0.00113732, e: 7.01863E-06, f: -1.291E-08 };
const femaleCoeffs = { a: 594.31747775582, b: -27.23842536447, c: 0.82112226871, d: -0.00930733913, e: 4.731582E-05, f: -9.054E-08 };

export default function WilksScoreCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { gender: 'male', unit: 'lbs', bodyWeight: 181, totalLifted: 1000 },
  });

  const calculateWilks = (data: FormData) => {
    let { bodyWeight, totalLifted } = data;
    if (data.unit === 'lbs') {
        bodyWeight /= 2.20462;
        totalLifted /= 2.20462;
    }
    const coeffs = data.gender === 'male' ? maleCoeffs : femaleCoeffs;
    const x = bodyWeight;
    const wilksCoeff = 500 / (coeffs.a + coeffs.b * x + coeffs.c * x**2 + coeffs.d * x**3 + coeffs.e * x**4 + coeffs.f * x**5);
    const wilksScore = totalLifted * wilksCoeff;
    setResults({ wilksScore });
    setFormData(data);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `wilks-score-calculation.${format}`;
    const { gender, bodyWeight, totalLifted, unit } = formData;

    if (format === 'txt') {
      content = `Wilks Score Calculation\n\nInputs:\n- Gender: ${gender}\n- Body Weight: ${bodyWeight} ${unit}\n- Total Lifted: ${totalLifted} ${unit}\n\nResult:\n- Wilks Score: ${results.wilksScore.toFixed(2)}`;
    } else {
       content = `Gender,Body Weight,Unit,Total Lifted,Wilks Score\n${gender},${bodyWeight},${unit},${totalLifted},${results.wilksScore.toFixed(2)}`;
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
    <form onSubmit={handleSubmit(calculateWilks)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Inputs</h3>
        <Controller name="gender" control={control} render={({ field }) => (
            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 gap-4">
                <Label className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><RadioGroupItem value="male" className="mr-2"/>Male</Label>
                <Label className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><RadioGroupItem value="female" className="mr-2"/>Female</Label>
            </RadioGroup>
        )}/>
         <Controller name="unit" control={control} render={({ field }) => (
            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 gap-4">
                <Label className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><RadioGroupItem value="lbs" className="mr-2"/>Pounds (lbs)</Label>
                <Label className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><RadioGroupItem value="kg" className="mr-2"/>Kilograms (kg)</Label>
            </RadioGroup>
        )}/>
        <div><Label>Body Weight</Label><Controller name="bodyWeight" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
        <div><Label>Total Weight Lifted (Squat+Bench+Deadlift)</Label><Controller name="totalLifted" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Calculate Wilks Score</Button>
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
                    <p className="text-sm text-muted-foreground">Wilks Score</p>
                    <p className="text-4xl font-bold my-2">{results.wilksScore.toFixed(2)}</p>
                </CardContent>
            </Card>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter details to calculate your score</p></div>
        )}
      </div>
    </form>
  );
}
