
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Download, Info } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';


const formSchema = z.object({
  conversionType: z.enum(['hourlyToSalary', 'salaryToHourly']),
  hourlyRate: z.number().min(0),
  annualSalary: z.number().min(0),
  hoursPerWeek: z.number().min(1),
  weeksPerYear: z.number().min(1).max(52),
  overtimeMultiplier: z.number().min(1),
  overtimeHours: z.number().min(0),
});

type FormData = z.infer<typeof formSchema>;

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

export default function HourlyToSalaryConverter() {
  const [results, setResults] = useState<any | null>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, watch } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      conversionType: 'hourlyToSalary',
      hourlyRate: 35,
      annualSalary: 72800,
      hoursPerWeek: 40,
      weeksPerYear: 52,
      overtimeMultiplier: 1.5,
      overtimeHours: 0,
    },
  });

  const conversionType = watch('conversionType');

  const calculate = (data: FormData) => {
    let baseAnnual = 0;
    let baseHourly = 0;
    
    if (data.conversionType === 'hourlyToSalary') {
        baseHourly = data.hourlyRate;
        baseAnnual = data.hourlyRate * data.hoursPerWeek * data.weeksPerYear;
    } else {
        baseAnnual = data.annualSalary;
        baseHourly = data.annualSalary / (data.weeksPerYear * data.hoursPerWeek);
    }
    
    const overtimePay = data.overtimeHours * (baseHourly * data.overtimeMultiplier) * data.weeksPerYear;
    const totalAnnual = baseAnnual + overtimePay;

    setResults({
        baseAnnual,
        overtimePay,
        totalAnnual,
        monthly: totalAnnual / 12,
        biWeekly: totalAnnual / 26,
        weekly: totalAnnual / 52,
        daily: totalAnnual / (data.weeksPerYear * (data.hoursPerWeek / 5)), // assumes 5-day work week
        effectiveHourly: totalAnnual / (data.weeksPerYear * (data.hoursPerWeek + data.overtimeHours)),
        chartData: [
            { name: 'Pay Breakdown', base: baseAnnual, overtime: overtimePay }
        ],
    });
    setFormData(data);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `hourly-salary-conversion.${format}`;

    if (format === 'txt') {
      content = `Hourly/Salary Conversion\n\nInputs:\n${Object.entries(formData).map(([k,v]) => `- ${k}: ${v}`).join('\n')}\n\nResults:\n${Object.entries(results).filter(([k]) => k !== 'chartData').map(([k,v]) => `- ${k}: ${typeof v === 'number' ? formatCurrency(v) : v}`).join('\n')}`;
    } else {
      content = `Category,Value\n${Object.entries(formData).map(([k,v]) => `${k},${v}`).join('\n')}\n\nResult,Value\n${Object.entries(results).filter(([k]) => k !== 'chartData').map(([k,v]) => `${k},${v}`).join('\n')}`;
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
    <form onSubmit={handleSubmit(calculate)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs Column */}
      <div className="space-y-4">
        <Card>
            <CardHeader><CardTitle>Work Schedule</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <Controller name="conversionType" control={control} render={({ field }) => (
                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 gap-4">
                        <Label className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><RadioGroupItem value="hourlyToSalary" className="mr-2"/>Hourly to Salary</Label>
                        <Label className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><RadioGroupItem value="salaryToHourly" className="mr-2"/>Salary to Hourly</Label>
                    </RadioGroup>
                )}/>
                {conversionType === 'hourlyToSalary' ? (
                    <div><Label>Hourly Rate ($)</Label><Controller name="hourlyRate" control={control} render={({ field }) => <Input type="number" step="0.01" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
                ) : (
                    <div><Label>Annual Salary ($)</Label><Controller name="annualSalary" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
                )}
                <div className="grid grid-cols-2 gap-4">
                    <div><Label>Hours per Week</Label><Controller name="hoursPerWeek" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
                    <div><Label>Weeks per Year</Label><Controller name="weeksPerYear" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
                </div>
            </CardContent>
        </Card>
         <Card>
            <CardHeader><CardTitle>Overtime</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
                 <div><Label>Avg. Overtime Hours/Week</Label><Controller name="overtimeHours" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
                 <div><Label>Overtime Multiplier</Label><Controller name="overtimeMultiplier" control={control} render={({ field }) => <Input type="number" step="0.1" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
            </CardContent>
        </Card>
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
        <h3 className="text-xl font-semibold">Equivalent Earnings</h3>
        {results ? (
            <div className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Summary</AlertTitle>
                  <AlertDescription>
                    {conversionType === 'hourlyToSalary' ?
                        `An hourly rate of ${formatCurrency(formData?.hourlyRate || 0)} translates to an annual salary of ${formatCurrency(results.baseAnnual)}, before overtime.`
                        : `An annual salary of ${formatCurrency(formData?.annualSalary || 0)} is equivalent to an hourly rate of ${formatCurrency(results.effectiveHourly)}.`
                    }
                  </AlertDescription>
                </Alert>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-center">
                            {conversionType === 'hourlyToSalary' ? formatCurrency(results.totalAnnual) + ' / year' : formatCurrency(results.effectiveHourly) + ' / hour'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableBody>
                                <TableRow><TableCell>Annual</TableCell><TableCell className="text-right font-semibold">{formatCurrency(results.totalAnnual)}</TableCell></TableRow>
                                <TableRow><TableCell>Monthly</TableCell><TableCell className="text-right font-semibold">{formatCurrency(results.monthly)}</TableCell></TableRow>
                                <TableRow><TableCell>Bi-Weekly</TableCell><TableCell className="text-right font-semibold">{formatCurrency(results.biWeekly)}</TableCell></TableRow>
                                <TableRow><TableCell>Weekly</TableCell><TableCell className="text-right font-semibold">{formatCurrency(results.weekly)}</TableCell></TableRow>
                                <TableRow><TableCell>Daily</TableCell><TableCell className="text-right font-semibold">{formatCurrency(results.daily)}</TableCell></TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle className="text-base text-center">Income Breakdown (Annual)</CardTitle></CardHeader>
                    <CardContent className="h-60">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={results.chartData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
                                <YAxis type="category" dataKey="name" hide />
                                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                <Legend />
                                <Bar dataKey="base" stackId="a" fill="hsl(var(--chart-2))" name="Base Pay" />
                                <Bar dataKey="overtime" stackId="a" fill="hsl(var(--chart-1))" name="Overtime Pay" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter details to convert</p></div>
        )}
      </div>
    </form>
  );
}

