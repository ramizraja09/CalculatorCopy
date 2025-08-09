
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
  roomLength: z.number().min(1),
  roomWidth: z.number().min(1),
  roomHeight: z.number().min(1),
  rollWidth: z.number().min(1),
  rollLength: z.number().min(1),
});
type FormData = z.infer<typeof formSchema>;

export default function WallpaperCalculator() {
  const [result, setResult] = useState<number | null>(null);

  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { roomLength: 12, roomWidth: 10, roomHeight: 8, rollWidth: 20.5 / 12, rollLength: 33 },
  });

  const calculateWallpaper = (data: FormData) => {
    const perimeter = 2 * (data.roomLength + data.roomWidth);
    const stripsNeeded = Math.ceil(perimeter / data.rollWidth);
    const stripsPerRoll = Math.floor(data.rollLength / data.roomHeight);
    const rollsNeeded = Math.ceil(stripsNeeded / stripsPerRoll);
    setResult(rollsNeeded);
  };

  return (
    <form onSubmit={handleSubmit(calculateWallpaper)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Room Dimensions (feet)</h3>
        <div><Label>Length</Label><Controller name="roomLength" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
        <div><Label>Width</Label><Controller name="roomWidth" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
        <div><Label>Height</Label><Controller name="roomHeight" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
        <h3 className="text-xl font-semibold">Wallpaper Roll (feet)</h3>
        <div><Label>Width</Label><Controller name="rollWidth" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
        <div><Label>Length</Label><Controller name="rollLength" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
        <Button type="submit" className="w-full">Calculate</Button>
      </div>

      {/* Results */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Rolls Needed</h3>
        {result !== null ? (
            <Card><CardContent className="p-6 text-center"><p className="text-4xl font-bold">{result}</p><p className="text-muted-foreground">rolls (approx.)</p></CardContent></Card>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter dimensions to calculate</p></div>
        )}
      </div>
    </form>
  );
}
