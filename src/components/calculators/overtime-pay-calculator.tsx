
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Download, Info } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const formSchema = z.object({
  hourlyRate: z.number().min(0.01, "Hourly rate must be positive"),
  regularHours: z.number().min(0).default(40),
  overtimeHours: z.number().min(0).default(0),
  overtimeMultiplier: z.number().min(1).default(1.5),
  doubleTimeHours: z.number().min(0).default(0),
  doubleTimeMultiplier: z.number().min(1).default(2),
  federalTaxRate: z.number().min(0).max(100).default(15),
  stateTaxRate: z.number().min(0).max(100).default(5),
  preTaxDeductions: z.number().min(0).default(0),
});

type FormData = z.infer<typeof formSchema>;
const PIE_COLORS = ['hsl(var(--chart-2))', 'hsl(var(--chart-1))', 'hsl(var(--chart-4))'];

export default function OvertimePayCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      hourlyRate: 25,
      regularHours: 40,
      overtimeHours: 10,
      overtimeMultiplier: 1.5,
      doubleTimeHours: 0,
      doubleTimeMultiplier: 2,
      federalTaxRate: 15,
      stateTaxRate: 5,
      preTaxDeductions: 100,
    },
  });
  
  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const calculatePay = (data: FormData) => {
    const { hourlyRate, regularHours, overtimeHours, overtimeMultiplier, doubleTimeHours, doubleTimeMultiplier, federalTaxRate, stateTaxRate, preTaxDeductions } = data;
    
    const regularPay = hourlyRate * regularHours;
    const overtimePay = hourlyRate * overtimeMultiplier * overtimeHours;
    const doubleTimePay = hourlyRate * doubleTimeMultiplier * doubleTimeHours;
    const grossPay = regularPay + overtimePay + doubleTimePay;
    
    const totalTaxRate = (federalTaxRate + stateTaxRate) / 100;
    const taxableIncome = grossPay - preTaxDeductions;
    const totalTaxes = taxableIncome * totalTaxRate;
    const takeHomePay = taxableIncome - totalTaxes;
    
    const grossPayWithoutOT = hourlyRate * regularHours;
    const takeHomeWithoutOT = (grossPayWithoutOT - preTaxDeductions) * (1-totalTaxRate);

    const totalHours = regularHours + overtimeHours + doubleTimeHours;
    const effectiveHourlyRate = totalHours > 0 ? grossPay / totalHours : 0;

    setResults({
      grossPay,
      takeHomePay,
      regularPay,
      overtimePay,
      doubleTimePay,
      totalTaxes,
      preTaxDeductions,
      effectiveHourlyRate,
      payPeriods: [
        { period: 'Weekly', gross: grossPay, net: takeHomePay },
        { period: 'Bi-Weekly', gross: grossPay * 2, net: takeHomePay * 2 },
        { period: 'Monthly', gross: grossPay * 4.345, net: takeHomePay * 4.345 },
        { period: 'Annually', gross: grossPay * 52, net: takeHomePay * 52 },
      ],
      pieData: [
        { name: 'Regular Pay', value: regularPay },
        { name: 'Overtime Pay', value: overtimePay },
        { name: 'Double-Time Pay', value: doubleTimePay },
      ].filter(d => d.value > 0),
       barData: [
        { name: 'Paycheck', 'Without Overtime': takeHomeWithoutOT, 'With Overtime': takeHomePay },
      ],
    });
    setFormData(data);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `overtime-pay-calculation.${format}`;

    if (format === 'txt') {
      content = `Overtime Pay Calculation\n\nInputs:\n${Object.entries(formData).map(([k,v]) => `- ${k}: ${v}`).join('\n')}\n\nResults (per week):\n${Object.entries(results).filter(([k]) => !['pieData', 'barData', 'payPeriods'].includes(k)).map(([k,v]) => `- ${k}: ${formatCurrency(v)}`).join('\n')}`;
    } else {
       content = `Category,Value\n${Object.entries(formData).map(([k,v]) => `${k},${v}`).join('\n')}\n\nResult,Value (per week)\n${Object.entries(results).filter(([k]) => !['pieData', 'barData', 'payPeriods'].includes(k)).map(([k,v]) => `${k},${v}`).join('\n')}`;
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
    <form onSubmit={handleSubmit(calculatePay)} className="grid lg:grid-cols-2 gap-8">
      {/* Inputs Column */}
      <div className="space-y-4">
        <Card>
            <CardHeader><CardTitle>Pay & Hours (per week)</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div><Label>Hourly Rate ($)</Label><Controller name="hourlyRate" control={control} render={({ field }) => <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                <div className="grid grid-cols-2 gap-4">
                    <div><Label>Regular Hours</Label><Controller name="regularHours" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                    <div><Label>Overtime Hours</Label><Controller name="overtimeHours" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div><Label>Overtime Multiplier</Label><Controller name="overtimeMultiplier" control={control} render={({ field }) => <Input type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                    <div><Label>Double-Time Hours</Label><Controller name="doubleTimeHours" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                </div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle>Taxes & Deductions</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div><Label>Federal Tax Rate (%)</Label><Controller name="federalTaxRate" control={control} render={({ field }) => <Input type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                    <div><Label>State Tax Rate (%)</Label><Controller name="stateTaxRate" control={control} render={({ field }) => <Input type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                </div>
                 <div><Label>Pre-Tax Deductions ($/week)</Label><Controller name="preTaxDeductions" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
            </CardContent>
        </Card>
        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Calculate Pay</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={!results}><Download className="mr-2 h-4 w-4" /> Export</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent><DropdownMenuItem onClick={() => handleExport('txt')}>Download as .txt</DropdownMenuItem><DropdownMenuItem onClick={() => handleExport('csv')}>Download as .csv</DropdownMenuItem></DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>

      {/* Results Column */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Pay Summary</h3>
        {results ? (
            <div className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Summary</AlertTitle>
                  <AlertDescription>Your overtime boosts your weekly take-home pay by <strong>{formatCurrency(results.takeHomePay - results.takeHomeWithoutOT)}</strong>, bringing your total to <strong>{formatCurrency(results.takeHomePay)}</strong>.</AlertDescription>
                </Alert>
                <Card>
                  <CardHeader><CardTitle>Pay Breakdown</CardTitle></CardHeader>
                  <CardContent>
                      <Table>
                        <TableHeader><TableRow><TableHead>Period</TableHead><TableHead className="text-right">Gross Pay</TableHead><TableHead className="text-right">Take-Home Pay</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {results.payPeriods.map((p: any) => (
                                <TableRow key={p.period}><TableCell>{p.period}</TableCell><TableCell className="text-right">{formatCurrency(p.gross)}</TableCell><TableCell className="text-right">{formatCurrency(p.net)}</TableCell></TableRow>
                            ))}
                        </TableBody>
                      </Table>
                  </CardContent>
                </Card>
                <div className="grid md:grid-cols-2 gap-4">
                    <Card>
                        <CardHeader><CardTitle className="text-base text-center">Gross Pay Sources</CardTitle></CardHeader>
                        <CardContent className="h-48">
                          <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={results.pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60}><Cell fill={PIE_COLORS[0]}/><Cell fill={PIE_COLORS[1]}/><Cell fill={PIE_COLORS[2]}/></Pie><Tooltip formatter={(value: number) => formatCurrency(value)} /><Legend/></PieChart></ResponsiveContainer>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader><CardTitle className="text-base text-center">Take-Home Comparison</CardTitle></CardHeader>
                        <CardContent className="h-48">
                          <ResponsiveContainer width="100%" height="100%"><BarChart data={results.barData}><CartesianGrid strokeDasharray="3 3"/><YAxis tickFormatter={(v) => formatCurrency(v)}/><Tooltip formatter={(v:number) => formatCurrency(v)}/><Legend/><Bar dataKey="Without Overtime" fill={PIE_COLORS[0]} /><Bar dataKey="With Overtime" fill={PIE_COLORS[1]} /></BarChart></ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
            </div>
        ) : (
             <div className="flex items-center justify-center h-60 bg-muted/50 rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">Enter your pay details</p>
            </div>
        )}
      </div>
    </form>
  );
}
