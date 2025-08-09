
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
  desiredSalary: z.number().min(1),
  annualExpenses: z.number().min(0),
  billableHoursPerWeek: z.number().min(1).max(40),
});

type FormData = z.infer<typeof formSchema>;

export default function FreelanceRateCalculator() {
  const [result, setResult] = useState<number | null>(null);

  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { desiredSalary: 80000, annualExpenses: 10000, billableHoursPerWeek: 30 },
  });

  const calculateRate = (data: FormData) => {
    const totalRevenueNeeded = data.desiredSalary + data.annualExpenses;
    const totalBillableHours = data.billableHoursPerWeek * 52;
    const hourlyRate = totalRevenueNeeded / totalBillableHours;
    setResult(hourlyRate);
  };
  
  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  return (
    <form onSubmit={handleSubmit(calculateRate)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Inputs</h3>
        <div><Label>Desired Annual Salary ($)</Label><Controller name="desiredSalary" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
        <div><Label>Total Annual Business Expenses ($)</Label><Controller name="annualExpenses" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
        <div><Label>Billable Hours Per Week</Label><Controller name="billableHoursPerWeek" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
        <Button type="submit" className="w-full">Calculate Rate</Button>
      </div>

      {/* Results */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Recommended Hourly Rate</h3>
        {result !== null ? (
            <Card>
                <CardContent className="p-6 text-center">
                    <p className="text-4xl font-bold">{formatCurrency(result)}</p>
                    <p className="text-muted-foreground">per hour</p>
                </CardContent>
            </Card>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter your details to calculate a rate</p></div>
        )}
      </div>
    </form>
  );
}
