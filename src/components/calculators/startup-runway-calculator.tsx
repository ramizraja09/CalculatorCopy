
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
import { addMonths, format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LineChart, BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';


const formSchema = z.object({
  cashBalance: z.number().min(0, "Cash balance must be non-negative"),
  monthlyRevenue: z.number().min(0, "Monthly revenue must be non-negative"),
  monthlyExpenses: z.number().min(1, "Monthly expenses must be positive"),
  monthlyRevenueGrowth: z.number().min(0).default(0),
  monthlyExpenseGrowth: z.number().min(0).default(0),
}).refine(data => data.monthlyExpenses > data.monthlyRevenue || data.monthlyRevenueGrowth > data.monthlyExpenseGrowth, {
  message: "If revenue is higher than expenses, expense growth must be lower than revenue growth.",
  path: ["monthlyExpenseGrowth"],
});


type FormData = z.infer<typeof formSchema>;

export default function StartupRunwayCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cashBalance: 250000,
      monthlyRevenue: 20000,
      monthlyExpenses: 50000,
      monthlyRevenueGrowth: 5,
      monthlyExpenseGrowth: 1,
    },
  });

  const calculateRunway = (data: FormData) => {
    const { cashBalance, monthlyRevenueGrowth, monthlyExpenseGrowth } = data;
    let currentCash = cashBalance;
    let currentRevenue = data.monthlyRevenue;
    let currentExpenses = data.monthlyExpenses;
    
    let months = 0;
    const monthlyProjections = [];

    // Loop for a maximum of 10 years to prevent infinite loops
    while (currentCash > 0 && months < 120) {
        months++;
        const netBurn = currentExpenses - currentRevenue;
        currentCash -= netBurn;

        monthlyProjections.push({
            month: months,
            revenue: currentRevenue,
            expenses: currentExpenses,
            netBurn: netBurn,
            cashBalance: Math.max(0, currentCash),
        });

        // Apply growth for next month
        currentRevenue *= (1 + monthlyRevenueGrowth / 100);
        currentExpenses *= (1 + monthlyExpenseGrowth / 100);

        if (netBurn <= 0 && currentCash > 0) { // Profitable
            break;
        }
    }

    const isProfitable = (currentExpenses - currentRevenue) < 0;

    setResults({
      runwayMonths: isProfitable ? Infinity : months,
      endDate: isProfitable ? 'N/A (Profitable)' : format(addMonths(new Date(), months), "MMMM yyyy"),
      netBurn: data.monthlyExpenses - data.monthlyRevenue,
      projections: monthlyProjections,
      isProfitable,
    });
    setFormData(data);
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `startup-runway-calculation.${format}`;

    if (format === 'txt') {
      content = `Startup Runway Calculation\n\nInputs:\n${Object.entries(formData).map(([k,v]) => `- ${k}: ${v}`).join('\n')}\n\nResult:\n- Runway: ${results.runwayMonths === Infinity ? 'Infinite (Profitable)' : `${results.runwayMonths} months`}\n- Estimated End Date: ${results.endDate}`;
    } else {
       content = `Category,Value\n${Object.entries(formData).map(([k,v]) => `${k},${v}`).join('\n')}\n\nResult Category,Value\nRunway (months),${results.runwayMonths === Infinity ? 'Infinite' : results.runwayMonths}\nEnd Date,${results.endDate}\n`;
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
    <form onSubmit={handleSubmit(calculateRunway)} className="grid lg:grid-cols-2 gap-8">
      {/* Inputs Column */}
      <div className="space-y-4">
        <Card>
            <CardHeader><CardTitle>Financials</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label htmlFor="cashBalance">Current Cash Balance ($)</Label><Controller name="cashBalance" control={control} render={({ field }) => <Input id="cashBalance" type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
              <div><Label htmlFor="monthlyRevenue">Current Monthly Revenue ($)</Label><Controller name="monthlyRevenue" control={control} render={({ field }) => <Input id="monthlyRevenue" type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
              <div><Label htmlFor="monthlyExpenses">Current Monthly Operating Expenses ($)</Label><Controller name="monthlyExpenses" control={control} render={({ field }) => <Input id="monthlyExpenses" type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle>Monthly Growth Rates</CardTitle></CardHeader>
            <CardContent className="space-y-4">
               <div><Label htmlFor="monthlyRevenueGrowth">Revenue Growth Rate (%/month)</Label><Controller name="monthlyRevenueGrowth" control={control} render={({ field }) => <Input id="monthlyRevenueGrowth" type="number" step="0.1" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
               <div><Label htmlFor="monthlyExpenseGrowth">Expense Growth Rate (%/month)</Label><Controller name="monthlyExpenseGrowth" control={control} render={({ field }) => <Input id="monthlyExpenseGrowth" type="number" step="0.1" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
               {errors.monthlyExpenseGrowth && <p className="text-destructive text-sm mt-1">{errors.monthlyExpenseGrowth.message}</p>}
            </CardContent>
        </Card>
        
        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Calculate Runway</Button>
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
        <h3 className="text-xl font-semibold">Runway Estimate</h3>
        {results ? (
            <div className="space-y-4">
                <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-sm text-muted-foreground">Cash Runway</p>
                        <p className="text-3xl font-bold">{results.isProfitable ? 'Profitable' : `${results.runwayMonths} months`}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 grid grid-cols-2 gap-2 text-sm text-center">
                         <div><p className="text-muted-foreground">Cash Zero Date</p><p className="font-semibold">{results.endDate}</p></div>
                         <div><p className="text-muted-foreground">Initial Monthly Burn</p><p className="font-semibold">{formatCurrency(results.netBurn)}</p></div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="text-base text-center">Cash Balance Projection</CardTitle></CardHeader>
                    <CardContent className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={results.projections} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" label={{ value: "Month", position: "insideBottom", offset: -5 }} />
                          <YAxis tickFormatter={(val) => `$${(val/1000)}k`}/>
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                          <Legend />
                          <Line type="monotone" dataKey="cashBalance" name="Cash Balance" stroke="hsl(var(--chart-2))" dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle className="text-base text-center">Revenue vs. Expenses</CardTitle></CardHeader>
                    <CardContent className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={results.projections} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" label={{ value: "Month", position: "insideBottom", offset: -5 }} />
                          <YAxis tickFormatter={(val) => `$${(val/1000)}k`}/>
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                          <Legend />
                          <Bar dataKey="revenue" fill="hsl(var(--chart-2))" name="Revenue" />
                          <Bar dataKey="expenses" fill="hsl(var(--destructive))" name="Expenses" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                </Card>

            </div>
        ) : (
             <div className="flex items-center justify-center h-60 bg-muted/50 rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">Enter financials to calculate your runway</p>
            </div>
        )}
      </div>
    </form>
  );
}
