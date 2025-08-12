
"use client";

import { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Trash, Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const timeEntrySchema = z.object({
  startTime: z.string().nonempty("Start time required"),
  endTime: z.string().nonempty("End time required"),
}).refine(data => {
    return new Date(`1970-01-01T${data.endTime}`) > new Date(`1970-01-01T${data.startTime}`);
}, { message: "End time must be after start time", path: ["endTime"] });

const formSchema = z.object({
  timeEntries: z.array(timeEntrySchema),
  breakMinutes: z.number().min(0).default(0),
});

type FormData = z.infer<typeof formSchema>;

export default function WorkHoursCalculator() {
  const [result, setResult] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      timeEntries: [{ startTime: '09:00', endTime: '17:00' }],
      breakMinutes: 30,
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "timeEntries" });

  const calculateHours = (data: FormData) => {
    let totalMinutes = 0;
    data.timeEntries.forEach(entry => {
      const start = new Date(`1970-01-01T${entry.startTime}`);
      const end = new Date(`1970-01-01T${entry.endTime}`);
      if (end > start) {
        totalMinutes += (end.getTime() - start.getTime()) / 60000;
      }
    });
    totalMinutes -= data.breakMinutes;

    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    const decimalHours = (totalMinutes / 60).toFixed(2);
    setResult(`${hours}h ${minutes}m (Decimal: ${decimalHours})`);
    setFormData(data);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!result || !formData) return;
    
    let content = '';
    const filename = `work-hours-calculation.${format}`;

    if (format === 'txt') {
      content = `Work Hours Calculation\n\n`;
      formData.timeEntries.forEach((entry, index) => {
        content += `Entry ${index + 1}: ${entry.startTime} - ${entry.endTime}\n`;
      });
      content += `Total Break: ${formData.breakMinutes} minutes\n\n`;
      content += `Result:\nTotal Time Worked: ${result}`;
    } else {
      content = 'Entry,Start Time,End Time\n';
       formData.timeEntries.forEach((entry, index) => {
        content += `${index+1},${entry.startTime},${entry.endTime}\n`;
      });
      content += `\nBreak (minutes),${formData.breakMinutes}\nTotal Time,"${result}"`;
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
    <form onSubmit={handleSubmit(calculateHours)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Time Entries</h3>
        {fields.map((field, index) => (
          <div key={field.id} className="flex gap-2 items-end p-2 border rounded-md">
            <div className="grid grid-cols-2 gap-2 flex-1">
              <div><Label className="text-xs">Start Time</Label><Controller name={`timeEntries.${index}.startTime`} control={control} render={({ field }) => <Input type="time" {...field} />} /></div>
              <div><Label className="text-xs">End Time</Label><Controller name={`timeEntries.${index}.endTime`} control={control} render={({ field }) => <Input type="time" {...field} />} /></div>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash className="h-4 w-4" /></Button>
          </div>
        ))}
        {errors.timeEntries && <p className="text-destructive text-sm">Please check time entries.</p>}
        <Button type="button" variant="outline" onClick={() => append({ startTime: '09:00', endTime: '17:00' })}>Add Time Entry</Button>
        <div>
          <Label>Total Break Time (minutes)</Label>
          <Controller name="breakMinutes" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} />
        </div>
        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Calculate Total Hours</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={!result}>
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
        <h3 className="text-xl font-semibold">Total Time Worked</h3>
        {result ? (
            <Card><CardContent className="p-6 text-center"><p className="text-3xl font-bold">{result}</p></CardContent></Card>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Add entries to calculate total hours</p></div>
        )}
      </div>
    </form>
  );
}
