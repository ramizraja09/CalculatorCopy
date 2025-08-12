"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// This is based on the older PointsPlus system for educational purposes, as the current systems are proprietary.
const formSchema = z.object({
  protein: z.number().min(0),
  carbs: z.number().min(0),
  fat: z.number().min(0),
  fiber: z.number().min(0),
});

type FormData = z.infer<typeof formSchema>;

export default function WeightWatchersPointsCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { protein: 10, carbs: 25, fat: 8, fiber: 5 },
  });

  const calculatePoints = (data: FormData) => {
    // Using the legacy "PointsPlus" formula: (Protein / 10.9) + (Carbs / 9.2) + (Fat / 3.9) - (Fiber / 12.5)
    const points = (data.protein / 10.9) + (data.carbs / 9.2) + (data.fat / 3.9) - (data.fiber / 12.5);
    setResults({ points: Math.max(0, Math.round(points)) });
    setFormData(data);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `ww-points-calculation.${format}`;
    const { protein, carbs, fat, fiber } = formData;

    if (format === 'txt') {
      content = `WW Points Calculation\n\nInputs:\n- Protein: ${protein}g\n- Carbs: ${carbs}g\n- Fat: ${fat}g\n- Fiber: ${fiber}g\n\nResult:\n- Estimated PointsPlus: ${results.points}`;
    } else {
       content = `Protein(g),Carbs(g),Fat(g),Fiber(g),PointsPlus\n${protein},${carbs},${fat},${fiber},${results.points}`;
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
    <form onSubmit={handleSubmit(calculatePoints)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Nutritional Information (grams)</h3>
        <div><Label>Protein</Label><Controller name="protein" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
        <div><Label>Carbohydrates</Label><Controller name="carbs" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
        <div><Label>Fat</Label><Controller name="fat" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
        <div><Label>Fiber</Label><Controller name="fiber" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Calculate Points</Button>
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
        <h3 className="text-xl font-semibold">Estimated Points</h3>
        {results ? (
            <Card>
                <CardContent className="p-6 text-center">
                    <p className="text-4xl font-bold my-2">{results.points}</p>
                    <p className="text-muted-foreground">PointsPlus Value</p>
                </CardContent>
            </Card>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter nutritional info to estimate points</p></div>
        )}
        <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Disclaimer</AlertTitle>
            <AlertDescription className="text-xs">
              This calculator uses a legacy Weight Watchers formula (PointsPlus) for educational purposes only. It is not affiliated with WW International, Inc. and does not reflect their current, proprietary point systems.
            </AlertDescription>
        </Alert>
      </div>
    </form>
  );
}
