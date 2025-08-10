
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info } from 'lucide-react';

const formSchema = z.object({
  // Salaried Job
  currentSalary: z.number().min(0),
  employer401kMatch: z.number().min(0),
  healthInsuranceCost: z.number().min(0),

  // Freelance
  freelanceRate: z.number().min(1, "Hourly rate is required"),
  billableHoursPerWeek: z.number().min(1).max(60),
  businessExpenses: z.number().min(0),
  selfEmploymentTaxRate: z.number().min(0).max(100).default(15.3),
});

type FormData = z.infer<typeof formSchema>;

export default function ShouldIGoFreelanceCalculator() {
  const [results, setResults] = useState<any>(null);

  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currentSalary: 80000,
      employer401kMatch: 4000,
      healthInsuranceCost: 6000,
      freelanceRate: 60,
      billableHoursPerWeek: 30,
      businessExpenses: 10000,
      selfEmploymentTaxRate: 15.3
    },
  });
  
  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const compareJobs = (data: FormData) => {
    // Salaried Compensation
    const totalSalaryComp = data.currentSalary + data.employer401kMatch;
    
    // Freelance Compensation
    const grossFreelanceIncome = data.freelanceRate * data.billableHoursPerWeek * 52;
    const selfEmploymentTax = (grossFreelanceIncome * 0.9235) * (data.selfEmploymentTaxRate / 100);
    const netFreelanceIncome = grossFreelanceIncome - data.businessExpenses - selfEmploymentTax - data.healthInsuranceCost;
    
    const difference = netFreelanceIncome - totalSalaryComp;

    setResults({
      totalSalaryComp,
      netFreelanceIncome,
      difference,
    });
  };

  return (
    <form onSubmit={handleSubmit(compareJobs)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <Card>
            <CardHeader><CardTitle>Current Salaried Job (Annual)</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div><Label>Gross Salary</Label><Controller name="currentSalary" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                <div><Label>Employer 401k/Retirement Match</Label><Controller name="employer401kMatch" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle>Potential Freelance Work</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div><Label>Hourly Rate ($)</Label><Controller name="freelanceRate" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                <div><Label>Billable Hours Per Week</Label><Controller name="billableHoursPerWeek" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                <div><Label>Annual Business Expenses</Label><Controller name="businessExpenses" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                <div><Label>Annual Health Insurance Cost</Label><Controller name="healthInsuranceCost" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
            </CardContent>
        </Card>
        <Button type="submit" className="w-full">Compare</Button>
      </div>
      {/* Results */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Comparison</h3>
        {results ? (
            <div className="space-y-4">
                <Alert variant={results.difference > 0 ? "default" : "destructive"} className={results.difference > 0 ? "border-green-500" : ""}>
                    <Info className="h-4 w-4" />
                    <AlertTitle>{results.difference > 0 ? "Freelance looks more profitable" : "Salaried job looks more profitable"}</AlertTitle>
                    <AlertDescription>
                        The estimated net freelance income is {formatCurrency(Math.abs(results.difference))} {results.difference > 0 ? 'higher' : 'lower'} than the total salaried compensation.
                    </AlertDescription>
                </Alert>
                <Card>
                    <CardContent className="p-4 grid grid-cols-2 gap-4 text-center">
                         <div>
                            <p className="text-muted-foreground">Total Salaried Compensation</p>
                            <p className="font-semibold text-xl">{formatCurrency(results.totalSalaryComp)}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Net Freelance Income</p>
                            <p className="font-semibold text-xl">{formatCurrency(results.netFreelanceIncome)}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        ) : (
          <div className="flex items-center justify-center h-60 bg-muted/50 rounded-lg border border-dashed">
            <p className="text-sm text-muted-foreground">Enter details to compare</p>
          </div>
        )}
      </div>
    </form>
  );
}
