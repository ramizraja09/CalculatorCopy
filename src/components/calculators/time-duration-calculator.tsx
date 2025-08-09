
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
  startTime: z.string().nonempty("Start time is required"),
  endTime: z.string().nonempty("End time is required"),
});

type FormData = z.infer<typeof formSchema>;

export default function TimeDurationCalculator() {
  const [result, setResult] = useState<string | null>(null);
  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { startTime: '09:30', endTime: '17:45' },
  });

  const calculateDuration = (data: FormData) => {
    const start = new Date(`1970-01-01T${data.startTime}`);
    const end = new Date(`1970-01-01T${data.endTime}`);
    
    let difference = end.getTime() - start.getTime();
    if(difference < 0) {
      difference += 24 * 60 * 60 * 1000; // Add 24 hours if end time is next day
    }
    
    const hours = Math.floor(difference / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

    setResult(`${hours} hours, ${minutes} minutes`);
  };

  return (
    <form onSubmit={handleSubmit(calculateDuration)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Input</h3>
        <div>
          <Label htmlFor="startTime">Start Time</Label>
          <Controller name="startTime" control={control} render={({ field }) => <Input type="time" {...field} />} />
        </div>
        <div>
          <Label htmlFor="endTime">End Time</Label>
          <Controller name="endTime" control={control} render={({ field }) => <Input type="time" {...field} />} />
        </div>
        <Button type="submit" className="w-full">Calculate Duration</Button>
      </div>

      {/* Results */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Result</h3>
        {result ? (
            <Card>
                <CardContent className="p-6 text-center">
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="text-2xl font-bold my-2">{result}</p>
                </CardContent>
            </Card>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter start and end times</p></div>
        )}
      </div>
    </form>
  );
}
