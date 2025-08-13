
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
import { Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
  const [formData, setFormData] = useState<FormData | null>(null);

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
      let currentYearSalary = annualSalary; // In a more complex model, this could increase annually
      const currentEmployeeContributionMonthly = (currentYearSalary * (contributionPercent / 100)) / 12;
      const currentEmployerMatchable = (currentYearSalary * (matchUpToPercent / 100)) / 12;
      const currentEmployerMatch = Math.min(currentEmployeeContributionMonthly, currentEmployerMatchable) * (employerMatchPercent / 100);
      const currentTotalMonthly = currentEmployeeContributionMonthly + currentEmployerMatch;

      for (let month = 1; month <= 12; month++) {
        balance = balance * (1 + monthlyRate) + currentTotalMonthly;
      }
      schedule.push({ age: currentAge + year, balance });
    }

    setResults({
      finalBalance: balance,
      totalContributions: currentBalance + (totalMonthlyContribution * 12 * yearsToRetirement), // Simplified total
      schedule,
      error: null,
    });
    setFormData(data);
  };
  
  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `401k-calculation.${format}`;
    const { currentAge, retirementAge, currentBalance, annualSalary, contributionPercent, employerMatchPercent, matchUpToPercent, annualReturn } = formData;

    if (format === 'txt') {
      content = `401k Calculation\n\nInputs:\n`;
      content += `- Current Age: ${currentAge}\n- Retirement Age: ${retirementAge}\n- Current Balance: ${formatCurrency(currentBalance)}\n`;
      content += `- Annual Salary: ${formatCurrency(annualSalary)}\n- Your Contribution: ${contributionPercent}%\n- Employer Match: ${employerMatchPercent}%\n- Match Up To: ${matchUpToPercent}%\n- Annual Return: ${annualReturn}%\n\n`;
      content += `Result:\n- Balance at Retirement: ${formatCurrency(results.finalBalance)}`;
    } else {
      content = 'Category,Value\nCurrent Age,' + currentAge + '\nRetirement Age,' + retirementAge + '\nCurrent Balance,' + currentBalance + '\nAnnual Salary,' + annualSalary + '\nContribution (%),' + contributionPercent + '\nEmployer Match (%),' + employerMatchPercent + '\nMatch Up To (%),' + matchUpToPercent + '\nAnnual Return (%),' + annualReturn + '\n\nResult - Balance at Retirement,' + results.finalBalance;
    }

    const blob = new Blob([content], { type: `text/${format}` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };


  return (
    <form onSubmit={handleSubmit(calculate401k)}>
      <div className="grid md:grid-cols-2 gap-8">
        {/* Inputs Column */}
        <div className="space-y-4">
          <Card>
              <CardHeader><CardTitle className="text-lg">Your Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                      <div><Label>Current Age</Label><Controller name="currentAge" control={control} render={({ field }) => <Input type="number" placeholder="30" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))} />} /></div>
                      <div><Label>Retirement Age</Label><Controller name="retirementAge" control={control} render={({ field }) => <Input type="number" placeholder="67" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))} />} /></div>
                  </div>
                  {errors.retirementAge && <p className="text-destructive text-sm">{errors.retirementAge.message}</p>}
                  <div><Label>Annual Salary ($)</Label><Controller name="annualSalary" control={control} render={({ field }) => <Input type="number" placeholder="80000" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
                  <div><Label>Current 401k Balance ($)</Label><Controller name="currentBalance" control={control} render={({ field }) => <Input type="number" placeholder="50000" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
              </CardContent>
          </Card>
          <Card>
              <CardHeader><CardTitle className="text-lg">Contributions & Growth</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                  <div><Label>Your Contribution (%)</Label><Controller name="contributionPercent" control={control} render={({ field }) => <Input type="number" placeholder="10" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
                  <div><Label>Employer Match (%)</Label><Controller name="employerMatchPercent" control={control} render={({ field }) => <Input type="number" placeholder="50" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
                  <div><Label>Employer Match Up To (%)</Label><Controller name="matchUpToPercent" control={control} render={({ field }) => <Input type="number" placeholder="6" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
                  <div><Label>Estimated Annual Return (%)</Label><Controller name="annualReturn" control={control} render={({ field }) => <Input type="number" step="0.1" placeholder="7" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
              </CardContent>
          </Card>
          <div className="flex gap-2">
              <Button type="submit" className="flex-1">Calculate</Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" disabled={!results}>
                    <Download className="mr-2 h-4 w-4" /> Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleExport('txt')}>Download as .txt</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('csv')}>Download as .csv</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
          </div>
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
              </div>
          ) : (
              <div className="flex items-center justify-center h-60 bg-muted/50 rounded-lg border border-dashed">
                  <p className="text-sm text-muted-foreground">Enter your details to project your 401k growth</p>
              </div>
          )}
        </div>
      </div>
      
      {results && (
        <div className="col-span-1 md:col-span-2 mt-8">
            <h3 className="text-xl font-semibold mb-4">Projected Growth</h3>
            <Card>
                <CardContent className="p-4">
                    <div className="h-96">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={results.schedule} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="age" name="Age" />
                          <YAxis tickFormatter={(value) => typeof value === 'number' ? formatCurrency(value) : ''} />
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                          <Legend />
                          <Line type="monotone" dataKey="balance" name="Savings Balance" stroke="hsl(var(--primary))" dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
      )}
    </form>
  );
}
