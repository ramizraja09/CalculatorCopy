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
  lastPeriodDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" }),
  cycleLength: z.number().int().min(20).max(45),
});

type FormData = z.infer<typeof formSchema>;

export default function OvulationCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { lastPeriodDate: new Date().toISOString().split('T')[0], cycleLength: 28 },
  });

  const calculateOvulation = (data: FormData) => {
    const lmp = new Date(data.lastPeriodDate);
    const ovulationDay = new Date(lmp.getTime());
    ovulationDay.setDate(lmp.getDate() + data.cycleLength - 14);

    const fertileStart = new Date(ovulationDay.getTime());
    fertileStart.setDate(ovulationDay.getDate() - 5);

    const fertileEnd = new Date(ovulationDay.getTime());
    fertileEnd.setDate(ovulationDay.getDate() + 1);

    const formatDate = (date: Date) => date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

    setResults({
        fertileWindow: `${formatDate(fertileStart)} - ${formatDate(fertileEnd)}`,
    });
    setFormData(data);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `ovulation-calculation.${format}`;
    const { lastPeriodDate, cycleLength } = formData;

    if (format === 'txt') {
      content = `Ovulation Calculation\n\nInputs:\n- Last Period Start: ${lastPeriodDate}\n- Cycle Length: ${cycleLength} days\n\nResult:\n- Estimated Fertile Window: ${results.fertileWindow}`;
    } else {
       content = `Last Period Date,Cycle Length,Fertile Window\n${lastPeriodDate},${cycleLength},"${results.fertileWindow}"`;
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
    <form onSubmit={handleSubmit(calculateOvulation)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Inputs</h3>
        <div>
          <Label htmlFor="lastPeriodDate">First Day of Last Menstrual Period</Label>
          <Controller name="lastPeriodDate" control={control} render={({ field }) => <Input type="date" {...field} />} />
          {errors.lastPeriodDate && <p className="text-destructive text-sm mt-1">{errors.lastPeriodDate.message}</p>}
        </div>
         <div>
          <Label htmlFor="cycleLength">Average Cycle Length (days)</Label>
          <Controller name="cycleLength" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} />
          {errors.cycleLength && <p className="text-destructive text-sm mt-1">{errors.cycleLength.message}</p>}
        </div>
        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Calculate Fertile Window</Button>
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
                    <p className="text-sm text-muted-foreground">Estimated Fertile Window</p>
                    <p className="text-4xl font-bold my-2">{results.fertileWindow}</p>
                </CardContent>
            </Card>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter your details to estimate fertile window</p></div>
        )}
      </div>
    </form>
  );
}
