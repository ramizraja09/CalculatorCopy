
"use client";

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const formSchema = z.object({
  conversionType: z.enum(['hourlyToSalary', 'salaryToHourly']),
  hourlyRate: z.number().min(0),
  hoursPerWeek: z.number().min(1),
  annualSalary: z.number().min(0),
});

type FormData = z.infer<typeof formSchema>;

export default function HourlyToSalaryConverter() {
  const [result, setResult] = useState<string | null>(null);
  const { control, watch } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      conversionType: 'hourlyToSalary',
      hourlyRate: 25,
      hoursPerWeek: 40,
      annualSalary: 52000,
    },
  });

  const formData = watch();

  useEffect(() => {
    const { conversionType, hourlyRate, hoursPerWeek, annualSalary } = formData;
    if (conversionType === 'hourlyToSalary') {
      const calculatedSalary = hourlyRate * hoursPerWeek * 52;
      setResult(`Annual Salary: ${formatCurrency(calculatedSalary)}`);
    } else {
      const calculatedHourlyRate = annualSalary / 52 / hoursPerWeek;
      setResult(`Hourly Rate: ${formatCurrency(calculatedHourlyRate)}`);
    }
  }, [formData]);

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  return (
    <form onSubmit={(e) => e.preventDefault()} className="grid md:grid-cols-2 gap-8">
      {/* Inputs Column */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Conversion Type</h3>
        <Controller name="conversionType" control={control} render={({ field }) => (
            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 gap-4">
                <Label className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><RadioGroupItem value="hourlyToSalary" className="mr-2"/>Hourly to Salary</Label>
                <Label className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><RadioGroupItem value="salaryToHourly" className="mr-2"/>Salary to Hourly</Label>
            </RadioGroup>
        )}/>

        {formData.conversionType === 'hourlyToSalary' ? (
            <div className="space-y-4">
                <div><Label>Hourly Rate ($)</Label><Controller name="hourlyRate" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                <div><Label>Hours Per Week</Label><Controller name="hoursPerWeek" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
            </div>
        ) : (
             <div className="space-y-4">
                <div><Label>Annual Salary ($)</Label><Controller name="annualSalary" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                 <div><Label>Hours Per Week</Label><Controller name="hoursPerWeek" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
            </div>
        )}
      </div>

      {/* Results Column */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Equivalent Rate</h3>
        {result ? (
            <Card>
                <CardContent className="p-6 text-center">
                    <p className="text-2xl font-bold">{result}</p>
                </CardContent>
            </Card>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter details to convert</p></div>
        )}
      </div>
    </form>
  );
}
