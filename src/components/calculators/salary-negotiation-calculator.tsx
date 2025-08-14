
"use client";

import { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Trash, Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const formSchema = z.object({
  baseSalary: z.number().min(0).default(100000),
  bonusType: z.enum(['percent', 'amount']).default('percent'),
  bonusValue: z.number().min(0).default(10),
  signOnBonus1: z.number().min(0).default(10000),
  signOnBonus2: z.number().min(0).default(0),
  grantValue: z.number().min(0).default(100000),
  vestingDuration: z.number().int().min(1).default(4),
  vestingSchedule: z.array(z.number().min(0).max(100)).default([25, 25, 25, 25]),
});

type FormData = z.infer<typeof formSchema>;

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

export default function SalaryNegotiationCalculator() {
  const [results, setResults] = useState<any | null>(null);

  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      baseSalary: 100000,
      bonusType: 'percent',
      bonusValue: 10,
      signOnBonus1: 10000,
      signOnBonus2: 0,
      grantValue: 100000,
      vestingDuration: 4,
      vestingSchedule: [25, 25, 25, 25],
    },
  });
  
  const { fields } = useFieldArray({ control, name: "vestingSchedule" });

  const calculateCompensation = (data: FormData) => {
    const { baseSalary, bonusType, bonusValue, signOnBonus1, signOnBonus2, grantValue, vestingSchedule } = data;
    const bonusAmount = bonusType === 'percent' ? baseSalary * (bonusValue / 100) : bonusValue;

    const yearlyData = Array.from({ length: 4 }, (_, i) => {
      const year = i + 1;
      const equity = grantValue * ((vestingSchedule[i] || 0) / 100);
      const signOn = i === 0 ? signOnBonus1 : i === 1 ? signOnBonus2 : 0;
      const total = baseSalary + bonusAmount + equity + signOn;
      return {
        year: `Year ${year}`,
        baseSalary,
        bonus: bonusAmount,
        equity,
        signOn,
        total
      };
    });
    setResults({ yearlyData });
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!results) return;

    let content = '';
    const filename = `compensation-summary.${format}`;

    if (format === 'txt') {
        content = `Total Compensation Summary\n\n`;
        results.yearlyData.forEach((yearData: any) => {
            content += `${yearData.year}\n`;
            content += `Base Salary: ${formatCurrency(yearData.baseSalary)}\n`;
            content += `Performance Bonus: ${formatCurrency(yearData.bonus)}\n`;
            content += `Equity: ${formatCurrency(yearData.equity)}\n`;
            content += `Sign-on Bonus: ${formatCurrency(yearData.signOn)}\n`;
            content += `Total: ${formatCurrency(yearData.total)}\n\n`;
        });
    } else {
        content = 'Component,Year 1,Year 2,Year 3,Year 4,Total\n';
        const components = ['baseSalary', 'bonus', 'equity', 'signOn', 'total'];
        const labels: {[key: string]: string} = { baseSalary: 'Base Salary', bonus: 'Performance Bonus', equity: 'Equity ($)', signOn: 'Sign-on Bonus', total: 'Total Compensation'};
        
        components.forEach(comp => {
            let row = `${labels[comp]}`;
            let total = 0;
            results.yearlyData.forEach((yearData: any) => {
                const value = yearData[comp];
                row += `,${value}`;
                total += value;
            });
            row += `,${total}\n`;
            content += row;
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
    <form onSubmit={handleSubmit(calculateCompensation)} className="grid lg:grid-cols-2 gap-8">
      {/* --- INPUTS --- */}
      <div className="space-y-4">
        <Card>
            <CardHeader><CardTitle>Compensation Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div><Label>Base Salary ($)</Label><Controller name="baseSalary" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                
                <div><Label>Performance Bonus</Label>
                    <div className="flex items-center gap-2">
                      <Controller name="bonusType" control={control} render={({ field }) => (
                        <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-2">
                           <Label className="flex items-center gap-1 text-sm"><RadioGroupItem value="percent" /> % of Base</Label>
                           <Label className="flex items-center gap-1 text-sm"><RadioGroupItem value="amount" /> Set Amount</Label>
                        </RadioGroup>
                      )} />
                      <Controller name="bonusValue" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
                    </div>
                </div>

                <div><Label>Sign-on Bonus ($)</Label>
                    <div className="grid grid-cols-2 gap-2">
                        <Controller name="signOnBonus1" control={control} render={({ field }) => <Input type="number" placeholder="Year 1" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
                        <Controller name="signOnBonus2" control={control} render={({ field }) => <Input type="number" placeholder="Year 2 (if any)" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
                    </div>
                </div>

                 <div><Label>Equity (RSUs)</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div><Label className="text-xs font-normal text-muted-foreground">Grant Value ($)</Label><Controller name="grantValue" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                      <div><Label className="text-xs font-normal text-muted-foreground">Vesting Duration (years)</Label><Controller name="vestingDuration" control={control} render={({ field }) => <Input type="number" {...field} disabled onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
                    </div>
                </div>
                 <div><Label>Vesting Schedule (% per year)</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {fields.map((field, index) => (
                         <div key={field.id}><Label className="text-xs font-normal text-muted-foreground">Year {index + 1}</Label><Controller name={`vestingSchedule.${index}`} control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
                      ))}
                    </div>
                </div>
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

      {/* --- RESULTS --- */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Compensation Summary</h3>
        
        {results ? (
            <div className="space-y-4">
                <Card>
                    <CardContent className="p-2">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Comp Component</TableHead>
                                    <TableHead className="text-right">Year 1</TableHead>
                                    <TableHead className="text-right">Year 2</TableHead>
                                    <TableHead className="text-right">Year 3</TableHead>
                                    <TableHead className="text-right">Year 4</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow><TableCell>Base Salary</TableCell>{results.yearlyData.map((d:any) => <TableCell key={d.year} className="text-right">{formatCurrency(d.baseSalary)}</TableCell>)}</TableRow>
                                <TableRow><TableCell>Perf. Bonus</TableCell>{results.yearlyData.map((d:any) => <TableCell key={d.year} className="text-right">{formatCurrency(d.bonus)}</TableCell>)}</TableRow>
                                <TableRow><TableCell>Equity ($)</TableCell>{results.yearlyData.map((d:any) => <TableCell key={d.year} className="text-right">{formatCurrency(d.equity)}</TableCell>)}</TableRow>
                                <TableRow><TableCell>Sign-on Bonus</TableCell>{results.yearlyData.map((d:any) => <TableCell key={d.year} className="text-right">{formatCurrency(d.signOn)}</TableCell>)}</TableRow>
                                <TableRow className="font-bold bg-muted/50"><TableCell>Total Comp.</TableCell>{results.yearlyData.map((d:any) => <TableCell key={d.year} className="text-right">{formatCurrency(d.total)}</TableCell>)}</TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 h-96">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={results.yearlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                        <Bar dataKey="baseSalary" stackId="a" fill="hsl(var(--chart-1))" name="Base Salary" />
                        <Bar dataKey="bonus" stackId="a" fill="hsl(var(--chart-2))" name="Bonus" />
                        <Bar dataKey="equity" stackId="a" fill="hsl(var(--chart-3))" name="Equity" />
                        <Bar dataKey="signOn" stackId="a" fill="hsl(var(--chart-4))" name="Sign On" />
                        </BarChart>
                    </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        ) : (
            <div className="flex items-center justify-center h-full bg-muted/50 rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground p-8 text-center">Enter your compensation details and click "Calculate" to see a breakdown.</p>
            </div>
        )}
      </div>
    </form>
  );
}
