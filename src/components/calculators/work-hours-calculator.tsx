
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
      totalMinutes += (end.getTime() - start.getTime()) / 60000;
    });
    totalMinutes -= data.breakMinutes;

    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    const decimalHours = (totalMinutes / 60).toFixed(2);
    setResult(`${hours}h ${minutes}m (Decimal: ${decimalHours})`);
  };

  return (
    <form onSubmit={handleSubmit(calculateHours)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Time Entries</h3>
        {fields.map((field, index) => (
          <div key={field.id} className="flex gap-2 items-center p-2 border rounded-md">
            <div className="flex-1 space-y-1">
              <div><Label className="text-xs">Start Time</Label><Controller name={`timeEntries.${index}.startTime`} control={control} render={({ field }) => <Input type="time" {...field} />} /></div>
            </div>
            <div className="flex-1 space-y-1">
              <div><Label className="text-xs">End Time</Label><Controller name={`timeEntries.${index}.endTime`} control={control} render={({ field }) => <Input type="time" {...field} />} /></div>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash className="h-4 w-4" /></Button>
          </div>
        ))}
        {errors.timeEntries && <p className="text-destructive text-sm">Please check time entries.</p>}
        <Button type="button" variant="outline" onClick={() => append({ startTime: '', endTime: '' })}>Add Time Entry</Button>
        <div>
          <Label>Total Break Time (minutes)</Label>
          <Controller name="breakMinutes" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} />
        </div>
        <Button type="submit" className="w-full">Calculate Total Hours</Button>
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
