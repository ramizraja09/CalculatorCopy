
"use client";

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const formSchema = z.object({
  minute: z.string(),
  hour: z.string(),
  dayOfMonth: z.string(),
  month: z.string(),
  dayOfWeek: z.string(),
  command: z.string().nonempty(),
});

type FormData = z.infer<typeof formSchema>;

const createOptions = (max: number, start = 0) => Array.from({ length: max - start + 1 }, (_, i) => String(i + start));
const cronOptions = {
  minute: ['*', ...createOptions(59)],
  hour: ['*', ...createOptions(23)],
  dayOfMonth: ['*', ...createOptions(31, 1)],
  month: ['*', ...createOptions(12, 1)],
  dayOfWeek: ['*', ...createOptions(6)], // 0-6 for Sun-Sat
};

export default function CronJobGenerator() {
  const [cronString, setCronString] = useState('');
  const { control, watch } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { minute: '0', hour: '0', dayOfMonth: '*', month: '*', dayOfWeek: '*', command: '/usr/bin/example.sh' },
  });

  const formData = watch();

  useEffect(() => {
    const { minute, hour, dayOfMonth, month, dayOfWeek, command } = formData;
    setCronString(`${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek} ${command}`);
  }, [formData]);

  const renderSelect = (name: keyof FormData, label: string) => (
    <div className="flex-1">
      <Label>{label}</Label>
      <Controller name={name} control={control} render={({ field }) => (
        <Select onValueChange={field.onChange} defaultValue={field.value}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {cronOptions[name as keyof typeof cronOptions].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
      )} />
    </div>
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Cron Schedule</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {renderSelect('minute', 'Minute')}
          {renderSelect('hour', 'Hour')}
          {renderSelect('dayOfMonth', 'Day (Month)')}
          {renderSelect('month', 'Month')}
          {renderSelect('dayOfWeek', 'Day (Week)')}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Command</CardTitle></CardHeader>
        <CardContent>
          <Controller name="command" control={control} render={({ field }) => <Input {...field} />} />
        </CardContent>
      </Card>
       <Card>
        <CardHeader><CardTitle>Generated Cron String</CardTitle></CardHeader>
        <CardContent>
          <Input readOnly value={cronString} className="font-mono bg-muted" />
        </CardContent>
      </Card>
    </div>
  );
}
