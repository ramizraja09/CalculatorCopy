
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
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const formSchema = z.object({
  initialPrincipal: z.number().min(0, 'Initial principal must be non-negative'),
  monthlyContribution: z.number().min(0, 'Monthly contribution must be non-negative'),
  interestRate: z.number().min(0, 'Interest rate must be non-negative'),
  years: z.number().int().min(1, 'Must invest for at least 1 year'),
  compoundFrequency: z.enum(['annually', 'semiannually', 'quarterly', 'monthly']),
});

type FormData = z.infer<typeof formSchema>;
const PIE_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))'];


export default function InvestmentCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      initialPrincipal: 20000,
      monthlyContribution: 1000,
      interestRate: 6,
      years: 10,
      compoundFrequency: 'annually',
    },
  });

  const calculateCompoundInterest = (data: FormData) => {
    const { initialPrincipal, monthlyContribution, interestRate, years, compoundFrequency } = data;

    const annualRate = interestRate / 100;
    const compoundMap: { [key: string]: number } = {
      annually: 1,
      semiannually: 2,
      quarterly: 4,
      monthly: 12,
    };
    const n = compoundMap[compoundFrequency];
    const schedule = [];
    let balance = initialPrincipal;
    let totalPrincipal = initialPrincipal;
    let totalInterest = 0;
    
    schedule.push({
      year: 0,
      endBalance: initialPrincipal,
      totalContributions: initialPrincipal,
      totalInterest: 0,
    });
    
    for (let year = 1; year <= years; year++) {
        let yearStartBalance = balance;
        let yearlyContribution = monthlyContribution * 12;
        
        balance += yearlyContribution; // Assuming contributions are made at the beginning of the year for simplicity
        
        const interestForYear = balance * (Math.pow(1 + annualRate / n, n) - 1);
        balance += interestForYear;
        
        totalPrincipal += yearlyContribution;
        totalInterest += interestForYear;

        schedule.push({
            year,
            endBalance: balance,
            totalContributions: totalPrincipal,
            totalInterest,
        });
    }
    
    setResults({
      finalBalance: balance,
      startingAmount: initialPrincipal,
      totalContributions: totalPrincipal - initialPrincipal,
      totalInterest: totalInterest,
      schedule,
      pieData: [
        { name: 'Starting Amount', value: initialPrincipal },
        { name: 'Total Contributions', value: totalPrincipal - initialPrincipal },
        { name: 'Total Interest', value: totalInterest },
      ],
      error: null,
    });
    setFormData(data);
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `investment-calculation.${format}`;
    const { initialPrincipal, monthlyContribution, interestRate, years, compoundFrequency } = formData;

    if (format === 'txt') {
      content = `Investment Calculation\n\nInputs:\n`;
      content += `- Starting Amount: ${formatCurrency(initialPrincipal)}\n- Additional Contribution: ${formatCurrency(monthlyContribution * 12)}/year\n- Return Rate: ${interestRate}%\n`;
      content += `- After: ${years} years\n- Compound Frequency: ${compoundFrequency}\n\n`;
      content += `Results:\n- End Balance: ${formatCurrency(results.finalBalance)}\n- Total Contributions: ${formatCurrency(results.totalContributions)}\n- Total Interest: ${formatCurrency(results.totalInterest)}\n`;
    } else {
      content = 'Category,Value\n';
      content += `Starting Amount,${initialPrincipal}\nAdditional Contribution,${monthlyContribution*12}\nReturn Rate (%),${interestRate}\n`;
      content += `After (years),${years}\nCompound Frequency,${compoundFrequency}\n\n`;
      content += 'Result Category,Value\n';
      content += `End Balance,${results.finalBalance.toFixed(2)}\nTotal Contributions,${results.totalContributions.toFixed(2)}\nTotal Interest,${results.totalInterest.toFixed(2)}\n`;
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
    <form onSubmit={handleSubmit(calculateCompoundInterest)} className="grid xl:grid-cols-3 gap-8">
      {/* Inputs Column */}
      <div className="xl:col-span-1 space-y-4">
        <h3 className="text-xl font-semibold">Inputs</h3>
        
        <div>
          <Label htmlFor="initialPrincipal">Starting Amount ($)</Label>
          <Controller name="initialPrincipal" control={control} render={({ field }) => <Input id="initialPrincipal" type="number" step="0.01" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
        </div>

        <div>
          <Label htmlFor="monthlyContribution">Additional Contribution ($/month)</Label>
          <Controller name="monthlyContribution" control={control} render={({ field }) => <Input id="monthlyContribution" type="number" step="0.01" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
        </div>

        <div>
          <Label htmlFor="interestRate">Return Rate (%)</Label>
          <Controller name="interestRate" control={control} render={({ field }) => <Input id="interestRate" type="number" step="0.01" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
        </div>
        
        <div>
          <Label htmlFor="years">After (years)</Label>
          <Controller name="years" control={control} render={({ field }) => <Input id="years" type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))} />} />
        </div>
        
        <div>
          <Label htmlFor="compoundFrequency">Compound</Label>
          <Controller name="compoundFrequency" control={control} render={({ field }) => (
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger id="compoundFrequency"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="annually">Annually</SelectItem>
                <SelectItem value="semiannually">Semiannually</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          )} />
        </div>
        
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
      <div className="xl:col-span-2 space-y-4">
        <h3 className="text-xl font-semibold">Results</h3>
        {results ? (
            results.error ? (
                <Card className="flex items-center justify-center h-60 bg-muted/50 border-dashed">
                    <p className="text-destructive">{results.error}</p>
                </Card>
            ) : (
                <div className="space-y-4">
                    <Card>
                      <CardHeader><CardTitle className="text-center">Results</CardTitle></CardHeader>
                      <CardContent className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex justify-between font-bold text-lg"><p>End Balance</p><p>{formatCurrency(results.finalBalance)}</p></div>
                          <div className="flex justify-between text-sm"><p>Starting Amount</p><p>{formatCurrency(results.startingAmount)}</p></div>
                          <div className="flex justify-between text-sm"><p>Total Contributions</p><p>{formatCurrency(results.totalContributions)}</p></div>
                          <div className="flex justify-between text-sm"><p>Total Interest</p><p>{formatCurrency(results.totalInterest)}</p></div>
                        </div>
                        <div className="h-48">
                           <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={results.pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={30} outerRadius={50} paddingAngle={5} label={({ percent }) => `${(percent * 100).toFixed(0)}%`}>
                                        {results.pieData.map((_entry: any, index: number) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                    <Legend iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-semibold mb-2">Yearly Breakdown</h4>
                         <ScrollArea className="h-48">
                              <Table>
                                  <TableHeader className="sticky top-0 bg-muted">
                                      <TableRow>
                                          <TableHead>Year</TableHead>
                                          <TableHead className="text-right">Contributions</TableHead>
                                          <TableHead className="text-right">Interest</TableHead>
                                          <TableHead className="text-right">End Balance</TableHead>
                                      </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                      {results.schedule.slice(1).map((row: any) => (
                                          <TableRow key={row.year}>
                                              <TableCell>{row.year}</TableCell>
                                              <TableCell className="text-right">{formatCurrency(row.totalContributions)}</TableCell>
                                              <TableCell className="text-right">{formatCurrency(row.totalInterest)}</TableCell>
                                              <TableCell className="text-right">{formatCurrency(row.endBalance)}</TableCell>
                                          </TableRow>
                                      ))}
                                  </TableBody>
                              </Table>
                          </ScrollArea>
                      </CardContent>
                    </Card>
                </div>
            )
        ) : (
             <div className="flex items-center justify-center h-60 bg-muted/50 rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">Enter your investment details to see the returns</p>
            </div>
        )}
      </div>
    </form>
  );
}
