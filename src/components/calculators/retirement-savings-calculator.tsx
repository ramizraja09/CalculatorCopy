
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Info, Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const formSchema = z.object({
  currentAge: z.number().int().min(18, "Must be at least 18"),
  retirementAge: z.number().int().min(19, "Must be older than current age"),
  currentSavings: z.number().min(0, "Cannot be negative"),
  monthlyContribution: z.number().min(0, "Cannot be negative"),
  preRetirementROR: z.number().min(0, "Cannot be negative"),
  postRetirementROR: z.number().min(0, "Cannot be negative"),
  desiredAnnualIncome: z.number().min(1, "Must be positive"),
  drawdownYears: z.number().int().min(1, "Must be at least 1 year"),
}).refine(data => data.retirementAge > data.currentAge, {
  message: "Retirement age must be after current age.",
  path: ["retirementAge"],
});

type FormData = z.infer<typeof formSchema>;

export default function RetirementSavingsCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currentAge: 30,
      retirementAge: 65,
      currentSavings: 50000,
      monthlyContribution: 500,
      preRetirementROR: 7,
      postRetirementROR: 4,
      desiredAnnualIncome: 60000,
      drawdownYears: 25,
    },
  });

  const calculateSavings = (data: FormData) => {
    const {
      currentAge,
      retirementAge,
      currentSavings,
      monthlyContribution,
      preRetirementROR,
      postRetirementROR,
      desiredAnnualIncome,
      drawdownYears,
    } = data;
    
    const yearsToRetirement = retirementAge - currentAge;
    const monthsToRetirement = yearsToRetirement * 12;
    const monthlyPreRetirementRate = preRetirementROR / 100 / 12;
    const monthlyPostRetirementRate = postRetirementROR / 100 / 12;

    // Calculate projected savings
    const fvOfCurrentSavings = currentSavings * Math.pow(1 + monthlyPreRetirementRate, monthsToRetirement);

    let fvOfContributions = 0;
    if (monthlyPreRetirementRate > 0) {
        fvOfContributions = monthlyContribution * ( (Math.pow(1 + monthlyPreRetirementRate, monthsToRetirement) - 1) / monthlyPreRetirementRate );
    } else {
        fvOfContributions = monthlyContribution * monthsToRetirement;
    }
    const projectedNestEgg = fvOfCurrentSavings + fvOfContributions;

    // Calculate required savings (PV of an annuity)
    let requiredNestEgg = 0;
    if (monthlyPostRetirementRate > 0) {
        requiredNestEgg = (desiredAnnualIncome / 12) * ( (1 - Math.pow(1 + monthlyPostRetirementRate, -(drawdownYears * 12))) / monthlyPostRetirementRate );
    } else {
        requiredNestEgg = (desiredAnnualIncome / 12) * (drawdownYears * 12);
    }
    
    const shortfall = requiredNestEgg - projectedNestEgg;

    // Chart data
    const schedule = [];
    let balance = currentSavings;
    for (let year = 1; year <= yearsToRetirement; year++) {
        for (let month = 1; month <= 12; month++) {
            balance = balance * (1 + monthlyPreRetirementRate) + monthlyContribution;
        }
        schedule.push({
            age: currentAge + year,
            balance: balance,
        });
    }

    setResults({
      projectedNestEgg,
      requiredNestEgg,
      shortfall,
      schedule,
      error: null,
    });
    setFormData(data);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `retirement-savings-calculation.${format}`;

    if (format === 'txt') {
        content = `Retirement Savings Calculation\n\nInputs:\n`;
        Object.entries(formData).forEach(([key, value]) => {
            content += `- ${key}: ${value}\n`;
        });
        content += `\nResults:\n`;
        content += `- Projected Nest Egg: ${formatCurrency(results.projectedNestEgg)}\n`;
        content += `- Required Nest Egg: ${formatCurrency(results.requiredNestEgg)}\n`;
        content += `- Shortfall/Surplus: ${formatCurrency(results.shortfall)}\n`;
    } else {
        content = 'Category,Value\n';
        Object.entries(formData).forEach(([key, value]) => {
            content += `${key},${value}\n`;
        });
        content += '\nResult Category,Value\n';
        content += `Projected Nest Egg,${results.projectedNestEgg.toFixed(2)}\n`;
        content += `Required Nest Egg,${results.requiredNestEgg.toFixed(2)}\n`;
        content += `Shortfall/Surplus,${results.shortfall.toFixed(2)}\n`;
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

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  return (
    <form onSubmit={handleSubmit(calculateSavings)}>
      <div className="grid md:grid-cols-2 gap-8">
        {/* Inputs Column */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Your Details</h3>
          <div className="grid grid-cols-2 gap-4">
              <div><Label htmlFor="currentAge">Current Age</Label><Controller name="currentAge" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))} />} /></div>
              <div><Label htmlFor="retirementAge">Retirement Age</Label><Controller name="retirementAge" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))} />} /></div>
          </div>
          {errors.retirementAge && <p className="text-destructive text-sm mt-1">{errors.retirementAge.message}</p>}
          
          <h3 className="text-xl font-semibold pt-4">Savings & Investments</h3>
          <div><Label htmlFor="currentSavings">Current Savings ($)</Label><Controller name="currentSavings" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
          <div><Label htmlFor="monthlyContribution">Monthly Contribution ($)</Label><Controller name="monthlyContribution" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
          <div><Label htmlFor="preRetirementROR">Pre-Retirement Rate of Return (%)</Label><Controller name="preRetirementROR" control={control} render={({ field }) => <Input type="number" step="0.1" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
          
          <h3 className="text-xl font-semibold pt-4">Retirement Goals</h3>
          <div><Label htmlFor="desiredAnnualIncome">Desired Annual Income ($)</Label><Controller name="desiredAnnualIncome" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
          <div><Label htmlFor="drawdownYears">Years in Retirement</Label><Controller name="drawdownYears" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))} />} /></div>
          <div><Label htmlFor="postRetirementROR">Post-Retirement Rate of Return (%)</Label><Controller name="postRetirementROR" control={control} render={({ field }) => <Input type="number" step="0.1" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
          
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
          <h3 className="text-xl font-semibold">Results</h3>
          {results ? (
              <div className="space-y-4">
                  <Alert variant={results.shortfall > 0 ? "destructive" : "default"} className={results.shortfall <= 0 ? "border-green-500" : ""}>
                      <Info className="h-4 w-4" />
                      <AlertTitle>{results.shortfall > 0 ? "You have a projected shortfall" : "You are on track for retirement!"}</AlertTitle>
                      <AlertDescription>
                          Your projected savings of <strong className="font-semibold">{formatCurrency(results.projectedNestEgg)}</strong> is {results.shortfall > 0 ? "less" : "more"} than your required nest egg of <strong className="font-semibold">{formatCurrency(results.requiredNestEgg)}</strong>.
                          The difference is <strong className="font-semibold">{formatCurrency(Math.abs(results.shortfall))}</strong>.
                      </AlertDescription>
                  </Alert>
              </div>
          ) : (
              <div className="flex items-center justify-center h-60 bg-muted/50 rounded-lg border border-dashed">
                  <p className="text-sm text-muted-foreground">Enter your details to project your retirement savings</p>
              </div>
          )}
        </div>
      </div>
      {results && (
        <div className="md:col-span-2 mt-8">
            <h3 className="text-xl font-semibold mb-4">Projected Savings Growth</h3>
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
