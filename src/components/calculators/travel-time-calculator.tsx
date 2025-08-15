
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Download, Info } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Table, TableBody, TableCell, TableRow, TableHead, TableHeader } from '@/components/ui/table';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from 'recharts';

const formSchema = z.object({
  distance: z.number().min(0.1, 'Distance must be positive'),
  speed: z.number().min(0.1, 'Speed must be positive'),
  unit: z.enum(['miles', 'km']),
  numBreaks: z.number().int().min(0).optional(),
  breakMinutes: z.number().int().min(0).optional(),
  delayMinutes: z.number().int().min(0).optional(),
});

type FormData = z.infer<typeof formSchema>;
const PIE_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))'];

export default function TravelTimeCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      distance: 100,
      speed: 60,
      unit: 'miles',
      numBreaks: 1,
      breakMinutes: 15,
      delayMinutes: 0,
    },
  });

  const formatTime = (totalMinutes: number) => {
    if (totalMinutes < 0) return '0h 0m';
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    return `${hours}h ${minutes}m`;
  };

  const calculateTravelTime = (data: FormData) => {
    const { distance, speed, numBreaks = 0, breakMinutes = 0, delayMinutes = 0 } = data;
    const baseTimeHours = distance / speed;
    const baseTimeMinutes = baseTimeHours * 60;
    
    const breakTimeMinutes = numBreaks * breakMinutes;
    const totalTimeMinutes = baseTimeMinutes + breakTimeMinutes + delayMinutes;

    setResults({
      baseTime: formatTime(baseTimeMinutes),
      breakTime: formatTime(breakTimeMinutes),
      delayTime: formatTime(delayMinutes),
      totalTime: formatTime(totalTimeMinutes),
      pieData: [
        { name: 'Driving Time', value: baseTimeMinutes },
        { name: 'Break Time', value: breakTimeMinutes },
        { name: 'Delay Time', value: delayMinutes },
      ].filter(item => item.value > 0),
      error: null,
    });
    setFormData(data);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;

    let content = '';
    const filename = `travel-time-calculation.${format}`;
    
    if (format === 'txt') {
      content = `Travel Time Calculation\n\nInputs:\n${Object.entries(formData).map(([key, value]) => `- ${key}: ${value}`).join('\n')}\n\nResult:\n- Base Travel Time: ${results.baseTime}\n- Break Time: ${results.breakTime}\n- Delay Time: ${results.delayTime}\n- Total Travel Time: ${results.totalTime}`;
    } else {
      content = `Category,Value\n`;
      Object.entries(formData).forEach(([key, value]) => content += `${key},${value}\n`);
      content += `\nResult Category,Value\n`;
      content += `Base Travel Time,${results.baseTime}\nBreak Time,${results.breakTime}\nDelay Time,${results.delayTime}\nTotal Travel Time,${results.totalTime}\n`;
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
    <form onSubmit={handleSubmit(calculateTravelTime)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs Column */}
      <div className="space-y-4">
        <Card>
            <CardHeader><CardTitle>Trip Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <Controller name="unit" control={control} render={({ field }) => (
                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 gap-4">
                        <Label className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><RadioGroupItem value="miles" className="sr-only"/>Miles / MPH</Label>
                        <Label className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><RadioGroupItem value="km" className="sr-only"/>Kilometers / KPH</Label>
                    </RadioGroup>
                )}/>
                <div><Label>Distance</Label><Controller name="distance" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
                <div><Label>Average Speed</Label><Controller name="speed" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle>Stops & Delays (Optional)</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div><Label>Number of Rest Breaks</Label><Controller name="numBreaks" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value))} />} /></div>
                    <div><Label>Minutes per Break</Label><Controller name="breakMinutes" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value))} />} /></div>
                </div>
                 <div><Label>Total Delay Time (minutes)</Label><Controller name="delayMinutes" control={control} render={({ field }) => <Input type="number" placeholder="Traffic, etc." {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value))} />} /></div>
            </CardContent>
        </Card>
        
        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Calculate</Button>
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

      {/* Results Column */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Travel Time Summary</h3>
        {results ? (
            results.error ? (
                <Card className="flex items-center justify-center h-60 bg-muted/50 border-dashed"><p className="text-destructive">{results.error}</p></Card>
            ) : (
                <div className="space-y-4">
                    <Card><CardContent className="p-4 text-center">
                        <p className="text-sm text-muted-foreground">Total Travel Time</p>
                        <p className="text-3xl font-bold">{results.totalTime}</p>
                    </CardContent></Card>
                     <Card>
                        <CardHeader><CardTitle className="text-base text-center">Time Breakdown</CardTitle></CardHeader>
                        <CardContent className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={results.pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={5} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                                        {results.pieData.map((_entry: any, index: number) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                                    </Pie>
                                    <RechartsTooltip formatter={(value: number) => formatTime(value)} />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                     </Card>
                     <Card>
                        <CardContent className="p-2">
                             <Table>
                                <TableHeader><TableRow><TableHead>Component</TableHead><TableHead className="text-right">Duration</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    <TableRow><TableCell>Base Driving Time</TableCell><TableCell className="text-right font-semibold">{results.baseTime}</TableCell></TableRow>
                                    <TableRow><TableCell>Rest Break Time</TableCell><TableCell className="text-right font-semibold">{results.breakTime}</TableCell></TableRow>
                                    <TableRow><TableCell>Delay Time</TableCell><TableCell className="text-right font-semibold">{results.delayTime}</TableCell></TableRow>
                                    <TableRow className="font-bold border-t"><TableCell>Total Time</TableCell><TableCell className="text-right">{results.totalTime}</TableCell></TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                     </Card>
                </div>
            )
        ) : (
             <div className="flex items-center justify-center h-60 bg-muted/50 rounded-lg border border-dashed"><p className="text-sm text-muted-foreground">Enter details to estimate travel time</p></div>
        )}
      </div>
    </form>
  );
}
