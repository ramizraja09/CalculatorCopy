
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
  fileSize: z.number().min(0.1),
  fileUnit: z.enum(['KB', 'MB', 'GB', 'TB']),
  speed: z.number().min(0.1),
  speedUnit: z.enum(['kbps', 'mbps', 'gbps']),
});
type FormData = z.infer<typeof formSchema>;

export default function BandwidthCalculator() {
  const [result, setResult] = useState<string | null>(null);

  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { fileSize: 100, fileUnit: 'MB', speed: 100, speedUnit: 'mbps' },
  });

  const calculateTime = (data: FormData) => {
    const sizeInBits = data.fileSize * (1024 ** ['KB', 'MB', 'GB', 'TB'].indexOf(data.fileUnit)) * 8;
    const speedInBps = data.speed * (1000 ** ['kbps', 'mbps', 'gbps'].indexOf(data.speedUnit));
    const totalSeconds = sizeInBits / speedInBps;

    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.round(totalSeconds % 60);
    setResult(`${h}h ${m}m ${s}s`);
  };

  return (
    <form onSubmit={handleSubmit(calculateTime)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Inputs</h3>
        <div>
          <Label>File Size</Label>
          <div className="flex gap-2">
            <Controller name="fileSize" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
            <Controller name="fileUnit" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger><SelectContent>{['KB', 'MB', 'GB', 'TB'].map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent></Select>
            )} />
          </div>
        </div>
        <div>
          <Label>Bandwidth (Speed)</Label>
          <div className="flex gap-2">
            <Controller name="speed" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
            <Controller name="speedUnit" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger><SelectContent>{['kbps', 'mbps', 'gbps'].map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent></Select>
            )} />
          </div>
        </div>
        <Button type="submit" className="w-full">Calculate Time</Button>
      </div>

      {/* Results */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Estimated Download Time</h3>
        {result ? (
            <Card><CardContent className="p-6 text-center"><p className="text-4xl font-bold">{result}</p></CardContent></Card>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter file size and bandwidth</p></div>
        )}
      </div>
    </form>
  );
}
