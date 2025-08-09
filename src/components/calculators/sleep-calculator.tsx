
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
  wakeUpTime: z.string().nonempty("Please select a time"),
});

type FormData = z.infer<typeof formSchema>;

export default function SleepCalculator() {
  const [results, setResults] = useState<any>(null);
  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { wakeUpTime: '07:00' },
  });

  const calculateBedtimes = (data: FormData) => {
    const [hours, minutes] = data.wakeUpTime.split(':').map(Number);
    const wakeUpDate = new Date();
    wakeUpDate.setHours(hours, minutes, 0, 0);

    const bedtimes = [];
    // Calculate based on 90-minute sleep cycles, plus ~15 mins to fall asleep
    for (let i = 6; i > 2; i--) { // For 4 to 6 cycles
        const bedtime = new Date(wakeUpDate.getTime() - (i * 90 + 15) * 60000);
        bedtimes.push(bedtime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    }

    setResults({ bedtimes });
  };

  return (
    <form onSubmit={handleSubmit(calculateBedtimes)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">I want to wake up at...</h3>
        <div>
          <Label htmlFor="wakeUpTime">Wake Up Time</Label>
          <Controller name="wakeUpTime" control={control} render={({ field }) => <Input type="time" {...field} />} />
          {errors.wakeUpTime && <p className="text-destructive text-sm mt-1">{errors.wakeUpTime.message}</p>}
        </div>
        <Button type="submit" className="w-full">Calculate Bedtimes</Button>
      </div>

      {/* Results */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Go to bed at one of these times:</h3>
        {results ? (
            <Card>
                <CardContent className="p-4">
                    <p className="text-sm text-center text-muted-foreground mb-4">To feel refreshed, you should try to wake up at the end of a 90-minute sleep cycle.</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
                        {results.bedtimes.map((time: string, index: number) => (
                             <div key={index} className="p-2 border rounded-md">
                                <p className="font-bold text-lg">{time}</p>
                                <p className="text-xs text-muted-foreground">{6 - index} cycles</p>
                             </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter a wake up time to see suggested bedtimes.</p></div>
        )}
      </div>
    </form>
  );
}
