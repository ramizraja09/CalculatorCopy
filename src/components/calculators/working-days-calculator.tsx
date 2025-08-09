
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { isWeekend, differenceInDays, addDays } from 'date-fns';

const formSchema = z.object({
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" }),
}).refine(data => new Date(data.endDate) >= new Date(data.startDate), {
    message: "End date must be on or after start date",
    path: ['endDate'],
});

type FormData = z.infer<typeof formSchema>;

export default function WorkingDaysCalculator() {
  const [result, setResult] = useState<number | null>(null);
  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { startDate: new Date().toISOString().split('T')[0], endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
  });

  const calculateWorkingDays = (data: FormData) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    const totalDays = differenceInDays(end, start) + 1;
    let workingDays = 0;
    for (let i = 0; i < totalDays; i++) {
        if (!isWeekend(addDays(start, i))) {
            workingDays++;
        }
    }
    setResult(workingDays);
  };

  return (
    <form onSubmit={handleSubmit(calculateWorkingDays)} className="grid md:grid-cols-2 gap-8">
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
        <Button type="submit" className="w-full">Calculate Working Days</Button>
      </div>
      {/* Results */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Result</h3>
        {result !== null ? (
            <Card>
                <CardContent className="p-6 text-center">
                    <p className="text-sm text-muted-foreground">Number of Working Days</p>
                    <p className="text-4xl font-bold my-2">{result}</p>
                </CardContent>
            </Card>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter a date range</p></div>
        )}
      </div>
    </form>
  );
}
