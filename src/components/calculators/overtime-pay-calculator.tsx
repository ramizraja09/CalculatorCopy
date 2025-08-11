
"use client";

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const formSchema = z.object({
  hourlyRate: z.number().min(0, "Hourly rate must be non-negative"),
  regularHours: z.number().min(0, "Regular hours must be non-negative"),
  overtimeHours: z.number().min(0, "Overtime hours must be non-negative"),
  overtimeMultiplier: z.number().min(1, "Multiplier must be at least 1"),
});

type FormData = z.infer<typeof formSchema>;

export default function OvertimePayCalculator() {
  const [results, setResults] = useState<any>(null);

  const { control, watch } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      hourlyRate: 20,
      regularHours: 40,
      overtimeHours: 10,
      overtimeMultiplier: 1.5,
    },
  });

  const formData = watch();

  useEffect(() => {
    const { hourlyRate, regularHours, overtimeHours, overtimeMultiplier } = formData;
    const regularPay = hourlyRate * regularHours;
    const overtimePay = hourlyRate * overtimeMultiplier * overtimeHours;
    const totalPay = regularPay + overtimePay;

    setResults({
      regularPay,
      overtimePay,
      totalPay,
    });
  }, [formData]);

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  return (
    <form onSubmit={(e) => e.preventDefault()} className="grid md:grid-cols-2 gap-8">
      {/* Inputs Column */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Pay & Hours</h3>
        <div>
          <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
          <Controller name="hourlyRate" control={control} render={({ field }) => <Input id="hourlyRate" type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="regularHours">Regular Hours</Label>
            <Controller name="regularHours" control={control} render={({ field }) => <Input id="regularHours" type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
          </div>
          <div>
            <Label htmlFor="overtimeHours">Overtime Hours</Label>
            <Controller name="overtimeHours" control={control} render={({ field }) => <Input id="overtimeHours" type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
          </div>
        </div>
        <div>
          <Label htmlFor="overtimeMultiplier">Overtime Multiplier (e.g., 1.5 for time-and-a-half)</Label>
          <Controller name="overtimeMultiplier" control={control} render={({ field }) => <Input id="overtimeMultiplier" type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
        </div>
      </div>

      {/* Results Column */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Pay Summary</h3>
        {results ? (
            <div className="space-y-4">
                <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-sm text-muted-foreground">Total Pay</p>
                        <p className="text-3xl font-bold">{formatCurrency(results.totalPay)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 grid grid-cols-2 gap-2 text-sm text-center">
                         <div><p className="text-muted-foreground">Regular Pay</p><p className="font-semibold">{formatCurrency(results.regularPay)}</p></div>
                         <div><p className="text-muted-foreground">Overtime Pay</p><p className="font-semibold">{formatCurrency(results.overtimePay)}</p></div>
                    </CardContent>
                </Card>
            </div>
        ) : (
             <div className="flex items-center justify-center h-60 bg-muted/50 rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">Enter your pay details</p>
            </div>
        )}
      </div>
    </form>
  );
}
