
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
  length: z.number().min(0.1, 'Length must be positive'),
  width: z.number().min(0.1, 'Width must be positive'),
  thickness: z.number().min(0.1, 'Thickness must be positive'),
});

type FormData = z.infer<typeof formSchema>;

export default function ConcreteCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      length: 10,
      width: 10,
      thickness: 4,
    },
  });

  const calculateConcrete = (data: FormData) => {
    const { length, width, thickness } = data;
    const volumeFeet = length * width * (thickness / 12);
    const volumeYards = volumeFeet / 27;

    setResults({
      volumeYards,
      volumeFeet,
      error: null,
    });
    setFormData(data);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;

    let content = '';
    const filename = `concrete-calculation.${format}`;
    const { length, width, thickness } = formData;

    if (format === 'txt') {
      content = `Concrete Calculation\n\nInputs:\n- Length: ${length} ft\n- Width: ${width} ft\n- Thickness: ${thickness} in\n\nResult:\n- Concrete Needed: ${results.volumeYards.toFixed(2)} yd³\n- Equivalent in Cubic Feet: ${results.volumeFeet.toFixed(2)} ft³`;
    } else {
      content = `Category,Value\nLength (ft),${length}\nWidth (ft),${width}\nThickness (in),${thickness}\nConcrete Needed (yd³),${results.volumeYards.toFixed(2)}\nEquivalent Cubic Feet (ft³),${results.volumeFeet.toFixed(2)}`;
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
    <form onSubmit={handleSubmit(calculateConcrete)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs Column */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Slab Dimensions</h3>
        
        <div>
          <Label htmlFor="length">Length (feet)</Label>
          <Controller name="length" control={control} render={({ field }) => <Input id="length" type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
          {errors.length && <p className="text-destructive text-sm mt-1">{errors.length.message}</p>}
        </div>

        <div>
          <Label htmlFor="width">Width (feet)</Label>
          <Controller name="width" control={control} render={({ field }) => <Input id="width" type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
          {errors.width && <p className="text-destructive text-sm mt-1">{errors.width.message}</p>}
        </div>

        <div>
          <Label htmlFor="thickness">Thickness (inches)</Label>
          <Controller name="thickness" control={control} render={({ field }) => <Input id="thickness" type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
          {errors.thickness && <p className="text-destructive text-sm mt-1">{errors.thickness.message}</p>}
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
                            <p className="text-sm text-muted-foreground">Concrete Needed</p>
                            <p className="text-3xl font-bold">{results.volumeYards.toFixed(2)} yd³</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                             <p className="text-muted-foreground">Equivalent in Cubic Feet</p>
                             <p className="font-semibold">{results.volumeFeet.toFixed(2)} ft³</p>
                        </CardContent>
                    </Card>
                </div>
            )
        ) : (
             <div className="flex items-center justify-center h-60 bg-muted/50 rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">Enter dimensions to estimate concrete needed</p>
            </div>
        )}
      </div>
    </form>
  );
}
