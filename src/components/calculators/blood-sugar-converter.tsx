
"use client";

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';

const formSchema = z.object({
  value: z.number().min(0),
  unit: z.enum(['mg/dL', 'mmol/L']),
});

type FormData = z.infer<typeof formSchema>;

const MG_DL_TO_MMOL_L = 18.0182;

export default function BloodSugarConverter() {
  const [result, setResult] = useState<string | null>(null);
  const { control, watch } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { value: 100, unit: 'mg/dL' },
  });

  const formData = watch();

  useEffect(() => {
    const { value, unit } = formData;
    if (value >= 0) {
      let convertedValue;
      let convertedUnit;
      if (unit === 'mg/dL') {
        convertedValue = value / MG_DL_TO_MMOL_L;
        convertedUnit = 'mmol/L';
      } else {
        convertedValue = value * MG_DL_TO_MMOL_L;
        convertedUnit = 'mg/dL';
      }
      setResult(`${convertedValue.toFixed(1)} ${convertedUnit}`);
    }
  }, [formData]);

  return (
    <div className="space-y-4">
        <form onSubmit={(e) => e.preventDefault()} className="grid md:grid-cols-2 gap-8 items-start">
            <div className="space-y-4">
                <h3 className="text-xl font-semibold">Blood Glucose Value</h3>
                <div>
                  <Label>From</Label>
                  <div className="flex gap-2">
                    <Controller name="value" control={control} render={({ field }) => <Input type="number" step="any" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
                    <Controller name="unit" control={control} render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mg/dL">mg/dL</SelectItem>
                          <SelectItem value="mmol/L">mmol/L</SelectItem>
                        </SelectContent>
                      </Select>
                    )} />
                  </div>
                </div>
            </div>
            <div className="space-y-4">
                 <h3 className="text-xl font-semibold">Converted Value</h3>
                 <Card className="flex-1"><CardContent className="p-2 h-10 flex items-center justify-center font-semibold text-lg">{result ?? '...'}</CardContent></Card>
            </div>
        </form>
         <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>For Informational Purposes Only</AlertTitle>
            <AlertDescription className="text-xs">
              This calculator is for informational purposes only and is not a substitute for professional medical advice. Consult a healthcare provider for any health concerns.
            </AlertDescription>
        </Alert>
    </div>
  );
}
