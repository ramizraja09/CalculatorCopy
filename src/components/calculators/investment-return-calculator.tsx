
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const formSchema = z.object({
  startingAmount: z.number().min(0, "Starting amount cannot be negative"),
  years: z.number().int().min(1, "Must invest for at least 1 year"),
  returnRate: z.number().min(0, "Return rate cannot be negative"),
  compoundFrequency: z.string().nonempty(),
  additionalContribution: z.number().min(0, "Contribution cannot be negative"),
  contributionFrequency: z.string().nonempty(),
  contributionTiming: z.enum(['beginning', 'end']),
});

type FormData = z.infer<typeof formSchema>;

const compoundPeriods: { [key: string]: number } = {
  annually: 1,
  semiannually: 2,
  quarterly: 4,
  monthly: 12,
  semimonthly: 24,
  biweekly: 26,
  weekly: 52,
  daily: 365,
};

const contributionPeriods: { [key: string]: number } = {
  annually: 1,
  semiannually: 2,
  quarterly: 4,
  monthly: 12,
};

const PIE_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))'];

export default function InvestmentReturnCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      startingAmount: 20000,
      years: 10,
      returnRate: 6,
      compoundFrequency: 'annually',
      additionalContribution: 12000,
      contributionFrequency: 'annually',
      contributionTiming: 'end',
    },
  });

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const calculateInvestment = (data: FormData) => {
    const {
      startingAmount,
      years,
      returnRate,
      compoundFrequency,
      additionalContribution,
      contributionFrequency,
      contributionTiming,
    } = data;
    
    const rate = returnRate / 100;
    const n = compoundPeriods[compoundFrequency];
    const p = contributionPeriods[contributionFrequency];
    const pmt = additionalContribution / p;
    
    const schedule = [];
    let balance = startingAmount;
    let totalContributions = startingAmount;
    let totalInterest = 0;
    let yearlyInterest = 0;
    let yearlyContribution = 0;

    for (let year = 1; year <= years; year++) {
      yearlyInterest = 0;
      yearlyContribution = 0;
      let yearStartBalance = balance;
      
      for(let period = 1; period <= p; period++) {
        if(contributionTiming === 'beginning') {
          balance += pmt;
          yearlyContribution += pmt;
        }

        const periodsInContributionInterval = n / p;
        for(let i = 0; i < periodsInContributionInterval; i++) {
           const interestThisPeriod = balance * (rate / n);
           balance += interestThisPeriod;
           yearlyInterest += interestThisPeriod;
        }

        if(contributionTiming === 'end') {
          balance += pmt;
          yearlyContribution += pmt;
        }
      }
      
      totalContributions += yearlyContribution;
      totalInterest += yearlyInterest;
      
      schedule.push({
        year,
        startBalance: yearStartBalance,
        deposits: yearlyContribution,
        interestEarned: yearlyInterest,
        endBalance: balance,
        totalInterest,
        totalContributions
      });
    }

    setResults({
      endBalance: balance,
      startingAmount,
      totalContributions: totalContributions - startingAmount,
      totalInterest,
      schedule,
      pieData: [
        { name: 'Starting Amount', value: startingAmount },
        { name: 'Total Contributions', value: totalContributions - startingAmount },
        { name: 'Total Interest', value: totalInterest },
      ],
    });
    setFormData(data);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `investment-return-calculation.${format}`;

    if (format === 'txt') {
      content = `Investment Return Calculation\n\nInputs:\n`;
      Object.entries(formData).forEach(([key, value]) => content += `- ${key}: ${value}\n`);
      content += `\nResults:\n`;
      content += `- End Balance: ${formatCurrency(results.endBalance)}\n`;
      content += `- Starting Amount: ${formatCurrency(results.startingAmount)}\n`;
      content += `- Total Contributions: ${formatCurrency(results.totalContributions)}\n`;
      content += `- Total Interest: ${formatCurrency(results.totalInterest)}\n`;
    } else {
      content = 'Category,Value\n';
      Object.entries(formData).forEach(([key, value]) => content += `${key},${value}\n`);
      content += '\nResult Category,Value\n';
      content += `End Balance,${results.endBalance.toFixed(2)}\n`;
      content += `Starting Amount,${results.startingAmount.toFixed(2)}\n`;
      content += `Total Contributions,${results.totalContributions.toFixed(2)}\n`;
      content += `Total Interest,${results.totalInterest.toFixed(2)}\n`;
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
    <form onSubmit={handleSubmit(calculateInvestment)}>
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader><CardTitle>Investment Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Starting Amount ($)</Label><Controller name="startingAmount" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
              <div><Label>After (years)</Label><Controller name="years" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />} /></div>
              <div><Label>Return Rate (%)</Label><Controller name="returnRate" control={control} render={({ field }) => <Input type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
              <div><Label>Compound</Label><Controller name="compoundFrequency" control={control} render={({ field }) => (<Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.keys(compoundPeriods).map(freq => <SelectItem key={freq} value={freq} className="capitalize">{freq}</SelectItem>)}</SelectContent></Select>)} /></div>
              <div><Label>Additional Contribution ($)</Label><Controller name="additionalContribution" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
              <div><Label>Contribution Frequency</Label><Controller name="contributionFrequency" control={control} render={({ field }) => (<Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.keys(contributionPeriods).map(freq => <SelectItem key={freq} value={freq} className="capitalize">{freq}</SelectItem>)}</SelectContent></Select>)} /></div>
              <div><Label>Contribute at the...</Label><Controller name="contributionTiming" control={control} render={({ field }) => (
                  <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4 pt-2">
                      <div className="flex items-center space-x-2"><RadioGroupItem value="beginning" id="beginning" /><Label htmlFor="beginning">Beginning</Label></div>
                      <div className="flex items-center space-x-2"><RadioGroupItem value="end" id="end" /><Label htmlFor="end">End</Label></div>
                  </RadioGroup>
              )} /></div>
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

        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xl font-semibold">Results</h3>
          {results ? (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div><p className="text-sm text-muted-foreground">End Balance</p><p className="font-bold text-lg">{formatCurrency(results.endBalance)}</p></div>
                  <div><p className="text-sm text-muted-foreground">Starting Amount</p><p className="font-bold text-lg">{formatCurrency(results.startingAmount)}</p></div>
                  <div><p className="text-sm text-muted-foreground">Total Contributions</p><p className="font-bold text-lg">{formatCurrency(results.totalContributions)}</p></div>
                  <div><p className="text-sm text-muted-foreground">Total Interest</p><p className="font-bold text-lg">{formatCurrency(results.totalInterest)}</p></div>
                </CardContent>
              </Card>
              <div className="grid md:grid-cols-2 gap-4">
                  <Card><CardHeader><CardTitle className="text-base text-center">Balance Breakdown</CardTitle></CardHeader>
                    <CardContent className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={results.pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label>
                                    {results.pieData.map((_entry: any, index: number) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                                </Pie>
                                <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                                <Legend iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                  </Card>
                  <Card><CardHeader><CardTitle className="text-base text-center">Growth Over Time</CardTitle></CardHeader>
                    <CardContent className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={results.schedule} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="year" />
                                <YAxis tickFormatter={(val) => `$${(val/1000)}k`} />
                                <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                                <Legend />
                                <Bar dataKey="startBalance" stackId="a" fill="hsl(var(--chart-1))" name="Starting Amount" />
                                <Bar dataKey="deposits" stackId="a" fill="hsl(var(--chart-2))" name="Contributions" />
                                <Bar dataKey="interestEarned" stackId="a" fill="hsl(var(--chart-3))" name="Interest" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                  </Card>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full min-h-[30rem] bg-muted/50 rounded-lg border border-dashed"><p>Enter details to see results</p></div>
          )}
        </div>
      </div>
      {results && (
        <div className="lg:col-span-3 mt-4">
            <h3 className="text-xl font-semibold mb-4">Accumulation Schedule</h3>
             <Card>
                <CardContent className="p-0">
                    <ScrollArea className="h-96">
                        <Table><TableHeader className="sticky top-0 bg-muted">
                            <TableRow><TableHead>Year</TableHead><TableHead className="text-right">Deposits</TableHead><TableHead className="text-right">Interest</TableHead><TableHead className="text-right">Ending Balance</TableHead></TableRow>
                            </TableHeader>
                            <TableBody>
                                {results.schedule.map((row: any) => (
                                    <TableRow key={row.year}><TableCell>{row.year}</TableCell><TableCell className="text-right">{formatCurrency(row.deposits)}</TableCell><TableCell className="text-right">{formatCurrency(row.interestEarned)}</TableCell><TableCell className="text-right">{formatCurrency(row.endBalance)}</TableCell></TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
             </Card>
        </div>
      )}
    </form>
  );
}

