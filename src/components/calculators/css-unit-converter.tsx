
"use client";

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const formSchema = z.object({
  baseFontSize: z.number().min(1),
  px: z.number().optional(),
  rem: z.number().optional(),
  em: z.number().optional(),
  percent: z.number().optional(),
});
type FormData = z.infer<typeof formSchema>;

export default function CssUnitConverter() {
  const { control, watch, setValue } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { 
        baseFontSize: 16, 
        px: 16,
        rem: 1,
        em: 1,
        percent: 100,
     },
  });

  const formData = watch();
  const [lastChanged, setLastChanged] = useState<'px' | 'rem' | 'em' | 'percent'>('px');

  useEffect(() => {
    const { baseFontSize, px, rem, em, percent } = formData;
    if (baseFontSize <= 0) return;

    if (lastChanged === 'px' && px !== undefined) {
      setValue('rem', px / baseFontSize);
      setValue('em', px / baseFontSize);
      setValue('percent', (px / baseFontSize) * 100);
    } else if (lastChanged === 'rem' && rem !== undefined) {
      const newPx = rem * baseFontSize;
      setValue('px', newPx);
      setValue('em', rem);
      setValue('percent', rem * 100);
    } else if (lastChanged === 'em' && em !== undefined) {
      const newPx = em * baseFontSize;
      setValue('px', newPx);
      setValue('rem', em);
      setValue('percent', em * 100);
    } else if (lastChanged === 'percent' && percent !== undefined) {
        const asDecimal = percent / 100;
        setValue('px', asDecimal * baseFontSize);
        setValue('rem', asDecimal);
        setValue('em', asDecimal);
    }
  }, [formData, lastChanged, setValue]);
  
  const renderInput = (name: keyof FormData, label: string) => (
      <div>
          <Label>{label}</Label>
           <Controller name={name} control={control} render={({ field }) => (
                <Input type="number" {...field} value={field.value ?? ''} onFocus={() => setLastChanged(name as any)} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
            )} />
      </div>
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Base Font Size</CardTitle>
        </CardHeader>
        <CardContent>
            {renderInput('baseFontSize', 'Root Font Size (px)')}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Conversions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          {renderInput('px', 'Pixels (px)')}
          {renderInput('rem', 'REM')}
          {renderInput('em', 'EM')}
          {renderInput('percent', 'Percent (%)')}
        </CardContent>
      </Card>
    </div>
  );
}
