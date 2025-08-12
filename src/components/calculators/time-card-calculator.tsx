
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
  startTime: z.string().nonempty(),
  endTime: z.string().nonempty(),
  breakMinutes: z.number().min(0),
});
const formSchema = z.object({
  timeEntries: z.array(timeEntrySchema),
});
type FormData = z.infer<typeof formSchema>;

export default function TimeCardCalculator() {
  const [result, setResult] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      timeEntries: [{ startTime: '09:00', endTime: '17:00', breakMinutes: 30 }],
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
      totalMinutes -= entry.breakMinutes;
    });
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    setResult(`${hours} hours, ${minutes} minutes`);
    setFormData(data);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!result || !formData) return;
    
    let content = '';
    const filename = `time-card-calculation-result.${format}`;

    if (format === 'txt') {
      content = `Time Card Calculation\n\n`;
      formData.timeEntries.forEach((entry, index) => {
        content += `Entry ${index + 1}: ${entry.startTime} - ${entry.endTime} (Break: ${entry.breakMinutes} mins)\n`;
      });
      content += `\nResult:\nTotal Time Worked: ${result}`;
    } else {
      content = 'Start Time,End Time,Break (mins)\n';
       formData.timeEntries.forEach((entry, index) => {
        content += `${entry.startTime},${entry.endTime},${entry.breakMinutes}\n`;
      });
      content += `\nTotal Time,"${result}"`;
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
              <div className="col-span-2"><Label className="text-xs">Break (mins)</Label><Controller name={`timeEntries.${index}.breakMinutes`} control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
            </div>
            <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}><Trash className="h-4 w-4" /></Button>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => append({ startTime: '09:00', endTime: '17:00', breakMinutes: 30 })}>Add Entry</Button>
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
            <Card><CardContent className="p-6 text-center"><p className="text-4xl font-bold">{result}</p></CardContent></Card>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Add entries to calculate total hours</p></div>
        )}
      </div>
    </form>
  );
}
