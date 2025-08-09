
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const formSchema = z.object({
  lastPeriodDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" }),
  cycleLength: z.number().int().min(20).max(45),
});

type FormData = z.infer<typeof formSchema>;

export default function OvulationCalculator() {
  const [results, setResults] = useState<any>(null);
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
        <Button type="submit" className="w-full">Calculate Fertile Window</Button>
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
