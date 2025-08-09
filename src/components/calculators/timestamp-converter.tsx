
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const formSchema = z.object({
  timestamp: z.number().int(),
  date: z.string(),
});
type FormData = z.infer<typeof formSchema>;

export default function TimestampConverter() {
  const { control, setValue, getValues } = useForm<FormData>({
    defaultValues: { timestamp: Math.floor(Date.now() / 1000), date: new Date().toLocaleString() },
  });

  const toDate = () => {
    const ts = getValues("timestamp");
    setValue("date", new Date(ts * 1000).toLocaleString());
  };
  
  const toTimestamp = () => {
      const dateStr = getValues("date");
      setValue("timestamp", Math.floor(new Date(dateStr).getTime() / 1000));
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 space-y-2">
          <div>
            <Label>Unix Timestamp (seconds)</Label>
            <Controller name="timestamp" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} />
          </div>
          <Button onClick={toDate} className="w-full">Convert to Date</Button>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 space-y-2">
          <div>
            <Label>Human-Readable Date</Label>
            <Controller name="date" control={control} render={({ field }) => <Input {...field} />} />
          </div>
          <Button onClick={toTimestamp} className="w-full">Convert to Timestamp</Button>
        </CardContent>
      </Card>
    </div>
  );
}
