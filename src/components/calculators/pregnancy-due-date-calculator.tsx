
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
});

type FormData = z.infer<typeof formSchema>;

export default function PregnancyDueDateCalculator() {
  const [results, setResults] = useState<any>(null);
  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { lastPeriodDate: new Date().toISOString().split('T')[0] },
  });

  const calculateDueDate = (data: FormData) => {
    const lmp = new Date(data.lastPeriodDate);
    // Naegele's rule: LMP + 280 days (40 weeks)
    const dueDate = new Date(lmp.getTime() + 280 * 24 * 60 * 60 * 1000);
    setResults({ dueDate: dueDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) });
  };

  return (
    <form onSubmit={handleSubmit(calculateDueDate)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Inputs</h3>
        <div>
          <Label htmlFor="lastPeriodDate">First Day of Last Menstrual Period</Label>
          <Controller name="lastPeriodDate" control={control} render={({ field }) => <Input type="date" {...field} />} />
          {errors.lastPeriodDate && <p className="text-destructive text-sm mt-1">{errors.lastPeriodDate.message}</p>}
        </div>
        <Button type="submit" className="w-full">Calculate Due Date</Button>
      </div>

      {/* Results */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Results</h3>
        {results ? (
            <Card>
                <CardContent className="p-6 text-center">
                    <p className="text-sm text-muted-foreground">Estimated Due Date</p>
                    <p className="text-4xl font-bold my-2">{results.dueDate}</p>
                </CardContent>
            </Card>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter your LMP to estimate due date</p></div>
        )}
      </div>
    </form>
  );
}
