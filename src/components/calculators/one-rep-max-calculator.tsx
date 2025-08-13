
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
  weight: z.number().min(1, "Weight must be positive"),
  reps: z.number().int().min(1, "Reps must be at least 1").max(10, "Reps should be 10 or less for accuracy"),
});

type FormData = z.infer<typeof formSchema>;

export default function OneRepMaxCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { weight: 135, reps: 5 },
  });

  const calculate1rm = (data: FormData) => {
    // Brzycki formula
    const oneRepMax = data.weight * (36 / (37 - data.reps));
    setResults({ oneRepMax });
    setFormData(data);
  };

  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `1rm-calculation.${format}`;
    const { weight, reps } = formData;

    if (format === 'txt') {
      content = `1RM Calculation\n\nInputs:\n- Weight Lifted: ${weight}\n- Reps: ${reps}\n\nResult:\n- Estimated 1RM: ${results.oneRepMax.toFixed(1)}`;
    } else {
       content = `Weight,Reps,Estimated 1RM\n${weight},${reps},${results.oneRepMax.toFixed(1)}`;
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
    <form onSubmit={handleSubmit(calculate1rm)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Inputs</h3>
        <div>
          <Label htmlFor="weight">Weight Lifted</Label>
          <Controller name="weight" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
          {errors.weight && <p className="text-destructive text-sm mt-1">{errors.weight.message}</p>}
        </div>
        <div>
          <Label htmlFor="reps">Repetitions</Label>
          <Controller name="reps" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))} />} />
          {errors.reps && <p className="text-destructive text-sm mt-1">{errors.reps.message}</p>}
        </div>
        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Calculate 1RM</Button>
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
                    <p className="text-sm text-muted-foreground">Estimated One-Rep Max</p>
                    <p className="text-4xl font-bold my-2">{results.oneRepMax.toFixed(1)}</p>
                </CardContent>
            </Card>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter details to estimate your 1RM</p></div>
        )}
      </div>
    </form>
  );
}
