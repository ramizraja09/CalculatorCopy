
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
  distance: z.number().min(0.1, 'Distance must be positive'),
  speed: z.number().min(0.1, 'Speed must be positive'),
});

type FormData = z.infer<typeof formSchema>;

export default function TravelTimeCalculator() {
  const [results, setResults] = useState<any>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      distance: 100,
      speed: 60,
    },
  });

  const calculateTravelTime = (data: FormData) => {
    const { distance, speed } = data;
    const timeHours = distance / speed;
    const hours = Math.floor(timeHours);
    const minutes = Math.round((timeHours - hours) * 60);

    setResults({
      hours,
      minutes,
      totalHours: timeHours,
      error: null,
    });
  };

  return (
    <form onSubmit={handleSubmit(calculateTravelTime)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs Column */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Inputs</h3>
        
        <div>
          <Label htmlFor="distance">Distance (miles)</Label>
          <Controller name="distance" control={control} render={({ field }) => <Input id="distance" type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
          {errors.distance && <p className="text-destructive text-sm mt-1">{errors.distance.message}</p>}
        </div>

        <div>
          <Label htmlFor="speed">Average Speed (mph)</Label>
          <Controller name="speed" control={control} render={({ field }) => <Input id="speed" type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
          {errors.speed && <p className="text-destructive text-sm mt-1">{errors.speed.message}</p>}
        </div>
        
        <Button type="submit" className="w-full">Calculate</Button>
      </div>

      {/* Results Column */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Results</h3>
        {results ? (
            results.error ? (
                <Card className="flex items-center justify-center h-60 bg-muted/50 border-dashed">
                    <p className="text-destructive">{results.error}</p>
                </Card>
            ) : (
                <div className="space-y-4">
                    <Card>
                        <CardContent className="p-4 text-center">
                            <p className="text-sm text-muted-foreground">Estimated Travel Time</p>
                            <p className="text-3xl font-bold">{results.hours}h {results.minutes}m</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                             <p className="text-muted-foreground">Total Time in Hours</p>
                             <p className="font-semibold">{results.totalHours.toFixed(2)} hours</p>
                        </CardContent>
                    </Card>
                </div>
            )
        ) : (
             <div className="flex items-center justify-center h-60 bg-muted/50 rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">Enter distance and speed to estimate travel time</p>
            </div>
        )}
      </div>
    </form>
  );
}
