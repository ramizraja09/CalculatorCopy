
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
  idealHours: z.number().min(1, "Ideal hours must be positive"),
  actualHours: z.number().min(0, "Actual hours must be non-negative"),
  numberOfNights: z.number().int().min(1, "Number of nights must be at least 1"),
}).refine(data => data.idealHours >= data.actualHours, {
    message: "Ideal hours should be greater than or equal to actual hours slept.",
    path: ["idealHours"],
});

type FormData = z.infer<typeof formSchema>;

export default function SleepDebtCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      idealHours: 8,
      actualHours: 6.5,
      numberOfNights: 7,
    },
  });

  const calculateDebt = (data: FormData) => {
    const { idealHours, actualHours, numberOfNights } = data;
    const debtPerHourNight = idealHours - actualHours;
    const totalDebt = debtPerHourNight * numberOfNights;
    
    // Assuming you can recover ~1-2 hours of sleep debt per night. Let's use 1.5 as an average.
    const recoveryNights = totalDebt / 1.5;

    setResults({
      totalDebt: totalDebt.toFixed(1),
      recoveryNights: recoveryNights.toFixed(1),
    });
    setFormData(data);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `sleep-debt-calculation.${format}`;
    const { idealHours, actualHours, numberOfNights } = formData;

    if (format === 'txt') {
      content = `Sleep Debt Calculation\n\nInputs:\n- Ideal Hours per Night: ${idealHours}\n- Actual Hours per Night: ${actualHours}\n- Number of Nights: ${numberOfNights}\n\nResults:\n- Total Sleep Debt: ${results.totalDebt} hours\n- Recommended Recovery Nights: ${results.recoveryNights} nights`;
    } else {
       content = `Ideal Hours,Actual Hours,Number of Nights,Total Debt (hours),Recovery Nights\n${idealHours},${actualHours},${numberOfNights},${results.totalDebt},${results.recoveryNights}`;
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
    <form onSubmit={handleSubmit(calculateDebt)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs Column */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Sleep Details</h3>
        <div><Label>Ideal Hours of Sleep per Night</Label><Controller name="idealHours" control={control} render={({ field }) => <Input type="number" step="0.5" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
        <div><Label>Actual Hours Slept per Night</Label><Controller name="actualHours" control={control} render={({ field }) => <Input type="number" step="0.5" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
        <div><Label>Number of Nights</Label><Controller name="numberOfNights" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
        {errors.idealHours && <p className="text-destructive text-sm mt-1">{errors.idealHours.message}</p>}
        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Calculate Sleep Debt</Button>
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
        <h3 className="text-xl font-semibold">Your Sleep Debt</h3>
        {results ? (
            <div className="space-y-4">
                <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-sm text-muted-foreground">Total Sleep Debt</p>
                        <p className="text-3xl font-bold">{results.totalDebt} hours</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-sm text-muted-foreground">Recommended Recovery Nights</p>
                        <p className="text-3xl font-bold">{results.recoveryNights} nights</p>
                        <p className="text-xs text-muted-foreground">(Approx. extra 1.5h sleep per night)</p>
                    </CardContent>
                </Card>
            </div>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter your sleep details to calculate debt</p></div>
        )}
      </div>
    </form>
  );
}
