
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format, differenceInDays } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const formSchema = z.object({
  initialInvestment: z.number().min(0.01, 'Initial investment must be positive'),
  finalValue: z.number().min(0, 'Final value must be non-negative'),
  timeInputMethod: z.enum(['dates', 'length']),
  investmentLength: z.number().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
}).refine(data => {
    if (data.timeInputMethod === 'length') {
        return data.investmentLength !== undefined && data.investmentLength > 0;
    }
    if (data.timeInputMethod === 'dates') {
        return data.startDate && data.endDate && data.endDate > data.startDate;
    }
    return false;
}, {
    message: "Please provide a valid investment duration or date range.",
    path: ["investmentLength"],
});

type FormData = z.infer<typeof formSchema>;
const PIE_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))'];

export default function RoiCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      initialInvestment: 1000,
      finalValue: 2000,
      timeInputMethod: 'length',
      investmentLength: 5,
    },
  });

  const timeInputMethod = watch('timeInputMethod');

  const calculateReturn = (data: FormData) => {
    const { initialInvestment, finalValue, timeInputMethod, investmentLength, startDate, endDate } = data;

    let lengthInYears: number;
    if (timeInputMethod === 'length') {
        lengthInYears = investmentLength!;
    } else {
        lengthInYears = differenceInDays(endDate!, startDate!) / 365.25;
    }

    if (initialInvestment <= 0) {
        setResults({ error: "Initial investment must be a positive number." });
        return;
    }

    const totalReturn = finalValue - initialInvestment;
    const roi = (totalReturn / initialInvestment) * 100;
    
    const cagr = lengthInYears > 0 ? (Math.pow(finalValue / initialInvestment, 1 / lengthInYears) - 1) * 100 : 0;

    setResults({
      totalReturn,
      roi,
      cagr: isFinite(cagr) ? cagr : 0,
      investmentLength: lengthInYears,
      pieData: [
        { name: 'Invested', value: initialInvestment },
        { name: 'Profit', value: totalReturn > 0 ? totalReturn : 0 },
      ],
      error: null,
    });
    setFormData(data);
  };

  const handleClear = () => {
    setResults(null);
    setFormData(null);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `roi-calculation.${format}`;
    if (format === 'txt') {
      content = `ROI Calculation\n\nInputs:\n- Initial Investment: ${formatCurrency(formData.initialInvestment)}\n- Final Value: ${formatCurrency(formData.finalValue)}\n- Investment Length: ${results.investmentLength.toFixed(3)} years\n\nResult:\n- Investment Gain: ${formatCurrency(results.totalReturn)}\n- ROI: ${formatPercent(results.roi)}\n- Annualized ROI: ${formatPercent(results.cagr)}`;
    } else {
      content = `Initial Investment,Final Value,Investment Length (years),Investment Gain,ROI (%),Annualized ROI (%)\n${formData.initialInvestment},${formData.finalValue},${results.investmentLength.toFixed(3)},${results.totalReturn},${results.roi},${results.cagr}`;
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

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  const formatPercent = (value: number) => `${value.toFixed(2)}%`;

  return (
    <form onSubmit={handleSubmit(calculateReturn)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs Column */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Inputs</h3>
        
        <div><Label htmlFor="initialInvestment">Amount Invested ($)</Label><Controller name="initialInvestment" control={control} render={({ field }) => <Input id="initialInvestment" type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
        <div><Label htmlFor="finalValue">Amount Returned ($)</Label><Controller name="finalValue" control={control} render={({ field }) => <Input id="finalValue" type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
        
        <Controller name="timeInputMethod" control={control} render={({ field }) => (
            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 gap-4">
                <Label className="p-4 border rounded-md text-center peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><RadioGroupItem value="length" className="mr-2"/>Use Length</Label>
                <Label className="p-4 border rounded-md text-center peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><RadioGroupItem value="dates" className="mr-2"/>Use Dates</Label>
            </RadioGroup>
        )}/>
        
        {timeInputMethod === 'length' ? (
          <div><Label htmlFor="investmentLength">Investment Length (years)</Label><Controller name="investmentLength" control={control} render={({ field }) => <Input id="investmentLength" type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div><Label>From</Label><Controller name="startDate" control={control} render={({ field }) => ( <Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover> )}/></div>
            <div><Label>To</Label><Controller name="endDate" control={control} render={({ field }) => ( <Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover> )}/></div>
          </div>
        )}
        {errors.investmentLength && <p className="text-destructive text-sm mt-1">{errors.investmentLength.message}</p>}

        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Calculate</Button>
            <Button type="button" variant="outline" onClick={handleClear}>Clear</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="outline" disabled={!results}><Download className="mr-2 h-4 w-4" /> Export</Button></DropdownMenuTrigger>
              <DropdownMenuContent><DropdownMenuItem onClick={() => handleExport('txt')}>Download .txt</DropdownMenuItem><DropdownMenuItem onClick={() => handleExport('csv')}>Download .csv</DropdownMenuItem></DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>

      {/* Results Column */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Result</h3>
        {results ? (
            results.error ? <Card className="flex items-center justify-center h-60 bg-muted/50 border-dashed"><p className="text-destructive">{results.error}</p></Card> : (
                <div className="space-y-4">
                    <Card><CardContent className="p-4 space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-muted-foreground">Investment Gain</span><span className="font-semibold text-primary">{formatCurrency(results.totalReturn)}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">ROI</span><span className="font-semibold text-primary">{formatPercent(results.roi)}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Annualized ROI</span><span className="font-semibold text-primary">{formatPercent(results.cagr)}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Investment Length</span><span className="font-semibold">{results.investmentLength.toFixed(3)} years</span></div>
                    </CardContent></Card>
                    <Card><CardContent className="p-4 h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={results.pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
                                  {results.pieData.map((_entry: any, index: number) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                                </Pie>
                                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                <Legend iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent></Card>
                </div>
            )
        ) : (
             <div className="flex items-center justify-center h-60 bg-muted/50 rounded-lg border border-dashed"><p className="text-sm text-muted-foreground">Enter your investment details to see returns</p></div>
        )}
      </div>
    </form>
  );
}
