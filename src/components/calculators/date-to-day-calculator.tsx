
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

const formSchema = z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" }),
});

type FormData = z.infer<typeof formSchema>;

export default function DateToDayCalculator() {
  const [result, setResult] = useState<string | null>(null);
  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { date: new Date().toISOString().split('T')[0] },
  });

  const getDay = (data: FormData) => {
    const date = new Date(data.date);
    const dayOfWeek = format(date, 'EEEE');
    setResult(dayOfWeek);
  };

  return (
    <form onSubmit={handleSubmit(getDay)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Input</h3>
        <div>
          <Label htmlFor="date">Select a Date</Label>
          <Controller name="date" control={control} render={({ field }) => <Input type="date" {...field} />} />
          {errors.date && <p className="text-destructive text-sm mt-1">{errors.date.message}</p>}
        </div>
        <Button type="submit" className="w-full">Find Day of Week</Button>
      </div>

      {/* Results */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Result</h3>
        {result ? (
            <Card>
                <CardContent className="p-6 text-center">
                    <p className="text-sm text-muted-foreground">That date is a</p>
                    <p className="text-4xl font-bold my-2">{result}</p>
                </CardContent>
            </Card>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Select a date</p></div>
        )}
      </div>
    </form>
  );
}
