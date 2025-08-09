
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
  birthDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" }),
});

type FormData = z.infer<typeof formSchema>;

export default function AgeCalculator() {
  const [results, setResults] = useState<any>(null);
  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { birthDate: '1990-01-01' },
  });

  const calculateAge = (data: FormData) => {
    const today = new Date();
    const birthDate = new Date(data.birthDate);
    
    const years = differenceInYears(today, birthDate);
    const months = differenceInMonths(today, subYears(birthDate, years));
    const days = differenceInDays(today, subMonths(subYears(birthDate, years), months));

    setResults({ years, months, days });
  };

  return (
    <form onSubmit={handleSubmit(calculateAge)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Input</h3>
        <div>
          <Label htmlFor="birthDate">Date of Birth</Label>
          <Controller name="birthDate" control={control} render={({ field }) => <Input type="date" {...field} />} />
          {errors.birthDate && <p className="text-destructive text-sm mt-1">{errors.birthDate.message}</p>}
        </div>
        <Button type="submit" className="w-full">Calculate Age</Button>
      </div>

      {/* Results */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Result</h3>
        {results ? (
            <Card>
                <CardContent className="p-6 text-center">
                    <p className="text-sm text-muted-foreground">Your Age</p>
                    <p className="text-2xl font-bold my-2">{results.years} years, {results.months} months, {results.days} days</p>
                </CardContent>
            </Card>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter your date of birth</p></div>
        )}
      </div>
    </form>
  );
}
