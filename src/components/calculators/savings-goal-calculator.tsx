
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const formSchema = z.object({
  initialDeposit: z.number().min(0, "Initial deposit cannot be negative"),
  annualContribution: z.number().min(0),
  annualIncrease: z.number().min(0),
  monthlyContribution: z.number().min(0),
  monthlyIncrease: z.number().min(0),
  interestRate: z.number().min(0, "Interest rate cannot be negative"),
  compoundFrequency: z.string(),
  yearsToSave: z.number().int().min(1, "Must be at least 1 year"),
  taxRate: z.number().min(0).max(100),
});

type FormData = z.infer<typeof formSchema>;
const PIE_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))'];

export default function SavingsGoalCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      initialDeposit: 20000,
      annualContribution: 5000,
      annualIncrease: 3,
      monthlyContribution: 0,
      monthlyIncrease: 0,
      interestRate: 3,
      compoundFrequency: 'annually',
      yearsToSave: 10,
      taxRate: 0,
    },
  });

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const calculateSavings = (data: FormData) => {
    const { 
        initialDeposit, annualContribution, annualIncrease, monthlyContribution, monthlyIncrease,
        interestRate, compoundFrequency, yearsToSave, taxRate
    } = data;
    
    const n = { 'annually': 1, 'semiannually': 2, 'quarterly': 4, 'monthly': 12 }[compoundFrequency] || 1;
    const rate = interestRate / 100;
    const tax = taxRate / 100;
    
    let balance = initialDeposit;
    let totalContributions = 0;
    let totalInterest = 0;
    let currentAnnualContribution = annualContribution;
    let currentMonthlyContribution = monthlyContribution;

    for (let year = 1; year <= yearsToSave; year++) {
        const yearlyContributionsFromMonthly = currentMonthlyContribution * 12;
        totalContributions += currentAnnualContribution + yearlyContributionsFromMonthly;

        let yearlyInterest = 0;
        let balanceAtStartOfYear = balance;

        // Add contributions at the beginning of the period for interest calculation
        balance += currentAnnualContribution + yearlyContributionsFromMonthly;

        for (let period = 0; period < n; period++) {
            const interestForPeriod = (balance) * (rate / n);
            const taxForPeriod = interestForPeriod * tax;
            yearlyInterest += interestForPeriod - taxForPeriod;
            balance += interestForPeriod - taxForPeriod;
        }

        totalInterest += yearlyInterest;
        
        // Increase contributions for next year
        currentAnnualContribution *= (1 + annualIncrease / 100);
        currentMonthlyContribution *= (1 + monthlyIncrease / 100);
    }
    
    setResults({
        endBalance: balance,
        initialDeposit,
        totalContributions,
        totalInterest,
        pieData: [
            { name: 'Initial Deposit', value: initialDeposit },
            { name: 'Contributions', value: totalContributions },
            { name: 'Interest', value: totalInterest },
        ].filter(item => item.value > 0),
        error: null,
    });
    setFormData(data);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `savings-calculation.${format}`;
    const allData = {...formData, ...results};
    
    if (format === 'txt') {
        content = `Savings Calculation\n\nInputs:\n`;
        Object.entries(formData).forEach(([key, value]) => content += `- ${key}: ${value}\n`);
        content += `\nResults:\n`;
        content += `- End Balance: ${formatCurrency(results.endBalance)}\n- Initial Deposit: ${formatCurrency(results.initialDeposit)}\n- Total Contributions: ${formatCurrency(results.totalContributions)}\n- Total Interest Earned: ${formatCurrency(results.totalInterest)}\n`;
    } else {
        content = 'Category,Value\n';
        Object.entries(formData).forEach(([key, value]) => content += `${key},${value}\n`);
        content += '\nResult Category,Value\n';
        content += `End Balance,${results.endBalance.toFixed(2)}\nInitial Deposit,${results.initialDeposit.toFixed(2)}\nTotal Contributions,${results.totalContributions.toFixed(2)}\nTotal Interest Earned,${results.totalInterest.toFixed(2)}\n`;
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
    <form onSubmit={handleSubmit(calculateSavings)} className="grid md:grid-cols-2 gap-8">
      <div className="space-y-4">
        <Card>
            <CardHeader><CardTitle>Savings Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div><Label>Initial deposit ($)</Label><Controller name="initialDeposit" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                <div><Label>Annual contribution ($)</Label><Controller name="annualContribution" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                <div><Label>Annual increase (%)</Label><Controller name="annualIncrease" control={control} render={({ field }) => <Input type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                <div><Label>Monthly contribution ($)</Label><Controller name="monthlyContribution" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                <div><Label>Monthly increase (%)</Label><Controller name="monthlyIncrease" control={control} render={({ field }) => <Input type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                <div><Label>Interest rate (%)</Label><Controller name="interestRate" control={control} render={({ field }) => <Input type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                <div><Label>Compound</Label><Controller name="compoundFrequency" control={control} render={({ field }) => (<Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="annually">Annually</SelectItem><SelectItem value="semiannually">Semiannually</SelectItem><SelectItem value="quarterly">Quarterly</SelectItem><SelectItem value="monthly">Monthly</SelectItem></SelectContent></Select>)} /></div>
                <div><Label>Years to save</Label><Controller name="yearsToSave" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />} /></div>
                <div><Label>Tax rate (%)</Label><Controller name="taxRate" control={control} render={({ field }) => <Input type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
            </CardContent>
        </Card>
        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Calculate</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="outline" disabled={!results}><Download className="mr-2 h-4 w-4" /> Export</Button></DropdownMenuTrigger>
              <DropdownMenuContent><DropdownMenuItem onClick={() => handleExport('txt')}>Download .txt</DropdownMenuItem><DropdownMenuItem onClick={() => handleExport('csv')}>Download .csv</DropdownMenuItem></DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Results</h3>
        {results ? (
            <div className="space-y-4">
                <Card>
                    <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between font-bold"><p>End balance</p><p>{formatCurrency(results.endBalance)}</p></div>
                        <div className="flex justify-between"><p>Initial deposit</p><p>{formatCurrency(results.initialDeposit)}</p></div>
                        <div className="flex justify-between"><p>Total contributions</p><p>{formatCurrency(results.totalContributions)}</p></div>
                        <div className="flex justify-between"><p>Total interest earned</p><p>{formatCurrency(results.totalInterest)}</p></div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={results.pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} label={({ percent }) => `${(percent * 100).toFixed(0)}%`}>
                                    {results.pieData.map((_entry: any, index: number) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                                </Pie>
                                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                <Legend iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        ) : (
            <div className="flex items-center justify-center h-full min-h-[30rem] bg-muted/50 rounded-lg border border-dashed"><p>Enter details to see results</p></div>
        )}
      </div>
    </form>
  );
}
