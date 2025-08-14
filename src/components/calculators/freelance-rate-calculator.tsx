
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const formSchema = z.object({
  desiredIncome: z.number().min(1, "Desired income must be positive"),
  billableHoursPerWeek: z.number().min(1, "Billable hours must be at least 1").max(168),
  weeksOfVacation: z.number().min(0, "Vacation weeks cannot be negative").max(51),
  taxRate: z.number().min(0, "Tax rate cannot be negative").max(100),
});

type FormData = z.infer<typeof formSchema>;

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

export default function FreelanceRateCalculator() {
  const [results, setResults] = useState<any | null>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      desiredIncome: 80000,
      billableHoursPerWeek: 30,
      weeksOfVacation: 4,
      taxRate: 25,
    },
  });

  const calculateRate = (data: FormData) => {
    const workingWeeks = 52 - data.weeksOfVacation;
    const totalBillableHours = data.billableHoursPerWeek * workingWeeks;
    
    if (totalBillableHours <= 0) {
      setResults({ error: "Total billable hours must be positive. Check your hours and vacation inputs." });
      return;
    }

    const preTaxIncomeNeeded = data.desiredIncome / (1 - data.taxRate / 100);
    const hourlyRate = preTaxIncomeNeeded / totalBillableHours;
    const effectiveHourlyRate = data.desiredIncome / totalBillableHours;
    const taxPerHour = hourlyRate - effectiveHourlyRate;
    
    setResults({
      hourlyRate,
      effectiveHourlyRate,
      taxPerHour,
      chartData: [
        { name: 'Hourly Rate Breakdown', takeHome: effectiveHourlyRate, taxes: taxPerHour }
      ]
    });
    setFormData(data);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `freelance-rate-calculation.${format}`;
    const { desiredIncome, billableHoursPerWeek, weeksOfVacation, taxRate } = formData;

    if (format === 'txt') {
      content = `Freelance Rate Calculation\n\nInputs:\n- Desired Annual Income: ${formatCurrency(desiredIncome)}\n- Billable Hours Per Week: ${billableHoursPerWeek}\n- Weeks of Vacation: ${weeksOfVacation}\n- Tax Rate: ${taxRate}%\n\nResult:\n- Required Hourly Rate: ${formatCurrency(results.hourlyRate)}\n- Effective (Take-Home) Hourly Rate: ${formatCurrency(results.effectiveHourlyRate)}`;
    } else {
       content = `Category,Value\nDesired Annual Income,${desiredIncome}\nBillable Hours Per Week,${billableHoursPerWeek}\nWeeks of Vacation,${weeksOfVacation}\nTax Rate (%),${taxRate}\nRequired Hourly Rate,${results.hourlyRate.toFixed(2)}\nEffective Hourly Rate,${results.effectiveHourlyRate.toFixed(2)}`;
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
    <form onSubmit={handleSubmit(calculateRate)} className="grid lg:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Financial & Time Inputs</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
              <div><Label>Desired Annual Income ($)</Label><Controller name="desiredIncome" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
              <div><Label>Billable Hours per Week</Label><Controller name="billableHoursPerWeek" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
              <div><Label>Weeks of Vacation</Label><Controller name="weeksOfVacation" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
              <div><Label>Estimated Tax Rate (%)</Label><Controller name="taxRate" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
          </CardContent>
        </Card>
        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Find out my hourly rate</Button>
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

      {/* Results */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Your Required Rates</h3>
        {results ? (
            results.error ? (
                 <Card className="flex items-center justify-center h-40 bg-muted/50 border-dashed"><p className="text-destructive text-center p-4">{results.error}</p></Card>
            ) : (
                <div className="space-y-4">
                    <Card>
                        <CardContent className="p-4 grid grid-cols-2 gap-4 text-center">
                            <div>
                                <p className="text-muted-foreground">Hourly Rate</p>
                                <p className="text-2xl font-bold">{formatCurrency(results.hourlyRate)}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Effective (Take-Home) Rate</p>
                                <p className="text-2xl font-bold">{formatCurrency(results.effectiveHourlyRate)}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base text-center">Hourly Rate Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={results.chartData} layout="vertical" barSize={40}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
                                    <YAxis type="category" dataKey="name" hide />
                                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                    <Legend />
                                    <Bar dataKey="takeHome" stackId="a" fill="hsl(var(--chart-2))" name="Take-Home" />
                                    <Bar dataKey="taxes" stackId="a" fill="hsl(var(--destructive))" name="Taxes" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
            )
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter your details to calculate your rate</p></div>
        )}
      </div>
    </form>
  );
}
