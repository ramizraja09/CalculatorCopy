
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const formSchema = z.object({
  areaLength: z.number().min(1, 'Length must be positive'),
  areaWidth: z.number().min(1, 'Width must be positive'),
  spacing: z.number().min(1, 'Spacing must be positive'),
});

type FormData = z.infer<typeof formSchema>;

export default function PlantSpacingCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      areaLength: 10,
      areaWidth: 5,
      spacing: 12,
    },
  });

  const calculateSpacing = (data: FormData) => {
    const { areaLength, areaWidth, spacing } = data;
    const areaSqInches = (areaLength * 12) * (areaWidth * 12);
    const plantsPerRow = Math.floor((areaWidth * 12) / spacing);
    const numberOfRows = Math.floor((areaLength * 12) / spacing);
    const totalPlants = plantsPerRow * numberOfRows;
    
    setResults({ totalPlants, error: null });
    setFormData(data);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;

    let content = '';
    const filename = `plant-spacing-calculation.${format}`;
    const { areaLength, areaWidth, spacing } = formData;

    if (format === 'txt') {
      content = `Plant Spacing Calculation\n\nInputs:\n- Garden Length: ${areaLength} ft\n- Garden Width: ${areaWidth} ft\n- Spacing Between Plants: ${spacing} in\n\nResult:\n- Total Plants: ${results.totalPlants}`;
    } else {
      content = `Category,Value\nGarden Length (ft),${areaLength}\nGarden Width (ft),${areaWidth}\nSpacing (in),${spacing}\nTotal Plants,${results.totalPlants}`;
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
    <form onSubmit={handleSubmit(calculateSpacing)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs Column */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Inputs</h3>
        
        <div>
          <Label htmlFor="areaLength">Garden Length (feet)</Label>
          <Controller name="areaLength" control={control} render={({ field }) => <Input id="areaLength" type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
          {errors.areaLength && <p className="text-destructive text-sm mt-1">{errors.areaLength.message}</p>}
        </div>

        <div>
          <Label htmlFor="areaWidth">Garden Width (feet)</Label>
          <Controller name="areaWidth" control={control} render={({ field }) => <Input id="areaWidth" type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
          {errors.areaWidth && <p className="text-destructive text-sm mt-1">{errors.areaWidth.message}</p>}
        </div>

        <div>
          <Label htmlFor="spacing">Spacing Between Plants (inches)</Label>
          <Controller name="spacing" control={control} render={({ field }) => <Input id="spacing" type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
          {errors.spacing && <p className="text-destructive text-sm mt-1">{errors.spacing.message}</p>}
        </div>
        
        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Calculate</Button>
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

      {/* Results Column */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Results</h3>
        {results ? (
            results.error ? (
                <Card className="flex items-center justify-center h-60 bg-muted/50 border-dashed">
                    <p className="text-destructive">{results.error}</p>
                </Card>
            ) : (
                <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-sm text-muted-foreground">Total Plants</p>
                        <p className="text-3xl font-bold">{results.totalPlants}</p>
                        <p className="text-sm text-muted-foreground mt-2">You can fit this many plants in your garden area.</p>
                    </CardContent>
                </Card>
            )
        ) : (
             <div className="flex items-center justify-center h-60 bg-muted/50 rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">Enter your garden details to calculate plant count</p>
            </div>
        )}
      </div>
    </form>
  );
}
