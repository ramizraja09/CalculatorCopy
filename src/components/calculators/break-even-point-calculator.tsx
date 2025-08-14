
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
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';


const formSchema = z.object({
  fixedCosts: z.number().min(0, "Fixed costs must be non-negative"),
  variableCostPerUnit: z.number().min(0, "Variable cost must be non-negative"),
  sellingPricePerUnit: z.number().min(0.01, "Selling price must be positive"),
  profitTarget: z.number().min(0).optional(),
  monthlySales: z.number().min(0).optional(),
}).refine(data => data.sellingPricePerUnit > data.variableCostPerUnit, {
  message: "Selling price must be greater than variable cost per unit.",
  path: ["sellingPricePerUnit"],
});

type FormData = z.infer<typeof formSchema>;

export default function BreakEvenPointCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fixedCosts: 50000,
      variableCostPerUnit: 15,
      sellingPricePerUnit: 25,
      profitTarget: 10000,
      monthlySales: 6000,
    },
  });

  const calculateBreakEven = (data: FormData) => {
    const { fixedCosts, variableCostPerUnit, sellingPricePerUnit, profitTarget, monthlySales } = data;
    const contributionMargin = sellingPricePerUnit - variableCostPerUnit;
    
    // Basic Break-Even
    const breakEvenUnits = fixedCosts / contributionMargin;
    const breakEvenRevenue = breakEvenUnits * sellingPricePerUnit;

    // Profit Target
    let targetUnits = 0, targetRevenue = 0;
    if (profitTarget && profitTarget > 0) {
        targetUnits = (fixedCosts + profitTarget) / contributionMargin;
        targetRevenue = targetUnits * sellingPricePerUnit;
    }

    // Margin of Safety
    let marginOfSafetyUnits = 0, marginOfSafetyPercent = 0, monthsToBreakEven = 0;
    if (monthlySales && monthlySales > 0) {
        marginOfSafetyUnits = monthlySales - breakEvenUnits;
        marginOfSafetyPercent = (marginOfSafetyUnits / monthlySales) * 100;
        if(breakEvenUnits > 0) {
            monthsToBreakEven = breakEvenUnits / monthlySales;
        }
    }
    
    // Sensitivity Analysis
    const sensitivity = [-0.2, -0.1, 0, 0.1, 0.2].map(change => {
        const newPrice = sellingPricePerUnit * (1 + change);
        const newVC = variableCostPerUnit * (1 - change);
        const newMarginPrice = newPrice - variableCostPerUnit;
        const newMarginVC = sellingPricePerUnit - newVC;

        return {
            change: `${change * 100}%`,
            priceChangeUnits: fixedCosts / newMarginPrice,
            vcChangeUnits: fixedCosts / newMarginVC,
        };
    });

    const chartData = [
      { name: 'Break-Even', Fixed: fixedCosts, Variable: variableCostPerUnit * breakEvenUnits, Profit: 0 },
      ...(targetUnits > 0 ? [{ name: 'Target', Fixed: fixedCosts, Variable: variableCostPerUnit * targetUnits, Profit: profitTarget }] : [])
    ];

    const lineChartData = [];
    const maxUnits = Math.max(breakEvenUnits, targetUnits, monthlySales || 0) * 1.5;
    for (let i = 0; i <= maxUnits; i += maxUnits / 20) {
        lineChartData.push({
            units: Math.round(i),
            revenue: sellingPricePerUnit * i,
            costs: fixedCosts + variableCostPerUnit * i,
        })
    }

    setResults({
      breakEvenUnits, breakEvenRevenue,
      targetUnits, targetRevenue,
      marginOfSafetyUnits, marginOfSafetyPercent, monthsToBreakEven,
      sensitivity, chartData, lineChartData,
      error: null,
    });
    setFormData(data);
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `break-even-analysis.${format}`;
    const { fixedCosts, variableCostPerUnit, sellingPricePerUnit } = formData;

    if (format === 'txt') {
      content = `Break-Even Point Analysis\n\nInputs:\n- Fixed Costs: ${formatCurrency(fixedCosts)}\n- Variable Cost/Unit: ${formatCurrency(variableCostPerUnit)}\n- Selling Price/Unit: ${formatCurrency(sellingPricePerUnit)}\n\nResult:\n- Break-Even Units: ${Math.ceil(results.breakEvenUnits)}\n- Break-Even Revenue: ${formatCurrency(results.breakEvenRevenue)}`;
    } else {
       content = `Fixed Costs,Variable Cost/Unit,Selling Price/Unit,Break-Even Units,Break-Even Revenue\n${fixedCosts},${variableCostPerUnit},${sellingPricePerUnit},${Math.ceil(results.breakEvenUnits)},${results.breakEvenRevenue.toFixed(2)}`;
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
    <form onSubmit={handleSubmit(calculateBreakEven)} className="grid lg:grid-cols-3 gap-8">
      {/* Inputs Column */}
      <div className="lg:col-span-1 space-y-4">
        <Card>
            <CardHeader><CardTitle>Core Financials</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div><Label>Total Fixed Costs ($)</Label><Controller name="fixedCosts" control={control} render={({ field }) => <Input {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                <div><Label>Variable Cost per Unit ($)</Label><Controller name="variableCostPerUnit" control={control} render={({ field }) => <Input {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                <div><Label>Selling Price per Unit ($)</Label><Controller name="sellingPricePerUnit" control={control} render={({ field }) => <Input {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
                {errors.sellingPricePerUnit && <p className="text-destructive text-sm mt-1">{errors.sellingPricePerUnit.message}</p>}</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle>Optional Analysis</CardTitle></CardHeader>
             <CardContent className="space-y-4">
                <div><Label>Profit Target ($)</Label><Controller name="profitTarget" control={control} render={({ field }) => <Input {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                <div><Label>Current Average Monthly Units Sold</Label><Controller name="monthlySales" control={control} render={({ field }) => <Input {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
            </CardContent>
        </Card>
        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Calculate</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={!results}><Download className="mr-2 h-4 w-4" /> Export</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent><DropdownMenuItem onClick={() => handleExport('txt')}>Download as .txt</DropdownMenuItem><DropdownMenuItem onClick={() => handleExport('csv')}>Download as .csv</DropdownMenuItem></DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>

      {/* Results Column */}
      <div className="lg:col-span-2 space-y-4">
        <h3 className="text-xl font-semibold">Break-Even Analysis</h3>
        {results ? (
            <div className="space-y-4">
                <Alert><Info className="h-4 w-4" />
                    <AlertTitle>Summary</AlertTitle>
                    <AlertDescription>
                        To break even, you need to sell <strong>{Math.ceil(results.breakEvenUnits)} units</strong>, which translates to <strong>{formatCurrency(results.breakEvenRevenue)}</strong> in revenue.
                        {results.targetUnits > 0 && ` To make a profit of ${formatCurrency(formData?.profitTarget || 0)}, you must sell ${Math.ceil(results.targetUnits)} units.`}
                        {results.monthsToBreakEven > 0 && ` At your current sales rate, you will break even in approximately ${results.monthsToBreakEven.toFixed(1)} months.`}
                    </AlertDescription>
                </Alert>
                <div className="grid md:grid-cols-2 gap-4">
                     <Card>
                        <CardHeader><CardTitle className="text-base text-center">Cost vs. Revenue</CardTitle></CardHeader>
                        <CardContent className="h-64">
                            <ResponsiveContainer width="100%" height="100%"><LineChart data={results.lineChartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="units" type="number" /><YAxis tickFormatter={(val) => `$${(val/1000)}k`}/><Tooltip formatter={(value) => formatCurrency(value)} /><Legend /><Line type="monotone" dataKey="revenue" stroke="hsl(var(--chart-2))" dot={false}/><Line type="monotone" dataKey="costs" stroke="hsl(var(--destructive))" dot={false}/></LineChart></ResponsiveContainer>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader><CardTitle className="text-base text-center">Breakdown at Key Points</CardTitle></CardHeader>
                        <CardContent className="h-64">
                            <ResponsiveContainer width="100%" height="100%"><BarChart data={results.chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis tickFormatter={(val) => `$${(val/1000)}k`}/><Tooltip formatter={(value) => formatCurrency(value)} /><Legend /><Bar dataKey="Fixed" stackId="a" fill="hsl(var(--chart-1))" /><Bar dataKey="Variable" stackId="a" fill="hsl(var(--chart-3))" /><Bar dataKey="Profit" stackId="b" fill="hsl(var(--chart-2))" /></BarChart></ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
                 <Card>
                    <CardHeader><CardTitle>Sensitivity Analysis</CardTitle></CardHeader>
                    <CardContent>
                        <Table><TableHeader><TableRow><TableHead>Change</TableHead><TableHead>New Break-Even (Price Change)</TableHead><TableHead>New Break-Even (Cost Change)</TableHead></TableRow></TableHeader>
                            <TableBody>{results.sensitivity.map((row: any) => (<TableRow key={row.change}><TableCell>{row.change}</TableCell><TableCell>{Math.ceil(row.priceChangeUnits)} units</TableCell><TableCell>{Math.ceil(row.vcChangeUnits)} units</TableCell></TableRow>))}</TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        ) : ( <div className="flex items-center justify-center h-60 bg-muted/50 rounded-lg border border-dashed"><p className="text-sm text-muted-foreground">Enter your financial data for a complete analysis</p></div>)}
      </div>
    </form>
  );
}

    