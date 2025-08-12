
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
  feet: z.number().int().min(0, "Feet must be non-negative"),
  inches: z.number().min(0, "Inches must be non-negative"),
});

type FormData = z.infer<typeof formSchema>;

export default function HeightInInchesCalculator() {
  const [result, setResult] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { feet: 5, inches: 10 },
  });

  const calculate = (data: FormData) => {
    const totalInches = data.feet * 12 + data.inches;
    setResult(totalInches);
    setFormData(data);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (result === null || !formData) return;
    
    let content = '';
    const filename = `height-in-inches-calculation.${format}`;
    const { feet, inches } = formData;

    if (format === 'txt') {
      content = `Height in Inches Calculation\n\nInputs:\n- Height: ${feet}' ${inches}"\n\nResult:\n- Total Inches: ${result}"`;
    } else {
       content = `Feet,Inches,Total Inches\n${feet},${inches},${result}`;
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
    <form onSubmit={handleSubmit(calculate)} className="grid md:grid-cols-2 gap-8">
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Enter Height</h3>
        <div className="flex gap-4">
          <div><Label>Feet</Label><Controller name="feet" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />} /></div>
          <div><Label>Inches</Label><Controller name="inches" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
        </div>
        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Convert to Inches</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={result === null}>
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

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Total Height in Inches</h3>
        {result !== null ? (
            <Card>
                <CardContent className="p-6 text-center">
                    <p className="text-4xl font-bold">{result}"</p>
                </CardContent>
            </Card>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter a height to convert</p></div>
        )}
      </div>
    </form>
  );
}
