
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { differenceInDays, format, addYears } from 'date-fns';

const formSchema = z.object({
  birthDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" }),
});

type FormData = z.infer<typeof formSchema>;

export default function BirthdayCalculator() {
  const [results, setResults] = useState<any>(null);
  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { birthDate: '1990-01-01' },
  });

  const calculateBirthday = (data: FormData) => {
    const birthDate = new Date(data.birthDate);
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const dayOfWeek = format(birthDate, 'EEEE');
    
    let nextBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
    if (nextBirthday < today) {
        nextBirthday = addYears(nextBirthday, 1);
    }
    
    const daysUntil = differenceInDays(nextBirthday, today);

    setResults({ dayOfWeek, daysUntil });
  };

  return (
    <form onSubmit={handleSubmit(calculateBirthday)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Input</h3>
        <div>
          <Label htmlFor="birthDate">Date of Birth</Label>
          <Controller name="birthDate" control={control} render={({ field }) => <Input type="date" {...field} />} />
          {errors.birthDate && <p className="text-destructive text-sm mt-1">{errors.birthDate.message}</p>}
        </div>
        <Button type="submit" className="w-full">Calculate</Button>
      </div>

      {/* Results */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Result</h3>
        {results ? (
            <Card>
                <CardContent className="p-6 text-center space-y-4">
                    <div>
                        <p className="text-sm text-muted-foreground">You were born on a</p>
                        <p className="text-2xl font-bold">{results.dayOfWeek}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Days until next birthday</p>
                        <p className="text-2xl font-bold">{results.daysUntil}</p>
                    </div>
                </CardContent>
            </Card>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter your date of birth</p></div>
        )}
      </div>
    </form>
  );
}
