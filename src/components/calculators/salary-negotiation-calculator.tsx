
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
  currentSalary: z.number().min(1),
  desiredIncrease: z.number().min(1).max(100),
});

type FormData = z.infer<typeof formSchema>;

export default function SalaryNegotiationCalculator() {
  const [results, setResults] = useState<any>(null);

  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { currentSalary: 70000, desiredIncrease: 15 },
  });
  
  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const calculateTargets = (data: FormData) => {
    const targetSalary = data.currentSalary * (1 + data.desiredIncrease / 100);
    setResults({
        walkAway: formatCurrency(data.currentSalary * 1.05), // 5% increase
        target: formatCurrency(targetSalary),
        ideal: formatCurrency(targetSalary * 1.10), // 10% above target
    });
  };

  return (
    <form onSubmit={handleSubmit(calculateTargets)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Inputs</h3>
        <div><Label>Current Annual Salary ($)</Label><Controller name="currentSalary" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
        <div><Label>Desired Increase (%)</Label><Controller name="desiredIncrease" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
        <Button type="submit" className="w-full">Calculate Targets</Button>
      </div>

      {/* Results */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Negotiation Targets</h3>
        {results ? (
            <Card>
                <CardContent className="p-4 grid grid-cols-1 gap-4 text-center">
                    <div><p className="font-semibold text-destructive">Walk-Away Point</p><p>{results.walkAway}</p></div>
                    <div><p className="font-semibold text-primary">Target Salary</p><p className="text-2xl font-bold">{results.target}</p></div>
                    <div><p className="font-semibold text-green-600">Ideal Outcome</p><p>{results.ideal}</p></div>
                </CardContent>
            </Card>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter your details to see targets</p></div>
        )}
      </div>
    </form>
  );
}
