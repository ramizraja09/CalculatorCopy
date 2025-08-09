
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const formSchema = z.object({
  currentAge: z.number().int().min(18),
  retirementAge: z.number().int().min(19),
  currentBalance: z.number().min(0),
  annualSalary: z.number().min(1),
  contributionPercent: z.number().min(0).max(100),
  employerMatchPercent: z.number().min(0).max(100),
  matchUpToPercent: z.number().min(0).max(100),
  annualReturn: z.number().min(0),
}).refine(data => data.retirementAge > data.currentAge, {
  message: "Retirement age must be after current age.",
  path: ["retirementAge"],
});

type FormData = z.infer<typeof formSchema>;

export default function Four01kCalculator() {
  const [results, setResults] = useState<any>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currentAge: 30,
      retirementAge: 67,
      currentBalance: 50000,
      annualSalary: 80000,
      contributionPercent: 10,
      employerMatchPercent: 50,
      matchUpToPercent: 6,
      annualReturn: 7,
    },
  });

  const calculate401k = (data: FormData) => {
    const {
      currentAge, retirementAge, currentBalance, annualSalary,
      contributionPercent, employerMatchPercent, matchUpToPercent, annualReturn
    } = data;
    
    const yearsToRetirement = retirementAge - currentAge;
    const monthlyRate = annualReturn / 100 / 12;

    const employeeContributionMonthly = (annualSalary * (contributionPercent / 100)) / 12;
    const employerMatchableContribution = (annualSalary * (matchUpToPercent / 100)) / 12;
    const employerMatchMonthly = Math.min(employeeContributionMonthly, employerMatchableContribution) * (employerMatchPercent / 100);
    const totalMonthlyContribution = employeeContributionMonthly + employerMatchMonthly;
    
    let balance = currentBalance;
    const schedule = [{ age: currentAge, balance }];

    for (let year = 1; year <= yearsToRetirement; year++) {
      for (let month = 1; month <= 12; month++) {
        balance = balance * (1 + monthlyRate) + totalMonthlyContribution;
      }
      schedule.push({ age: currentAge + year, balance });
    }

    setResults({
      finalBalance: balance,
      totalContributions: currentBalance + (totalMonthlyContribution * 12 * yearsToRetirement),
      schedule,
      error: null,
    });
  };
  
  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  return (
    <form onSubmit={handleSubmit(calculate401k)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs Column */}
      <div className="space-y-4">
        <Card>
            <CardHeader><CardTitle className="text-lg">Your Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div><Label>Current Age</Label><Controller name="currentAge" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />} /></div>
                    <div><Label>Retirement Age</Label><Controller name="retirementAge" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />} /></div>
                </div>
                 {errors.retirementAge && <p className="text-destructive text-sm">{errors.retirementAge.message}</p>}
                <div><Label>Annual Salary ($)</Label><Controller name="annualSalary" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                <div><Label>Current 401k Balance ($)</Label><Controller name="currentBalance" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle className="text-lg">Contributions & Growth</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div><Label>Your Contribution (%)</Label><Controller name="contributionPercent" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                <div><Label>Employer Match (%)</Label><Controller name="employerMatchPercent" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                <div><Label>Employer Match Up To (%)</Label><Controller name="matchUpToPercent" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                <div><Label>Estimated Annual Return (%)</Label><Controller name="annualReturn" control={control} render={({ field }) => <Input type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
            </CardContent>
        </Card>
        <Button type="submit" className="w-full">Calculate</Button>
      </div>

      {/* Results Column */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Projected 401(k) Balance</h3>
        {results ? (
            <div className="space-y-4">
                <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-sm text-muted-foreground">Balance at Retirement</p>
                        <p className="text-3xl font-bold">{formatCurrency(results.finalBalance)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <h4 className="font-semibold mb-4 text-center">Projected Growth</h4>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={results.schedule} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="age" name="Age" />
                              <YAxis tickFormatter={(value) => formatCurrency(value)} />
                              <Tooltip formatter={(value: number) => formatCurrency(value)} />
                              <Legend />
                              <Line type="monotone" dataKey="balance" name="Savings Balance" stroke="hsl(var(--primary))" dot={false} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        ) : (
             <div className="flex items-center justify-center h-60 bg-muted/50 rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">Enter your details to project your 401k growth</p>
            </div>
        )}
      </div>
    </form>
  );
}
