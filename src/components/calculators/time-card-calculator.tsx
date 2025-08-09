
"use client";

import { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Trash } from 'lucide-react';

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
        <Button type="submit" className="w-full">Calculate Total Hours</Button>
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
