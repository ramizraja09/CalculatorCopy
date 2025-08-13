
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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

export default function InvestmentCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      initialPrincipal: 1000,
      monthlyContribution: 100,
      interestRate: 7,
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
    let totalContributions = initialPrincipal;
    
    schedule.push({
      year: 0,
      endBalance: initialPrincipal,
      totalContributions: initialPrincipal,
      totalInterest: 0,
    });
    
    for (let year = 1; year <= years; year++) {
      let yearStartBalance = balance;
      for (let month = 1; month <= 12; month++) {
        balance += monthlyContribution;
      }
      
      const interestForYear = balance * (Math.pow(1 + annualRate / n, n) - 1);
      balance += interestForYear;
      
      totalContributions += monthlyContribution * 12;
      const currentTotalInterest = balance - totalContributions;

      schedule.push({
        year,
        endBalance: balance,
        totalContributions,
        totalInterest: currentTotalInterest > 0 ? currentTotalInterest : 0,
      });
    }

    setResults({
      finalBalance: balance,
      totalContributions,
      totalInterest: balance - totalContributions,
      schedule,
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
      content += `- Initial Principal: ${formatCurrency(initialPrincipal)}\n- Monthly Contribution: ${formatCurrency(monthlyContribution)}\n- Annual Interest Rate: ${interestRate}%\n`;
      content += `- Length of Time: ${years} years\n- Compound Frequency: ${compoundFrequency}\n\n`;
      content += `Results:\n- Future Value: ${formatCurrency(results.finalBalance)}\n- Total Contributions: ${formatCurrency(results.totalContributions)}\n- Total Interest: ${formatCurrency(results.totalInterest)}\n`;
    } else {
      content = 'Category,Value\n';
      content += `Initial Principal,${initialPrincipal}\nMonthly Contribution,${monthlyContribution}\nAnnual Interest Rate (%),${interestRate}\n`;
      content += `Length of Time (years),${years}\nCompound Frequency,${compoundFrequency}\n\n`;
      content += 'Result Category,Value\n';
      content += `Future Value,${results.finalBalance.toFixed(2)}\nTotal Contributions,${results.totalContributions.toFixed(2)}\nTotal Interest,${results.totalInterest.toFixed(2)}\n`;
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
          <Label htmlFor="initialPrincipal">Initial Principal ($)</Label>
          <Controller name="initialPrincipal" control={control} render={({ field }) => <Input id="initialPrincipal" type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
          {errors.initialPrincipal && <p className="text-destructive text-sm mt-1">{errors.initialPrincipal.message}</p>}
        </div>

        <div>
          <Label htmlFor="monthlyContribution">Monthly Contribution ($)</Label>
          <Controller name="monthlyContribution" control={control} render={({ field }) => <Input id="monthlyContribution" type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
          {errors.monthlyContribution && <p className="text-destructive text-sm mt-1">{errors.monthlyContribution.message}</p>}
        </div>

        <div>
          <Label htmlFor="interestRate">Annual Interest Rate (%)</Label>
          <Controller name="interestRate" control={control} render={({ field }) => <Input id="interestRate" type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
          {errors.interestRate && <p className="text-destructive text-sm mt-1">{errors.interestRate.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="years">Length of Time (years)</Label>
          <Controller name="years" control={control} render={({ field }) => <Input id="years" type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} />
          {errors.years && <p className="text-destructive text-sm mt-1">{errors.years.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="compoundFrequency">Compound Frequency</Label>
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
                        <CardContent className="p-4">
                            <p className="text-sm text-muted-foreground">Future Value</p>
                            <p className="text-3xl font-bold">{formatCurrency(results.finalBalance)}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 grid grid-cols-2 gap-2 text-sm">
                             <div><p className="text-muted-foreground">Total Contributions</p><p className="font-semibold">{formatCurrency(results.totalContributions)}</p></div>
                             <div><p className="text-muted-foreground">Total Interest</p><p className="font-semibold">{formatCurrency(results.totalInterest)}</p></div>
                        </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-semibold mb-4 text-center">Investment Growth Over Time</h4>
                        <div className="h-60">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={results.schedule} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="year" />
                              <YAxis tickFormatter={(value) => typeof value === 'number' ? formatCurrency(value) : ''} />
                              <Tooltip formatter={(value: number, name: string) => (name === "Total Contributions" || name === "Total Balance") ? formatCurrency(value) : value } />
                              <Legend />
                              <Line type="monotone" dataKey="endBalance" name="Total Balance" stroke="hsl(var(--primary))" dot={false} />
                              <Line type="monotone" dataKey="totalContributions" name="Total Contributions" stroke="hsl(var(--secondary-foreground))" dot={false} />
                            </LineChart>
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
                <p className="text-sm text-muted-foreground">Enter your details to calculate your investment growth</p>
            </div>
        )}
      </div>
    </form>
  );
}
