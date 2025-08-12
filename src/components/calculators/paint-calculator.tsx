
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
  wallArea: z.number().min(1, 'Wall area must be positive'),
  coats: z.number().int().min(1, 'Must have at least one coat'),
  coveragePerGallon: z.number().min(1, 'Coverage must be positive'),
});

type FormData = z.infer<typeof formSchema>;

export default function PaintCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      wallArea: 400,
      coats: 2,
      coveragePerGallon: 350,
    },
  });

  const calculatePaint = (data: FormData) => {
    const { wallArea, coats, coveragePerGallon } = data;
    const totalArea = wallArea * coats;
    const gallonsNeeded = totalArea / coveragePerGallon;

    setResults({
      gallonsNeeded,
      totalArea,
      error: null,
    });
    setFormData(data);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;

    let content = '';
    const filename = `paint-calculation.${format}`;
    const { wallArea, coats, coveragePerGallon } = formData;

    if (format === 'txt') {
      content = `Paint Calculation\n\nInputs:\n- Wall Area: ${wallArea} sq. ft.\n- Coats: ${coats}\n- Coverage per Gallon: ${coveragePerGallon} sq. ft.\n\nResult:\n- Gallons Needed: ${results.gallonsNeeded.toFixed(2)}\n- Total Area to Cover: ${results.totalArea.toFixed(2)} sq. ft.`;
    } else {
      content = `Category,Value\nWall Area (sq. ft.),${wallArea}\nCoats,${coats}\nCoverage per Gallon (sq. ft.),${coveragePerGallon}\nGallons Needed,${results.gallonsNeeded.toFixed(2)}\nTotal Area to Cover (sq. ft.),${results.totalArea.toFixed(2)}`;
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
    <form onSubmit={handleSubmit(calculatePaint)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs Column */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Inputs</h3>
        
        <div>
          <Label htmlFor="wallArea">Total Wall Area to Paint (sq. ft.)</Label>
          <Controller name="wallArea" control={control} render={({ field }) => <Input id="wallArea" type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
          {errors.wallArea && <p className="text-destructive text-sm mt-1">{errors.wallArea.message}</p>}
        </div>

        <div>
          <Label htmlFor="coats">Number of Coats</Label>
          <Controller name="coats" control={control} render={({ field }) => <Input id="coats" type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} />
          {errors.coats && <p className="text-destructive text-sm mt-1">{errors.coats.message}</p>}
        </div>

        <div>
          <Label htmlFor="coveragePerGallon">Paint Coverage (sq. ft. per gallon)</Label>
          <Controller name="coveragePerGallon" control={control} render={({ field }) => <Input id="coveragePerGallon" type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
          {errors.coveragePerGallon && <p className="text-destructive text-sm mt-1">{errors.coveragePerGallon.message}</p>}
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
                <div className="space-y-4">
                    <Card>
                        <CardContent className="p-4 text-center">
                            <p className="text-sm text-muted-foreground">Paint Needed</p>
                            <p className="text-3xl font-bold">{results.gallonsNeeded.toFixed(2)} gallons</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                             <p className="text-muted-foreground">Total Area to Cover</p>
                             <p className="font-semibold">{results.totalArea.toFixed(2)} sq. ft.</p>
                        </CardContent>
                    </Card>
                </div>
            )
        ) : (
             <div className="flex items-center justify-center h-60 bg-muted/50 rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">Enter your project details to estimate paint needed</p>
            </div>
        )}
      </div>
    </form>
  );
}
