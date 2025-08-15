
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const formSchema = z.object({
  capacity: z.number().min(1, "Capacity must be positive"),
  consumption: z.number().min(1, "Consumption must be positive"),
  usageHours: z.number().min(0.1, "Usage hours must be positive"),
  batteryType: z.enum(['li-ion', 'nimh', 'alkaline']),
});

type FormData = z.infer<typeof formSchema>;

const efficiencyFactors = {
    'li-ion': 0.85,
    'nimh': 0.70,
    'alkaline': 0.55,
}

export default function BatteryLifeCalculator() {
  const [results, setResults] = useState<any | null>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { capacity: 2000, consumption: 150, usageHours: 4, batteryType: 'li-ion' },
  });
  
  const calculateLife = (data: FormData) => {
    const { capacity, consumption, usageHours, batteryType } = data;
    const efficiency = efficiencyFactors[batteryType];
    const effectiveCapacity = capacity * efficiency;
    const totalHours = effectiveCapacity / consumption;
    const totalDays = totalHours / usageHours;
    setResults({
        totalHours: totalHours.toFixed(1),
        totalDays: totalDays.toFixed(1)
    });
    setFormData(data);
  }

  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `battery-life-calculation.${format}`;
    const { capacity, consumption, usageHours, batteryType } = formData;

    if (format === 'txt') {
      content = `Battery Life Calculation\n\nInputs:\n- Capacity: ${capacity} mAh\n- Consumption: ${consumption} mA\n- Usage: ${usageHours} hrs/day\n- Type: ${batteryType}\n\nResult:\n- Total Hours: ${results.totalHours}\n- Total Days: ${results.totalDays}`;
    } else {
       content = `Capacity(mAh),Consumption(mA),Usage(hrs/day),Type,Total Hours,Total Days\n${capacity},${consumption},${usageHours},${batteryType},${results.totalHours},${results.totalDays}`;
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
    <form onSubmit={handleSubmit(calculateLife)} className="grid md:grid-cols-2 gap-8">
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Device & Battery Details</h3>
        <div>
            <Label>Battery Capacity (mAh)</Label>
            <Controller name="capacity" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />} />
            {errors.capacity && <p className="text-destructive text-sm mt-1">{errors.capacity.message}</p>}
        </div>
        <div>
            <Label>Device Consumption (mA)</Label>
            <Controller name="consumption" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />} />
            {errors.consumption && <p className="text-destructive text-sm mt-1">{errors.consumption.message}</p>}
        </div>
        <div>
            <Label>Usage (Hours per Day)</Label>
            <Controller name="usageHours" control={control} render={({ field }) => <Input type="number" step="0.5" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
            {errors.usageHours && <p className="text-destructive text-sm mt-1">{errors.usageHours.message}</p>}
        </div>
        <div>
            <Label>Battery Type</Label>
            <Controller name="batteryType" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="li-ion">Lithium-ion</SelectItem>
                        <SelectItem value="nimh">NiMH</SelectItem>
                        <SelectItem value="alkaline">Alkaline</SelectItem>
                    </SelectContent>
                </Select>
            )} />
        </div>
         <div className="flex gap-2">
            <Button type="submit" className="flex-1">Calculate</Button>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" disabled={!results} className="flex-1">
                        <Download className="mr-2 h-4 w-4" /> Export Results
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleExport('txt')}>Download as .txt</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('csv')}>Download as .csv</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Estimated Battery Life</h3>
        {results ? (
            <Card>
                <CardContent className="p-6 grid grid-cols-2 gap-4 text-center">
                    <div>
                        <p className="text-sm text-muted-foreground">Total Hours</p>
                        <p className="text-3xl font-bold">{results.totalHours}</p>
                    </div>
                     <div>
                        <p className="text-sm text-muted-foreground">Total Days</p>
                        <p className="text-3xl font-bold">{results.totalDays}</p>
                    </div>
                </CardContent>
            </Card>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter device and battery details</p></div>
        )}
      </div>
    </form>
  );
}
