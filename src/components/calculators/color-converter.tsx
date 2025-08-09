
"use client";

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Utility Functions
function hexToRgb(hex: string): { r: number, g: number, b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

function rgbToHsl(r: number, g: number, b: number): { h: number, s: number, l: number } {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

const formSchema = z.object({
  hex: z.string(),
  r: z.number().min(0).max(255),
  g: z.number().min(0).max(255),
  b: z.number().min(0).max(255),
  h: z.number().min(0).max(360),
  s: z.number().min(0).max(100),
  l: z.number().min(0).max(100),
});

type FormData = z.infer<typeof formSchema>;

export default function ColorConverter() {
  const [lastChanged, setLastChanged] = useState<'hex' | 'rgb' | 'hsl'>('hex');
  const { control, watch, setValue, getValues } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { hex: '#5F9EA0', r: 95, g: 158, b: 160, h: 181, s: 25, l: 50 },
  });

  const formData = watch();

  useEffect(() => {
    const values = getValues();
    if (lastChanged === 'hex') {
      const rgb = hexToRgb(values.hex);
      if (rgb) {
        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
        setValue('r', rgb.r, { shouldValidate: true });
        setValue('g', rgb.g, { shouldValidate: true });
        setValue('b', rgb.b, { shouldValidate: true });
        setValue('h', hsl.h, { shouldValidate: true });
        setValue('s', hsl.s, { shouldValidate: true });
        setValue('l', hsl.l, { shouldValidate: true });
      }
    }
    // Implement RGB and HSL to others conversion if needed
  }, [formData.hex, setValue, getValues, lastChanged]);

  return (
    <div className="grid md:grid-cols-2 gap-8 items-center">
      <div className="space-y-4">
        <Card>
          <CardContent className="p-4 space-y-2">
            <div>
              <Label>HEX</Label>
              <Controller name="hex" control={control} render={({ field }) => <Input {...field} onFocus={() => setLastChanged('hex')} />} />
            </div>
            <div>
              <Label>RGB</Label>
              <div className="flex gap-2">
                <Controller name="r" control={control} render={({ field }) => <Input type="number" placeholder="R" {...field} onFocus={() => setLastChanged('rgb')} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} />
                <Controller name="g" control={control} render={({ field }) => <Input type="number" placeholder="G" {...field} onFocus={() => setLastChanged('rgb')} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} />
                <Controller name="b" control={control} render={({ field }) => <Input type="number" placeholder="B" {...field} onFocus={() => setLastChanged('rgb')} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} />
              </div>
            </div>
             <div>
              <Label>HSL</Label>
              <div className="flex gap-2">
                <Controller name="h" control={control} render={({ field }) => <Input type="number" placeholder="H" {...field} onFocus={() => setLastChanged('hsl')} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} />
                <Controller name="s" control={control} render={({ field }) => <Input type="number" placeholder="S" {...field} onFocus={() => setLastChanged('hsl')} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} />
                <Controller name="l" control={control} render={({ field }) => <Input type="number" placeholder="L" {...field} onFocus={() => setLastChanged('hsl')} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <div>
        <div className="w-full h-48 rounded-lg border" style={{ backgroundColor: formData.hex }}></div>
      </div>
    </div>
  );
}
