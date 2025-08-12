"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download } from 'lucide-react';

const formSchema = z.object({
  weightLbs: z.number().min(1),
  exerciseMinutes: z.number().min(0),
});

type FormData = z.infer<typeof formSchema>;

export default function WaterIntakeCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { weightLbs: 160, exerciseMinutes: 30 },
  });

  const calculateWaterIntake = (data: FormData) => {
    // General formula: weight (lbs) / 2.2 * 30-35 ml. We'll use an average and add for exercise.
    // A simpler common formula is weight in lbs * 2/3 for ounces
    const baseOunces = data.weightLbs * (2/3);
    const exerciseOunces = (data.exerciseMinutes / 30) * 12;
    const totalOunces = baseOunces + exerciseOunces;
    setResults({ totalOunces });
    setFormData(data);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `water-intake-calculation.${format}`;
    const { weightLbs, exerciseMinutes } = formData;

    if (format === 'txt') {
      content = `Water Intake Calculation\n\nInputs:\n- Weight: ${weightLbs} lbs\n- Exercise: ${exerciseMinutes} mins\n\nResult:\n- Recommended Intake: ${results.totalOunces.toFixed(0)} oz`;
    } else {
       content = `Weight (lbs),Exercise (mins),Recommended Intake (oz)\n${weightLbs},${exerciseMinutes},${results.totalOunces.toFixed(0)}`;
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
    <form onSubmit={handleSubmit(calculateWaterIntake)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Inputs</h3>
        <div><Label>Weight (lbs)</Label><Controller name="weightLbs" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
        <div><Label>Daily Exercise (minutes)</Label><Controller name="exerciseMinutes" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Calculate Intake</Button>
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
        <h3 className="text-xl font-semibold">Recommended Daily Intake</h3>
        {results ? (
            <Card>
                <CardContent className="p-6 text-center">
                    <p className="text-sm text-muted-foreground">Total Water Needed</p>
                    <p className="text-4xl font-bold my-2">{results.totalOunces.toFixed(0)} oz</p>
                    <p className="text-muted-foreground">({(results.totalOunces / 8).toFixed(1)} glasses or {(results.totalOunces * 0.0295735).toFixed(1)} liters)</p>
                </CardContent>
            </Card>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter details to estimate water needs</p></div>
        )}
      </div>
    </form>
  );
}
