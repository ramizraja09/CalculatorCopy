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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download } from 'lucide-react';

const formSchema = z.object({
  distance: z.number().min(0.1),
  distanceUnit: z.enum(['miles', 'km']),
  timeHours: z.number().min(0),
  timeMinutes: z.number().min(0),
  timeSeconds: z.number().min(0),
});

type FormData = z.infer<typeof formSchema>;

// Riegel's endurance model constant
const RIEGEL_EXPONENT = 1.06;

const distancesKm = {
  '5k': 5,
  '10k': 10,
  'half-marathon': 21.0975,
  'marathon': 42.195,
};

export default function RunningTimePredictor() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { distance: 5, distanceUnit: 'km', timeHours: 0, timeMinutes: 25, timeSeconds: 0 },
  });

  const formatTime = (totalSeconds: number) => {
    if (!isFinite(totalSeconds) || totalSeconds <= 0) return 'N/A';
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.round(totalSeconds % 60);
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  };

  const predictTime = (data: FormData) => {
    const d1 = data.distanceUnit === 'km' ? data.distance : data.distance * 1.60934;
    const t1 = (data.timeHours * 3600) + (data.timeMinutes * 60) + data.timeSeconds;
    
    const predictions: any = {};
    for (const [name, d2] of Object.entries(distancesKm)) {
      if (d1 !== d2) {
        const t2 = t1 * Math.pow(d2 / d1, RIEGEL_EXPONENT);
        predictions[name] = formatTime(t2);
      }
    }
    setResults(predictions);
    setFormData(data);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `running-time-prediction.${format}`;
    const { distance, distanceUnit, timeHours, timeMinutes, timeSeconds } = formData;
    const raceTime = `${timeHours}h ${timeMinutes}m ${timeSeconds}s`;

    if (format === 'txt') {
      content = `Running Time Prediction\n\nInputs:\n- Distance: ${distance} ${distanceUnit}\n- Time: ${raceTime}\n\nPredictions:\n`;
      for(const [name, time] of Object.entries(results)){
          content += `- ${name.replace('-', ' ')}: ${time}\n`;
      }
    } else {
       content = `Distance,Unit,Time,Predicted Race,Predicted Time\n`;
       let first = true;
       for(const [name, time] of Object.entries(results)){
           if(first) {
               content += `${distance},${distanceUnit},${raceTime},${name.replace('-', ' ')},${time}\n`;
               first = false;
           } else {
               content += `,,,${name.replace('-', ' ')},${time}\n`;
           }
       }
    }

    const blob = new Blob([content], { type: `text/${format}` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <form onSubmit={handleSubmit(predictTime)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Recent Race Result</h3>
        <div>
          <Label>Distance</Label>
          <div className="flex gap-2">
            <Controller name="distance" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
            <Controller name="distanceUnit" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger className="w-[120px]"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="miles">Miles</SelectItem><SelectItem value="km">KM</SelectItem></SelectContent></Select>
            )} />
          </div>
        </div>
        <div>
          <Label>Time</Label>
          <div className="grid grid-cols-3 gap-2">
            <div><Label className="text-xs text-muted-foreground">Hours</Label><Controller name="timeHours" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
            <div><Label className="text-xs text-muted-foreground">Minutes</Label><Controller name="timeMinutes" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
            <div><Label className="text-xs text-muted-foreground">Seconds</Label><Controller name="timeSeconds" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
          </div>
        </div>
        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Predict Times</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={!results}>
                  <Download className="mr-2 h-4 w-4" /> Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleExport('txt')}>Download as .txt</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('csv')}>Download as .csv</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Predicted Race Times</h3>
        {results ? (
            <Card>
              <CardContent className="p-4 grid grid-cols-2 gap-4">
                {Object.entries(results).map(([name, time]) => (
                  <div key={name} className="text-center p-2 bg-muted/50 rounded-md">
                    <p className="font-semibold capitalize">{name.replace('-', ' ')}</p>
                    <p className="text-lg font-mono">{time as string}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter a race result to see predictions</p></div>
        )}
      </div>
    </form>
  );
}
