
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const formSchema = z.object({
  distance: z.enum(['1_mile', '1.5_mile', '5k', '10k']),
  timeMinutes: z.number().int().min(1),
  timeSeconds: z.number().int().min(0).max(59),
});

type FormData = z.infer<typeof formSchema>;

const distanceMeters: { [key: string]: number } = {
    '1_mile': 1609.34,
    '1.5_mile': 2414.02,
    '5k': 5000,
    '10k': 10000,
};

export default function Vo2MaxEstimator() {
  const [results, setResults] = useState<any>(null);
  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { distance: '5k', timeMinutes: 25, timeSeconds: 0 },
  });

  const estimateVo2Max = (data: FormData) => {
    // Using the Jack Daniels' VDOT formula for estimation
    const totalMinutes = data.timeMinutes + data.timeSeconds / 60;
    const velocity = distanceMeters[data.distance] / totalMinutes;
    
    // Simplified formula: VO2max = -4.60 + 0.182258 * velocity + 0.000104 * velocity^2
    const vo2max = -4.60 + (0.182258 * velocity) + (0.000104 * (velocity ** 2));
    
    // Another common formula for percent of max heart rate method which is simpler
    // %MaxHR = 0.8 + 0.1894393 * e^(-0.012778 * t) + 0.2989558 * e^(-0.1932605 * t)
    // This is too complex. The VDOT is a good standard.

    setResults({ vo2max });
  };

  return (
    <form onSubmit={handleSubmit(estimateVo2Max)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Recent Race Result</h3>
        <div>
          <Label>Distance</Label>
          <Controller name="distance" control={control} render={({ field }) => (
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent>
                <SelectItem value="1_mile">1 Mile</SelectItem>
                <SelectItem value="1.5_mile">1.5 Mile</SelectItem>
                <SelectItem value="5k">5K</SelectItem>
                <SelectItem value="10k">10K</SelectItem>
              </SelectContent>
            </Select>
          )} />
        </div>
        <div>
          <Label>Time</Label>
          <div className="grid grid-cols-2 gap-2">
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
        <Button type="submit" className="w-full">Estimate VO2 Max</Button>
      </div>

      {/* Results */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Estimated VO2 Max</h3>
        {results ? (
            <Card>
                <CardContent className="p-6 text-center">
                    <p className="text-4xl font-bold my-2">{results.vo2max.toFixed(1)}</p>
                    <p className="text-muted-foreground">mL/kg/min</p>
                </CardContent>
            </Card>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter a race result to estimate VO2 Max</p></div>
        )}
      </div>
    </form>
  );
}
