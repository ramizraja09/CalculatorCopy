
"use client";

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const formSchema = z.object({
  ratioW: z.number().min(1),
  ratioH: z.number().min(1),
  width: z.number().optional(),
  height: z.number().optional(),
});
type FormData = z.infer<typeof formSchema>;

export default function AspectRatioCalculator() {
  const { control, watch, setValue } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { ratioW: 16, ratioH: 9, width: 1920 },
  });

  const formData = watch();
  const [lastChanged, setLastChanged] = useState<'width' | 'height'>('width');

  useEffect(() => {
    const { ratioW, ratioH, width, height } = formData;
    if (ratioW > 0 && ratioH > 0) {
      if (lastChanged === 'width' && width && width > 0) {
        setValue('height', (width * ratioH) / ratioW);
      } else if (lastChanged === 'height' && height && height > 0) {
        setValue('width', (height * ratioW) / ratioH);
      }
    }
  }, [formData.width, formData.height, formData.ratioW, formData.ratioH, lastChanged, setValue]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aspect Ratio Calculator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Aspect Ratio</Label>
          <div className="flex items-center gap-2">
            <Controller name="ratioW" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} />
            <span>:</span>
            <Controller name="ratioH" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} />
          </div>
        </div>
        <div>
          <Label>Dimensions</Label>
          <div className="flex items-center gap-2">
            <Controller name="width" control={control} render={({ field }) => (
              <Input type="number" placeholder="Width" {...field} onFocus={() => setLastChanged('width')} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />
            )} />
            <span>x</span>
            <Controller name="height" control={control} render={({ field }) => (
              <Input type="number" placeholder="Height" {...field} onFocus={() => setLastChanged('height')} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />
            )} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
