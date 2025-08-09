
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
  age: z.number().int().min(1),
});

type FormData = z.infer<typeof formSchema>;

const zones = [
    { name: "Zone 1: Very Light", percent: "50-60%", color: "bg-gray-400" },
    { name: "Zone 2: Light", percent: "60-70%", color: "bg-blue-400" },
    { name: "Zone 3: Moderate", percent: "70-80%", color: "bg-green-400" },
    { name: "Zone 4: Hard", percent: "80-90%", color: "bg-yellow-400" },
    { name: "Zone 5: Maximum", percent: "90-100%", color: "bg-red-500" },
];

export default function HeartRateZoneCalculator() {
  const [results, setResults] = useState<any>(null);
  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { age: 30 },
  });

  const calculateZones = (data: FormData) => {
    const maxHeartRate = 220 - data.age;
    setResults({ maxHeartRate });
  };

  return (
    <form onSubmit={handleSubmit(calculateZones)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Inputs</h3>
        <div><Label>Age</Label><Controller name="age" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
        <Button type="submit" className="w-full">Calculate Zones</Button>
      </div>

      {/* Results */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Target Heart Rate Zones</h3>
        {results ? (
            <Card>
                <CardContent className="p-4 space-y-2">
                   <p className="text-center text-sm">Max Heart Rate: <span className="font-bold">{results.maxHeartRate} bpm</span></p>
                   {zones.map(zone => {
                       const [min, max] = zone.percent.replace('%', '').split('-').map(Number);
                       const minBpm = Math.round(results.maxHeartRate * (min/100));
                       const maxBpm = Math.round(results.maxHeartRate * (max/100));
                       return (
                         <div key={zone.name} className="flex items-center gap-4 p-2 rounded-md">
                            <div className={`w-4 h-4 rounded-full ${zone.color}`}></div>
                            <div className="flex-1">
                                <p className="font-semibold">{zone.name}</p>
                                <p className="text-sm text-muted-foreground">{zone.percent} of Max HR</p>
                            </div>
                            <p className="font-mono">{minBpm} - {maxBpm} bpm</p>
                         </div>
                       )
                   })}
                </CardContent>
            </Card>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter your age to see heart rate zones</p></div>
        )}
      </div>
    </form>
  );
}
