
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
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
  currentAge: z.number().int().min(18, "Must be at least 18"),
  retirementAge: z.number().int().min(19, "Must be older than current age"),
  currentPensionPot: z.number().min(0, "Cannot be negative"),
  monthlyContribution: z.number().min(0, "Cannot be negative"),
  annualGrowthRate: z.number().min(0, "Cannot be negative"),
  annuityRate: z.number().min(0.1, "Annuity rate must be positive").max(20),
}).refine(data => data.retirementAge > data.currentAge, {
  message: "Retirement age must be after current age.",
  path: ["retirementAge"],
});

type FormData = z.infer<typeof formSchema>;

export default function PensionCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currentAge: 35,
      retirementAge: 67,
      currentPensionPot: 75000,
      monthlyContribution: 400,
      annualGrowthRate: 5,
      annuityRate: 5,
    },
  });

  const calculatePension = (data: FormData) => {
    const {
      currentAge,
      retirementAge,
      currentPensionPot,
      monthlyContribution,
      annualGrowthRate,
      annuityRate
    } = data;
    
    const yearsToRetirement = retirementAge - currentAge;
    const monthsToRetirement = yearsToRetirement * 12;
    const monthlyRate = annualGrowthRate / 100 / 12;

    let fvOfContributions = 0;
    if (monthlyRate > 0) {
        fvOfContributions = monthlyContribution * ( (Math.pow(1 + monthlyRate, monthsToRetirement) - 1) / monthlyRate );
    } else {
        fvOfContributions = monthlyContribution * monthsToRetirement;
    }

    const fvOfCurrentPot = currentPensionPot * Math.pow(1 + monthlyRate, monthsToRetirement);
    const projectedPensionPot = fvOfCurrentPot + fvOfContributions;
    const estimatedAnnualIncome = projectedPensionPot * (annuityRate / 100);

    const schedule = [];
    let balance = currentPensionPot;
    for (let year = 1; year <= yearsToRetirement; year++) {
        for (let month = 1; month <= 12; month++) {
            balance = balance * (1 + monthlyRate) + monthlyContribution;
        }
        schedule.push({
            age: currentAge + year,
            balance: balance,
        });
    }

    setResults({
      projectedPensionPot,
      estimatedAnnualIncome,
      schedule,
    });
    setFormData(data);
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `pension-calculation.${format}`;
    const { currentAge, retirementAge, currentPensionPot, monthlyContribution, annualGrowthRate, annuityRate } = formData;

    if (format === 'txt') {
      content = `Pension Calculation\n\nInputs:\n`;
      content += `- Current Age: ${currentAge}\n- Retirement Age: ${retirementAge}\n- Current Pension Pot: ${formatCurrency(currentPensionPot)}\n`;
      content += `- Monthly Contribution: ${formatCurrency(monthlyContribution)}\n- Annual Growth Rate: ${annualGrowthRate}%\n- Annuity Rate: ${annuityRate}%\n\n`;
      content += `Results:\n- Projected Pension Pot: ${formatCurrency(results.projectedPensionPot)}\n- Estimated Annual Income: ${formatCurrency(results.estimatedAnnualIncome)}\n`;
    } else {
      content = 'Category,Value\n';
      content += `Current Age,${currentAge}\nRetirement Age,${retirementAge}\nCurrent Pension Pot,${currentPensionPot}\n`;
      content += `Monthly Contribution,${monthlyContribution}\nAnnual Growth Rate (%),${annualGrowthRate}\nAnnuity Rate (%),${annuityRate}\n\n`;
      content += 'Result Category,Value\n';
      content += `Projected Pension Pot,${results.projectedPensionPot.toFixed(2)}\nEstimated Annual Income,${results.estimatedAnnualIncome.toFixed(2)}\n`;
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
    <form onSubmit={handleSubmit(calculatePension)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs Column */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Your Details</h3>
        <div className="grid grid-cols-2 gap-4">
            <div><Label>Current Age</Label><Controller name="currentAge" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))} />} /></div>
            <div><Label>Retirement Age</Label><Controller name="retirementAge" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))} />} /></div>
        </div>
        {errors.retirementAge && <p className="text-destructive text-sm mt-1">{errors.retirementAge.message}</p>}
        
        <h3 className="text-xl font-semibold pt-4">Pension & Contributions</h3>
        <div><Label>Current Pension Pot ($)</Label><Controller name="currentPensionPot" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
        <div><Label>Monthly Contribution ($)</Label><Controller name="monthlyContribution" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
        
        <h3 className="text-xl font-semibold pt-4">Assumptions</h3>
        <div><Label>Annual Growth Rate (%)</Label><Controller name="annualGrowthRate" control={control} render={({ field }) => <Input type="number" step="0.1" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
        <div><Label>Annuity Rate at Retirement (%)</Label><Controller name="annuityRate" control={control} render={({ field }) => <Input type="number" step="0.1" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
        
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
        <h3 className="text-xl font-semibold">Retirement Projections</h3>
        {results ? (
            <div className="space-y-4">
                 <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-sm text-muted-foreground">Projected Pension Pot</p>
                        <p className="text-3xl font-bold">{formatCurrency(results.projectedPensionPot)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-sm text-muted-foreground">Estimated Annual Income</p>
                        <p className="text-3xl font-bold">{formatCurrency(results.estimatedAnnualIncome)}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <h4 className="font-semibold mb-4 text-center">Pension Growth</h4>
                        <div className="h-60">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={results.schedule} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="age" name="Age" />
                              <YAxis tickFormatter={(value) => typeof value === 'number' ? formatCurrency(value) : ''} />
                              <Tooltip formatter={(value: number) => formatCurrency(value)} />
                              <Legend />
                              <Line type="monotone" dataKey="balance" name="Pension Value" stroke="hsl(var(--primary))" dot={false} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        ) : (
             <div className="flex items-center justify-center h-60 bg-muted/50 rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">Enter your pension details to see projections</p>
            </div>
        )}
      </div>
    </form>
  );
}
