
"use client";

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const formSchema = z.object({
    distance: z.number().min(0),
    distanceUnit: z.enum(['miles', 'km']),
    timeHours: z.number().min(0),
    timeMinutes: z.number().min(0),
    timeSeconds: z.number().min(0),
});

type FormData = z.infer<typeof formSchema>;

export default function PaceCalculator() {
  const [results, setResults] = useState<any>(null);
  const { control, handleSubmit, watch } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { distance: 5, distanceUnit: 'km', timeHours: 0, timeMinutes: 25, timeSeconds: 0 },
  });
  
  const formData = watch();

  useEffect(() => {
    const { distance, distanceUnit, timeHours, timeMinutes, timeSeconds } = formData;
    if (distance > 0 && (timeHours > 0 || timeMinutes > 0 || timeSeconds > 0)) {
        const totalTimeSeconds = (timeHours * 3600) + (timeMinutes * 60) + timeSeconds;
        
        const pacePerMile = distanceUnit === 'miles' ? totalTimeSeconds / distance : (totalTimeSeconds / distance) * 1.60934;
        const pacePerKm = distanceUnit === 'km' ? totalTimeSeconds / distance : (totalTimeSeconds / distance) / 1.60934;

        const formatPace = (seconds: number) => {
            if (!isFinite(seconds) || seconds <= 0) return '00:00';
            const min = Math.floor(seconds / 60);
            const sec = Math.round(seconds % 60);
            return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
        };

        setResults({
            pacePerMile: formatPace(pacePerMile),
            pacePerKm: formatPace(pacePerKm),
        });
    } else {
        setResults(null);
    }
  }, [formData]);

  const onSubmit = () => {};

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Inputs</h3>
        <div>
          <Label>Distance</Label>
          <div className="flex gap-2">
            <Controller name="distance" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
            <Controller name="distanceUnit" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger className="w-[120px]"><SelectValue/></SelectTrigger>
                    <SelectContent><SelectItem value="miles">Miles</SelectItem><SelectItem value="km">KM</SelectItem></SelectContent>
                </Select>
            )} />
          </div>
        </div>
        <div>
          <Label>Time</Label>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label htmlFor="timeHours" className="text-xs text-muted-foreground">Hours</Label>
              <Controller name="timeHours" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} />
            </div>
            <div>
              <Label htmlFor="timeMinutes" className="text-xs text-muted-foreground">Minutes</Label>
              <Controller name="timeMinutes" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} />
            </div>
            <div>
              <Label htmlFor="timeSeconds" className="text-xs text-muted-foreground">Seconds</Label>
              <Controller name="timeSeconds" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} />
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Pace</h3>
        {results ? (
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground">per Mile</p>
                  <p className="text-3xl font-bold">{results.pacePerMile}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground">per KM</p>
                  <p className="text-3xl font-bold">{results.pacePerKm}</p>
                </CardContent>
              </Card>
            </div>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter distance and time to see your pace</p></div>
        )}
      </div>
    </form>
  );
}
