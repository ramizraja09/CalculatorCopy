
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
} from "@/components/ui/dropdown-menu";
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const formSchema = z.object({
  areaLength: z.number().min(1, 'Length must be positive'),
  areaWidth: z.number().min(1, 'Width must be positive'),
  spacing: z.number().min(1, 'Spacing must be positive'),
  arrangement: z.enum(['square', 'triangular']),
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
      arrangement: 'square',
    },
  });

  const calculateSpacing = (data: FormData) => {
    const { areaLength, areaWidth, spacing, arrangement } = data;
    const lengthInches = areaLength * 12;
    const widthInches = areaWidth * 12;

    let totalPlants = 0;
    if (arrangement === 'square') {
        const plantsPerRow = Math.floor(widthInches / spacing);
        const numberOfRows = Math.floor(lengthInches / spacing);
        totalPlants = plantsPerRow * numberOfRows;
    } else { // Triangular
        const rowHeight = spacing * 0.866; // height of equilateral triangle
        const numberOfRows = Math.floor(lengthInches / rowHeight);
        let plants = 0;
        for (let i = 0; i < numberOfRows; i++) {
            if (i % 2 === 0) { // even rows
                plants += Math.floor(widthInches / spacing);
            } else { // odd rows (offset)
                plants += Math.floor((widthInches - (spacing / 2)) / spacing);
            }
        }
        totalPlants = plants;
    }
    
    setResults({ totalPlants, error: null });
    setFormData(data);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;

    let content = '';
    const filename = `plant-spacing-calculation.${format}`;
    const { areaLength, areaWidth, spacing, arrangement } = formData;

    if (format === 'txt') {
      content = `Plant Spacing Calculation\n\nInputs:\n- Garden Length: ${areaLength} ft\n- Garden Width: ${areaWidth} ft\n- Spacing Between Plants: ${spacing} in\n- Arrangement: ${arrangement}\n\nResult:\n- Total Plants: ${results.totalPlants}`;
    } else {
      content = `Category,Value\nGarden Length (ft),${areaLength}\nGarden Width (ft),${areaWidth}\nSpacing (in),${spacing}\nArrangement,${arrangement}\nTotal Plants,${results.totalPlants}`;
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
        
        <div>
            <Label>Planting Pattern</Label>
            <Controller name="arrangement" control={control} render={({ field }) => (
                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 gap-4">
                    <Label className="p-4 border rounded-md text-center peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><RadioGroupItem value="square" className="mr-2"/>Square</Label>
                    <Label className="p-4 border rounded-md text-center peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><RadioGroupItem value="triangular" className="mr-2"/>Triangular</Label>
                </RadioGroup>
            )}/>
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

    