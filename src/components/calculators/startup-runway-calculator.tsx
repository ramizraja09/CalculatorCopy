
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { addMonths, format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const formSchema = z.object({
  cashBalance: z.number().min(0, "Cash balance must be non-negative"),
  monthlyRevenue: z.number().min(0, "Monthly revenue must be non-negative"),
  monthlyExpenses: z.number().min(1, "Monthly expenses must be positive"),
}).refine(data => data.monthlyExpenses > data.monthlyRevenue, {
  message: "Expenses must be greater than revenue for a valid runway calculation.",
  path: ["monthlyExpenses"],
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
    },
  });

  const calculateRunway = (data: FormData) => {
    const { cashBalance, monthlyRevenue, monthlyExpenses } = data;
    const netBurn = monthlyExpenses - monthlyRevenue;
    const runwayMonths = cashBalance / netBurn;
    
    const endDate = addMonths(new Date(), runwayMonths);

    setResults({
      runwayMonths: runwayMonths.toFixed(1),
      endDate: format(endDate, "MMMM yyyy"),
      netBurn: netBurn,
    });
    setFormData(data);
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `startup-runway-calculation.${format}`;
    const { cashBalance, monthlyRevenue, monthlyExpenses } = formData;

    if (format === 'txt') {
      content = `Startup Runway Calculation\n\nInputs:\n- Cash Balance: ${formatCurrency(cashBalance)}\n- Monthly Revenue: ${formatCurrency(monthlyRevenue)}\n- Monthly Expenses: ${formatCurrency(monthlyExpenses)}\n\nResult:\n- Runway: ${results.runwayMonths} months\n- Estimated End Date: ${results.endDate}`;
    } else {
       content = `Cash Balance,Monthly Revenue,Monthly Expenses,Runway (months),End Date\n${cashBalance},${monthlyRevenue},${monthlyExpenses},${results.runwayMonths},${results.endDate}`;
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
    <form onSubmit={handleSubmit(calculateRunway)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs Column */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Financials</h3>
        
        <div>
          <Label htmlFor="cashBalance">Current Cash Balance ($)</Label>
          <Controller name="cashBalance" control={control} render={({ field }) => <Input id="cashBalance" type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
        </div>

        <div>
          <Label htmlFor="monthlyRevenue">Monthly Revenue ($)</Label>
          <Controller name="monthlyRevenue" control={control} render={({ field }) => <Input id="monthlyRevenue" type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
        </div>

        <div>
          <Label htmlFor="monthlyExpenses">Monthly Operating Expenses ($)</Label>
          <Controller name="monthlyExpenses" control={control} render={({ field }) => <Input id="monthlyExpenses" type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
          {errors.monthlyExpenses && <p className="text-destructive text-sm mt-1">{errors.monthlyExpenses.message}</p>}
        </div>
        
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
                        <p className="text-3xl font-bold">{results.runwayMonths} months</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 grid grid-cols-2 gap-2 text-sm text-center">
                         <div><p className="text-muted-foreground">Estimated End Date</p><p className="font-semibold">{results.endDate}</p></div>
                         <div><p className="text-muted-foreground">Net Monthly Burn</p><p className="font-semibold">{formatCurrency(results.netBurn)}</p></div>
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
