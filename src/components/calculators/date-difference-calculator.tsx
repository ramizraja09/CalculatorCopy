
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { differenceInYears, differenceInMonths, differenceInDays, subYears, subMonths } from 'date-fns';

const formSchema = z.object({
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" }),
}).refine(data => new Date(data.endDate) > new Date(data.startDate), {
    message: "End date must be after start date",
    path: ['endDate'],
});

type FormData = z.infer<typeof formSchema>;

export default function DateDifferenceCalculator() {
  const [results, setResults] = useState<any>(null);
  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { startDate: new Date().toISOString().split('T')[0], endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
  });

  const calculateDifference = (data: FormData) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    
    const totalDays = differenceInDays(end, start);
    const years = differenceInYears(end, start);
    const months = differenceInMonths(end, subYears(start, years));
    const days = differenceInDays(end, subMonths(subYears(start, years), months));

    setResults({ years, months, days, totalDays });
  };

  return (
    <form onSubmit={handleSubmit(calculateDifference)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Input</h3>
        <div>
          <Label htmlFor="startDate">Start Date</Label>
          <Controller name="startDate" control={control} render={({ field }) => <Input type="date" {...field} />} />
        </div>
        <div>
          <Label htmlFor="endDate">End Date</Label>
          <Controller name="endDate" control={control} render={({ field }) => <Input type="date" {...field} />} />
          {errors.endDate && <p className="text-destructive text-sm mt-1">{errors.endDate.message}</p>}
        </div>
        <Button type="submit" className="w-full">Calculate Difference</Button>
      </div>

      {/* Results */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Result</h3>
        {results ? (
            <Card>
                <CardContent className="p-6 text-center space-y-4">
                    <div>
                        <p className="text-sm text-muted-foreground">Difference</p>
                        <p className="text-2xl font-bold">{results.years} years, {results.months} months, {results.days} days</p>
                    </div>
                     <div>
                        <p className="text-sm text-muted-foreground">Total Days</p>
                        <p className="text-2xl font-bold">{results.totalDays}</p>
                    </div>
                </CardContent>
            </Card>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter two dates</p></div>
        )}
      </div>
    </form>
  );
}
