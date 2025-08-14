
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const formSchema = z.object({
  currentSalary: z.number().min(1, "Current salary must be positive"),
  calculationType: z.enum(['percent', 'amount']),
  raisePercentage: z.number().min(0).optional(),
  newSalary: z.number().min(0).optional(),
  federalTaxRate: z.number().min(0).max(100),
  stateTaxRate: z.number().min(0).max(100),
  otherDeductions: z.number().min(0),
  hoursPerWeek: z.number().min(1),
  weeksPerYear: z.number().min(1).max(52),
}).refine(data => {
    if (data.calculationType === 'percent') return data.raisePercentage !== undefined && data.raisePercentage >= 0;
    if (data.calculationType === 'amount') return data.newSalary !== undefined && data.newSalary > data.currentSalary;
    return false;
}, {
    message: "Please provide a valid raise percentage or new salary.",
    path: ["raisePercentage"],
});


type FormData = z.infer<typeof formSchema>;
const PIE_COLORS = ['hsl(var(--chart-2))', 'hsl(var(--destructive))'];

export default function RaisePercentageCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, watch } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currentSalary: 75000,
      calculationType: 'percent',
      raisePercentage: 6,
      newSalary: 0,
      federalTaxRate: 15,
      stateTaxRate: 5,
      otherDeductions: 2500,
      hoursPerWeek: 40,
      weeksPerYear: 52,
    },
  });
  
  const calculationType = watch('calculationType');

  const calculateRaise = (data: FormData) => {
    const { currentSalary, calculationType, raisePercentage, newSalary: inputNewSalary, federalTaxRate, stateTaxRate, otherDeductions, hoursPerWeek, weeksPerYear } = data;
    
    let newSalary = 0;
    let actualRaisePercentage = 0;
    
    if (calculationType === 'percent') {
        newSalary = currentSalary * (1 + (raisePercentage || 0) / 100);
        actualRaisePercentage = raisePercentage || 0;
    } else {
        newSalary = inputNewSalary || 0;
        actualRaisePercentage = ((newSalary / currentSalary) - 1) * 100;
    }

    const raiseAmount = newSalary - currentSalary;
    
    const calculateTakeHome = (salary: number) => {
        const totalTaxRate = (federalTaxRate + stateTaxRate) / 100;
        const totalTaxes = salary * totalTaxRate;
        return salary - totalTaxes - otherDeductions;
    };
    
    const takeHomeBefore = calculateTakeHome(currentSalary);
    const takeHomeAfter = calculateTakeHome(newSalary);
    const takeHomeIncrease = takeHomeAfter - takeHomeBefore;

    const annualHours = hoursPerWeek * weeksPerYear;
    const hourlyBefore = currentSalary / annualHours;
    const hourlyAfter = newSalary / annualHours;

    setResults({
      raiseAmount,
      newSalary,
      actualRaisePercentage,
      takeHomeBefore,
      takeHomeAfter,
      takeHomeIncrease,
      hourlyBefore,
      hourlyAfter,
      payPeriods: {
          annual: newSalary,
          monthly: newSalary / 12,
          biWeekly: newSalary / 26,
          weekly: newSalary / 52,
      },
      chartData: [
          { name: 'Before Raise', 'Gross Salary': currentSalary },
          { name: 'After Raise', 'Gross Salary': newSalary },
      ],
      pieData: [
          { name: 'Take-Home Pay', value: takeHomeAfter },
          { name: 'Taxes & Deductions', value: newSalary - takeHomeAfter },
      ]
    });
    setFormData(data);
  };
  
  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `raise-calculation.${format}`;

    if (format === 'txt') {
      content = `Raise Calculation\n\nInputs:\n${Object.entries(formData).map(([k,v]) => `- ${k}: ${v}`).join('\n')}\n\nResults:\n${Object.entries(results).filter(([k]) => !['chartData','pieData'].includes(k)).map(([k,v]) => `- ${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join('\n')}`;
    } else {
       content = `Category,Value\n${Object.entries(formData).map(([k,v]) => `${k},${v}`).join('\n')}\nResult,Value\n${Object.entries(results).filter(([k]) => !['chartData','pieData'].includes(k)).map(([k,v]) => `${k},${typeof v === 'object' ? JSON.stringify(v) : v}`).join('\n')}`;
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
    <form onSubmit={handleSubmit(calculateRaise)} className="grid lg:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <Card>
            <CardHeader><CardTitle>Salary & Raise Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div><Label>Current Annual Salary ($)</Label><Controller name="currentSalary" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                
                <Controller name="calculationType" control={control} render={({ field }) => (
                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 gap-4">
                        <Label className="p-2 border rounded-md text-center text-sm peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><RadioGroupItem value="percent" className="mr-2"/>By Percentage</Label>
                        <Label className="p-2 border rounded-md text-center text-sm peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><RadioGroupItem value="amount" className="mr-2"/>By New Amount</Label>
                    </RadioGroup>
                )}/>
                
                {calculationType === 'percent' ? (
                    <div><Label>Raise Percentage (%)</Label><Controller name="raisePercentage" control={control} render={({ field }) => <Input type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                ) : (
                    <div><Label>New Annual Salary ($)</Label><Controller name="newSalary" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                )}
            </CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle>Taxes & Schedule</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div><Label>Federal Tax Rate (%)</Label><Controller name="federalTaxRate" control={control} render={({ field }) => <Input type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                    <div><Label>State Tax Rate (%)</Label><Controller name="stateTaxRate" control={control} render={({ field }) => <Input type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                </div>
                 <div><Label>Other Deductions ($/year)</Label><Controller name="otherDeductions" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                <div className="grid grid-cols-2 gap-4">
                    <div><Label>Hours per Week</Label><Controller name="hoursPerWeek" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                    <div><Label>Weeks per Year</Label><Controller name="weeksPerYear" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
                </div>
            </CardContent>
        </Card>
        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Calculate</Button>
             <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="outline" disabled={!results}><Download className="mr-2 h-4 w-4" /> Export</Button></DropdownMenuTrigger>
              <DropdownMenuContent><DropdownMenuItem onClick={() => handleExport('txt')}>Download as .txt</DropdownMenuItem><DropdownMenuItem onClick={() => handleExport('csv')}>Download as .csv</DropdownMenuItem></DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>
      {/* Results */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Your Raise Summary</h3>
        {results ? (
            <div className="space-y-4">
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Summary</AlertTitle>
                    <AlertDescription>A <strong>{results.actualRaisePercentage.toFixed(1)}%</strong> raise increases your annual salary to <strong>{formatCurrency(results.newSalary)}</strong>, adding <strong>{formatCurrency(results.takeHomeIncrease)}</strong> to your yearly take-home pay.</AlertDescription>
                </Alert>
                <div className="grid grid-cols-2 gap-4">
                    <Card><CardContent className="p-4 text-center"><p className="text-sm text-muted-foreground">New Annual Salary</p><p className="font-bold text-xl">{formatCurrency(results.newSalary)}</p></CardContent></Card>
                    <Card><CardContent className="p-4 text-center"><p className="text-sm text-muted-foreground">New Take-Home Pay</p><p className="font-bold text-xl">{formatCurrency(results.takeHomeAfter)}</p></CardContent></Card>
                </div>
                 <Card>
                    <CardHeader><CardTitle className="text-base text-center">Gross Salary Comparison</CardTitle></CardHeader>
                    <CardContent className="h-48">
                         <ResponsiveContainer width="100%" height="100%"><BarChart data={results.chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis tickFormatter={(val) => `$${(val/1000)}k`} /><Tooltip formatter={(value: number) => formatCurrency(value)} /><Bar dataKey="Gross Salary" fill="hsl(var(--primary))" /></BarChart></ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="text-base text-center">New Salary Breakdown</CardTitle></CardHeader>
                    <CardContent className="h-48">
                        <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={results.pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={30} outerRadius={50} label={({ percent }) => `${(percent * 100).toFixed(0)}%`}><Cell fill={PIE_COLORS[0]} /><Cell fill={PIE_COLORS[1]} /></Pie><Tooltip formatter={(value: number) => formatCurrency(value)} /><Legend /></PieChart></ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        ) : (
          <div className="flex items-center justify-center h-full bg-muted/50 rounded-lg border border-dashed"><p className="text-sm text-muted-foreground text-center p-8">Enter your salary and raise details to see a full breakdown.</p></div>
        )}
      </div>
    </form>
  );
}

