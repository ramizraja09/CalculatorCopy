
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
  c1: z.number().min(0.1, "Concentration must be positive"),
  v1: z.number().min(0.1, "Volume must be positive"),
  c2: z.number().min(0.1, "Concentration must be positive"),
});

type FormData = z.infer<typeof formSchema>;

export default function DilutionCalculator() {
  const [result, setResult] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { c1: 10, v1: 100, c2: 2 },
  });

  const calculateDilution = (data: FormData) => {
    // Formula: C1 * V1 = C2 * V2
    const v2 = (data.c1 * data.v1) / data.c2;
    const solventVolume = v2 - data.v1;
    setResult({ finalVolume: v2, solventVolume });
    setFormData(data);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!result || !formData) return;

    let content = '';
    const filename = `dilution-calculation.${format}`;
    const { c1, v1, c2 } = formData;

    if (format === 'txt') {
      content = `Dilution Calculation\n\nInputs:\n- Stock Concentration (C1): ${c1}\n- Stock Volume (V1): ${v1}\n- Final Concentration (C2): ${c2}\n\nResult:\n- Solvent to Add: ${result.solventVolume.toFixed(2)}\n- Final Volume (V2): ${result.finalVolume.toFixed(2)}`;
    } else {
      content = `Category,Value\nStock Concentration (C1),${c1}\nStock Volume (V1),${v1}\nFinal Concentration (C2),${c2}\nSolvent to Add,${result.solventVolume.toFixed(2)}\nFinal Volume (V2),${result.finalVolume.toFixed(2)}`;
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
    <form onSubmit={handleSubmit(calculateDilution)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Stock Solution</h3>
        <div><Label>Concentration (C1)</Label><Controller name="c1" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
        <div><Label>Volume (V1)</Label><Controller name="v1" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
        <h3 className="text-xl font-semibold">Final Solution</h3>
        <div><Label>Concentration (C2)</Label><Controller name="c2" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Calculate</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={!result}>
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
        {result ? (
            <Card>
                <CardContent className="p-4 text-center">
                    <p>Add <strong>{result.solventVolume.toFixed(2)}</strong> units of solvent to your initial volume of {control._getWatch('v1')} units to get a final volume of <strong>{result.finalVolume.toFixed(2)}</strong> units.</p>
                </CardContent>
            </Card>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter solution details</p></div>
        )}
      </div>
    </form>
  );
}
