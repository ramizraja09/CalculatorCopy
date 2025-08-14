
"use client";

import { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Trash, Download, Info } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const timeEntrySchema = z.object({
  name: z.string().optional(),
  startTime: z.string().nonempty("Start time required"),
  endTime: z.string().nonempty("End time required"),
}).refine(data => {
    return new Date(`1970-01-01T${data.endTime}:00`) > new Date(`1970-01-01T${data.startTime}:00`);
}, { message: "End time must be after start time", path: ["endTime"] });

const formSchema = z.object({
  timeEntries: z.array(timeEntrySchema),
  breakMinutes: z.number().min(0).default(0),
  hourlyRate: z.number().min(0).optional(),
});

type FormData = z.infer<typeof formSchema>;

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

export default function WorkHoursCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      timeEntries: [{ name: 'Day 1', startTime: '09:00', endTime: '17:00' }],
      breakMinutes: 30,
      hourlyRate: 25,
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "timeEntries" });

  const calculateHours = (data: FormData) => {
    let totalMinutes = 0;
    const chartData = data.timeEntries.map((entry, index) => {
      const start = new Date(`1970-01-01T${entry.startTime}`);
      const end = new Date(`1970-01-01T${entry.endTime}`);
      let entryMinutes = 0;
      if (end > start) {
        entryMinutes = (end.getTime() - start.getTime()) / 60000;
        totalMinutes += entryMinutes;
      }
      return { name: entry.name || `Entry ${index + 1}`, hours: entryMinutes / 60 };
    });
    
    totalMinutes -= data.breakMinutes;

    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    const decimalHours = (totalMinutes / 60);
    
    let totalPay = 0;
    if(data.hourlyRate && data.hourlyRate > 0) {
        totalPay = decimalHours * data.hourlyRate;
    }

    setResults({
        totalHoursFormatted: `${hours}h ${minutes}m`,
        totalHoursDecimal: decimalHours.toFixed(2),
        totalPay,
        chartData,
    });
    setFormData(data);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!result || !formData) return;
    
    let content = '';
    const filename = `work-hours-calculation.${format}`;

    if (format === 'txt') {
      content = `Work Hours Calculation\n\n`;
      formData.timeEntries.forEach((entry, index) => {
        content += `Entry ${index + 1} (${entry.name}): ${entry.startTime} - ${entry.endTime}\n`;
      });
      content += `Total Break: ${formData.breakMinutes} minutes\n`;
      content += `Hourly Rate: ${formatCurrency(formData.hourlyRate || 0)}\n\n`;
      content += `Result:\nTotal Time Worked: ${results.totalHoursFormatted}\nTotal Pay: ${formatCurrency(results.totalPay)}`;
    } else {
      content = 'Entry Name,Start Time,End Time\n';
       formData.timeEntries.forEach((entry, index) => {
        content += `"${entry.name || `Entry ${index+1}`}",${entry.startTime},${entry.endTime}\n`;
      });
      content += `\nBreak (minutes),${formData.breakMinutes}\nHourly Rate,${formData.hourlyRate || 0}\n`;
      content += `\nTotal Time,"${results.totalHoursFormatted}"\nTotal Pay,${results.totalPay.toFixed(2)}`;
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
    <form onSubmit={handleSubmit(calculateHours)} className="grid lg:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <Card>
            <CardHeader><CardTitle>Time Entries</CardTitle></CardHeader>
            <CardContent className="space-y-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 items-end p-2 border rounded-md">
                    <div className="grid grid-cols-[1fr,auto,auto] gap-2 flex-1">
                      <div><Label className="text-xs">Description (optional)</Label><Controller name={`timeEntries.${index}.name`} control={control} render={({ field }) => <Input placeholder={`Day ${index + 1}`} {...field} />} /></div>
                      <div><Label className="text-xs">Start Time</Label><Controller name={`timeEntries.${index}.startTime`} control={control} render={({ field }) => <Input type="time" {...field} />} /></div>
                      <div><Label className="text-xs">End Time</Label><Controller name={`timeEntries.${index}.endTime`} control={control} render={({ field }) => <Input type="time" {...field} />} /></div>
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash className="h-4 w-4" /></Button>
                  </div>
                ))}
                {errors.timeEntries && <p className="text-destructive text-sm">Please check your time entries.</p>}
                <Button type="button" variant="outline" onClick={() => append({ name: '', startTime: '09:00', endTime: '17:00' })}>Add Time Entry</Button>
            </CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle>Breaks & Pay</CardTitle></CardHeader>
             <CardContent className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Total Unpaid Break Time (minutes)</Label>
                  <Controller name="breakMinutes" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))} />} />
                </div>
                 <div>
                  <Label>Hourly Rate ($)</Label>
                  <Controller name="hourlyRate" control={control} render={({ field }) => <Input type="number" placeholder="Optional" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
                </div>
            </CardContent>
        </Card>
        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Calculate Total Hours</Button>
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
        <h3 className="text-xl font-semibold">Summary</h3>
        {results ? (
            <div className="space-y-4">
                 <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Summary</AlertTitle>
                  <AlertDescription>
                    For the time entries provided, you worked a total of <strong>{results.totalHoursFormatted}</strong>.
                    {results.totalPay > 0 && ` Your estimated earnings are ${formatCurrency(results.totalPay)}.`}
                  </AlertDescription>
                </Alert>
                 <div className="grid grid-cols-2 gap-4">
                    <Card><CardContent className="p-4 text-center"><p className="text-sm text-muted-foreground">Total Hours</p><p className="text-2xl font-bold">{results.totalHoursFormatted}</p></CardContent></Card>
                    <Card><CardContent className="p-4 text-center"><p className="text-sm text-muted-foreground">Total Pay</p><p className="text-2xl font-bold">{formatCurrency(results.totalPay)}</p></CardContent></Card>
                </div>
                 <Card>
                    <CardHeader><CardTitle className="text-base text-center">Time Breakdown by Entry</CardTitle></CardHeader>
                    <CardContent className="h-64">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={results.chartData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis type="category" dataKey="name" width={80} />
                                <Tooltip formatter={(value: number) => `${value.toFixed(2)} hours`} />
                                <Bar dataKey="hours" fill="hsl(var(--primary))" name="Hours Worked" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Add entries to calculate total hours</p></div>
        )}
      </div>
    </form>
  );
}
