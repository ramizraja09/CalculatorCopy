
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const formSchema = z.object({
  initialInvestment: z.number().min(0),
  annualContribution: z.number().min(0),
  monthlyContribution: z.number().min(0),
  contributionTiming: z.enum(['beginning', 'end']),
  interestRate: z.number().min(0),
  investmentLengthYears: z.number().int().min(0),
  investmentLengthMonths: z.number().int().min(0).max(11),
  compoundFrequency: z.enum(['annually', 'semiannually', 'quarterly', 'monthly']),
  taxRate: z.number().min(0).max(100),
  inflationRate: z.number().min(0).max(100),
}).refine(data => data.investmentLengthYears > 0 || data.investmentLengthMonths > 0, {
    message: "Investment length must be greater than 0.",
    path: ["investmentLengthYears"],
});

type FormData = z.infer<typeof formSchema>;

const PIE_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))'];

export default function InterestCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      initialInvestment: 20000,
      annualContribution: 5000,
      monthlyContribution: 0,
      contributionTiming: 'beginning',
      interestRate: 5,
      investmentLengthYears: 5,
      investmentLengthMonths: 0,
      compoundFrequency: 'annually',
      taxRate: 0,
      inflationRate: 3,
    },
  });

  const calculateCompoundInterest = (data: FormData) => {
    const { 
        initialInvestment, annualContribution, monthlyContribution, contributionTiming,
        interestRate, investmentLengthYears, investmentLengthMonths,
        compoundFrequency, taxRate, inflationRate
    } = data;
    
    const n = { 'annually': 1, 'semiannually': 2, 'quarterly': 4, 'monthly': 12 }[compoundFrequency];
    const totalMonths = investmentLengthYears * 12 + investmentLengthMonths;
    const totalYears = totalMonths / 12;
    
    const periodicRate = (interestRate / 100) / n;
    const effectiveTaxRate = taxRate / 100;

    let balance = initialInvestment;
    let totalPrincipal = initialInvestment;
    let totalContributions = 0;
    let totalInterest = 0;
    let interestFromInitial = 0;
    let interestFromContributions = 0;
    const schedule = [];

    let tempBalanceInitial = initialInvestment;

    for (let year = 1; year <= Math.ceil(totalYears); year++) {
      const yearStartBalance = balance;
      let yearlyDeposit = annualContribution + (monthlyContribution * 12);

      if (contributionTiming === 'beginning') {
        balance += yearlyDeposit;
      }
      
      const interestForYear = balance * periodicRate;
      const taxOnInterest = interestForYear * effectiveTaxRate;
      const netInterest = interestForYear - taxOnInterest;
      
      balance += netInterest;

      if (contributionTiming === 'end') {
          balance += yearlyDeposit;
      }

      totalContributions += yearlyDeposit;
      totalPrincipal += yearlyDeposit;
      totalInterest += netInterest;

      const currentInterestFromInitial = (tempBalanceInitial * (Math.pow(1 + periodicRate, n) - 1)) * (1 - effectiveTaxRate);
      interestFromInitial += currentInterestFromInitial;
      tempBalanceInitial += currentInterestFromInitial;
      interestFromContributions = totalInterest - interestFromInitial;

      schedule.push({
        year,
        deposit: yearlyDeposit,
        interest: netInterest,
        endingBalance: balance,
        initialInvestmentPortion: tempBalanceInitial,
        contributionsPortion: totalContributions,
        interestPortion: totalInterest,
      });
    }

    const buyingPower = balance / Math.pow(1 + (inflationRate / 100), totalYears);
    
    setResults({
      endingBalance: balance,
      totalPrincipal,
      totalContributions,
      totalInterest,
      interestOfInitialInvestment: interestFromInitial,
      interestOfContributions: interestFromContributions,
      buyingPower,
      schedule,
      pieData: [
        { name: 'Initial Investment', value: initialInvestment },
        { name: 'Contributions', value: totalContributions },
        { name: 'Interest', value: totalInterest },
      ].filter(item => item.value > 0),
    });
    setFormData(data);
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `compound-interest-calculation.${format}`;

    if (format === 'txt') {
        content = `Compound Interest Calculation\n\nInputs:\n`;
        Object.entries(formData).forEach(([key, value]) => content += `- ${key}: ${value}\n`);
        content += `\nResults:\n`;
        Object.entries(results).forEach(([key, value]) => {
          if (typeof value === 'number') content += `- ${key}: ${formatCurrency(value)}\n`;
        });
    } else {
        content = 'Category,Value\n';
        Object.entries(formData).forEach(([key, value]) => content += `${key},${value}\n`);
        content += '\nResult Category,Value\n';
        Object.entries(results).forEach(([key, value]) => {
            if (typeof value === 'number') content += `${key},${value.toFixed(2)}\n`;
        });
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
    <form onSubmit={handleSubmit(calculateCompoundInterest)}>
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Inputs Column */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader><CardTitle>Investment Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div><Label>Initial investment ($)</Label><Controller name="initialInvestment" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                <div><Label>Annual contribution ($)</Label><Controller name="annualContribution" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                <div><Label>Monthly contribution ($)</Label><Controller name="monthlyContribution" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                <div><Label>Contribute at the...</Label><Controller name="contributionTiming" control={control} render={({ field }) => (
                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4 pt-2">
                        <div className="flex items-center space-x-2"><RadioGroupItem value="beginning" id="beginning" /><Label htmlFor="beginning">Beginning</Label></div>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="end" id="end" /><Label htmlFor="end">End</Label></div>
                    </RadioGroup>
                )} /></div>
                <div><Label>Interest rate (%)</Label><Controller name="interestRate" control={control} render={({ field }) => <Input type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                <div><Label>Compound</Label><Controller name="compoundFrequency" control={control} render={({ field }) => (<Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="annually">Annually</SelectItem><SelectItem value="semiannually">Semiannually</SelectItem><SelectItem value="quarterly">Quarterly</SelectItem><SelectItem value="monthly">Monthly</SelectItem></SelectContent></Select>)} /></div>
                <div><Label>Investment length</Label><div className="flex gap-2">
                    <Controller name="investmentLengthYears" control={control} render={({ field }) => <Input type="number" placeholder="Years" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />} />
                    <Controller name="investmentLengthMonths" control={control} render={({ field }) => <Input type="number" placeholder="Months" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />} /></div>
                </div>
                <div><Label>Tax rate (%)</Label><Controller name="taxRate" control={control} render={({ field }) => <Input type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                <div><Label>Inflation rate (%)</Label><Controller name="inflationRate" control={control} render={({ field }) => <Input type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
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

        {/* Results Column */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xl font-semibold">Results</h3>
          {results ? (
            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-lg">Summary</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between font-bold"><p>Ending balance</p><p>{formatCurrency(results.endingBalance)}</p></div>
                    <div className="flex justify-between"><p>Total principal</p><p>{formatCurrency(results.totalPrincipal)}</p></div>
                    <div className="flex justify-between"><p>Total contributions</p><p>{formatCurrency(results.totalContributions)}</p></div>
                    <div className="flex justify-between font-bold"><p>Total interest</p><p>{formatCurrency(results.totalInterest)}</p></div>
                    <div className="flex justify-between pl-4 text-muted-foreground"><p>Interest of initial investment</p><p>{formatCurrency(results.interestOfInitialInvestment)}</p></div>
                    <div className="flex justify-between pl-4 text-muted-foreground"><p>Interest of the contributions</p><p>{formatCurrency(results.interestOfContributions)}</p></div>
                    <div className="flex justify-between border-t mt-2 pt-2"><p>Buying power of the end balance</p><p>{formatCurrency(results.buyingPower)}</p></div>
                </CardContent>
              </Card>
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader><CardTitle className="text-base text-center">Balance Breakdown</CardTitle></CardHeader>
                  <CardContent className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                              <Pie data={results.pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={30} outerRadius={50} paddingAngle={5} labelLine={false} label={({ percent }) => `${(percent * 100).toFixed(0)}%`}>
                                {results.pieData.map((_entry: any, index: number) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                              </Pie>
                              <Tooltip formatter={(value: number) => formatCurrency(value)} />
                              <Legend iconType="circle" />
                          </PieChart>
                      </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-base text-center">Growth Over Time</CardTitle></CardHeader>
                  <CardContent className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={results.schedule} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="year" />
                            <YAxis tickFormatter={(val) => `$${(val/1000)}k`} />
                            <Tooltip formatter={(value: number) => formatCurrency(value)} />
                            <Legend />
                            <Bar dataKey="initialInvestmentPortion" stackId="a" fill="hsl(var(--chart-1))" name="Initial" />
                            <Bar dataKey="contributionsPortion" stackId="a" fill="hsl(var(--chart-2))" name="Contributions" />
                            <Bar dataKey="interestPortion" stackId="a" fill="hsl(var(--chart-3))" name="Interest" />
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
                                <TableRow><TableHead>Year</TableHead><TableHead className="text-right">Deposit</TableHead><TableHead className="text-right">Interest</TableHead><TableHead className="text-right">Ending Balance</TableHead></TableRow>
                            </TableHeader>
                            <TableBody>
                                {results.schedule.map((row: any) => (
                                    <TableRow key={row.year}><TableCell>{row.year}</TableCell><TableCell className="text-right">{formatCurrency(row.deposit)}</TableCell><TableCell className="text-right">{formatCurrency(row.interest)}</TableCell><TableCell className="text-right">{formatCurrency(row.endingBalance)}</TableCell></TableRow>
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
