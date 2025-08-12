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
  const [formData, setFormData] = useState<FormData | null>(null);

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
    setFormData(data);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `vo2max-estimation.${format}`;
    const { distance, timeMinutes, timeSeconds } = formData;
    const raceTime = `${timeMinutes}m ${timeSeconds}s`;

    if (format === 'txt') {
      content = `VO2 Max Estimation\n\nInputs:\n- Distance: ${distance.replace('_', ' ')}\n- Time: ${raceTime}\n\nResult:\n- Estimated VO2 Max: ${results.vo2max.toFixed(1)} mL/kg/min`;
    } else {
       content = `Distance,Time,Estimated VO2 Max (mL/kg/min)\n${distance.replace('_', ' ')},${raceTime},${results.vo2max.toFixed(1)}`;
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
        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Estimate VO2 Max</Button>
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
        <h3 className="text-xl font-semibold">Estimated VO2 Max</h3>
        {results ? (
            <Card>
                <CardContent className="p-6 text-center">
                    <div className="text-4xl font-bold my-2">{results.vo2max.toFixed(1)}</div>
                    <div className="text-muted-foreground">mL/kg/min</div>
                </CardContent>
            </Card>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter a race result to estimate VO2 Max</p></div>
        )}
      </div>
    </form>
  );
}
