
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
import { Info, Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const formSchema = z.object({
  // Salaried Job
  currentSalary: z.number().min(0),
  employer401kMatch: z.number().min(0),
  healthInsuranceCost: z.number().min(0),

  // Freelance
  freelanceRate: z.number().min(1, "Hourly rate is required"),
  billableHoursPerWeek: z.number().min(1).max(100),
  businessExpenses: z.number().min(0),
  selfEmploymentTaxRate: z.number().min(0).max(100).default(15.3),
});

type FormData = z.infer<typeof formSchema>;

export default function ShouldIGoFreelanceCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

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
      chartData: [
        { name: 'Salaried', Compensation: totalSalaryComp },
        { name: 'Freelance', Compensation: netFreelanceIncome },
      ]
    });
    setFormData(data);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `freelance-vs-salary.${format}`;
    const { currentSalary, employer401kMatch, healthInsuranceCost, freelanceRate, billableHoursPerWeek, businessExpenses } = formData;

    if (format === 'txt') {
      content = `Freelance vs. Salary Comparison\n\n`;
      content += `Salaried Inputs:\n- Gross Salary: ${formatCurrency(currentSalary)}\n- 401k Match: ${formatCurrency(employer401kMatch)}\n\n`;
      content += `Freelance Inputs:\n- Hourly Rate: ${formatCurrency(freelanceRate)}\n- Billable Hours/Week: ${billableHoursPerWeek}\n- Business Expenses: ${formatCurrency(businessExpenses)}\n- Health Insurance Cost: ${formatCurrency(healthInsuranceCost)}\n\n`;
      content += `Results:\n- Total Salaried Compensation: ${formatCurrency(results.totalSalaryComp)}\n- Net Freelance Income: ${formatCurrency(results.netFreelanceIncome)}\n- Difference: ${formatCurrency(results.difference)}`;
    } else {
       content = `Category,Value\n`;
       content += `Salaried - Gross Salary,${currentSalary}\nSalaried - 401k Match,${employer401kMatch}\n`;
       content += `Freelance - Hourly Rate,${freelanceRate}\nFreelance - Billable Hours/Week,${billableHoursPerWeek}\nFreelance - Business Expenses,${businessExpenses}\nFreelance - Health Insurance,${healthInsuranceCost}\n`;
       content += `\nResult - Total Salaried Comp,${results.totalSalaryComp.toFixed(2)}\nResult - Net Freelance Income,${results.netFreelanceIncome.toFixed(2)}\nResult - Difference,${results.difference.toFixed(2)}`;
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
    <form onSubmit={handleSubmit(compareJobs)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <Card>
            <CardHeader><CardTitle>Current Salaried Job (Annual)</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div><Label>Gross Salary</Label><Controller name="currentSalary" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
                <div><Label>Employer 401k/Retirement Match</Label><Controller name="employer401kMatch" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle>Potential Freelance Work</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div><Label>Hourly Rate ($)</Label><Controller name="freelanceRate" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
                <div><Label>Billable Hours Per Week</Label><Controller name="billableHoursPerWeek" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
                <div><Label>Annual Business Expenses</Label><Controller name="businessExpenses" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
                <div><Label>Annual Health Insurance Cost</Label><Controller name="healthInsuranceCost" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
            </CardContent>
        </Card>
        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Compare</Button>
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
                    <CardHeader><CardTitle className="text-base text-center">Summary</CardTitle></CardHeader>
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
                 <Card>
                    <CardHeader><CardTitle className="text-base text-center">Visual Comparison</CardTitle></CardHeader>
                    <CardContent className="h-64">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={results.chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
                                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                <Bar dataKey="Compensation" fill="hsl(var(--primary))" />
                            </BarChart>
                        </ResponsiveContainer>
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
