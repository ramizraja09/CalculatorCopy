
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
import { Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Simplified Consumer Price Index (CPI) data for demonstration.
// In a real application, this would be fetched from an API or a more extensive database.
// Source: U.S. Bureau of Labor Statistics (Annual Average CPI-U)
const cpiData: { [year: number]: number } = {
  2023: 304.702,
  2022: 292.655,
  2021: 270.970,
  2020: 258.811,
  2019: 255.657,
  2018: 251.107,
  2017: 245.120,
  2016: 240.007,
  2015: 237.017,
  2010: 218.056,
  2000: 172.2,
  1990: 130.7,
  1980: 82.4,
};
const availableYears = Object.keys(cpiData).map(Number).sort((a,b) => b - a);


const formSchema = z.object({
  initialAmount: z.number().min(0.01, 'Amount must be positive'),
  startYear: z.number(),
  endYear: z.number(),
}).refine(data => data.endYear !== data.startYear, {
    message: "Start and end years must be different.",
    path: ["endYear"],
});


type FormData = z.infer<typeof formSchema>;

export default function InflationCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      initialAmount: 100,
      startYear: 2000,
      endYear: 2023,
    },
  });

  const calculateInflation = (data: FormData) => {
    const { initialAmount, startYear, endYear } = data;
    const startCpi = cpiData[startYear];
    const endCpi = cpiData[endYear];

    if (!startCpi || !endCpi) {
        setResults({ error: "Could not find CPI data for the selected years." });
        return;
    }

    const finalAmount = initialAmount * (endCpi / startCpi);
    const totalInflation = ((endCpi - startCpi) / startCpi) * 100;

    setResults({
      initialAmount,
      finalAmount,
      totalInflation,
      startYear,
      endYear,
      error: null,
    });
    setFormData(data);
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `inflation-calculation.${format}`;
    const { initialAmount, startYear, endYear } = formData;

    if (format === 'txt') {
      content = `Inflation Calculation\n\nInputs:\n- Amount: ${formatCurrency(initialAmount)}\n- From Year: ${startYear}\n- To Year: ${endYear}\n\nResult:\n- Equivalent Amount: ${formatCurrency(results.finalAmount)}\n- Total Inflation: ${results.totalInflation.toFixed(2)}%`;
    } else {
       content = `Category,Value\nInitial Amount,${initialAmount}\nStart Year,${startYear}\nEnd Year,${endYear}\n\nResult Category,Value\nFinal Amount,${results.finalAmount.toFixed(2)}\nTotal Inflation (%),${results.totalInflation.toFixed(2)}`;
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
    <form onSubmit={handleSubmit(calculateInflation)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs Column */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Inputs</h3>
        
        <div>
          <Label htmlFor="initialAmount">Amount ($)</Label>
          <Controller name="initialAmount" control={control} render={({ field }) => <Input id="initialAmount" type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
          {errors.initialAmount && <p className="text-destructive text-sm mt-1">{errors.initialAmount.message}</p>}
        </div>

        <div>
          <Label htmlFor="startYear">Start Year</Label>
          <Controller
              name="startYear"
              control={control}
              render={({ field }) => (
                  <Select onValueChange={value => field.onChange(Number(value))} defaultValue={String(field.value)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                          {availableYears.map(year => <SelectItem key={year} value={String(year)}>{year}</SelectItem>)}
                      </SelectContent>
                  </Select>
              )}
          />
        </div>

        <div>
          <Label htmlFor="endYear">End Year</Label>
          <Controller
              name="endYear"
              control={control}
              render={({ field }) => (
                  <Select onValueChange={value => field.onChange(Number(value))} defaultValue={String(field.value)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                          {availableYears.map(year => <SelectItem key={year} value={String(year)}>{year}</SelectItem>)}
                      </SelectContent>
                  </Select>
              )}
          />
           {errors.endYear && <p className="text-destructive text-sm mt-1">{errors.endYear.message}</p>}
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
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Results</h3>
        {results ? (
            results.error ? (
                <Card className="flex items-center justify-center h-60 bg-muted/50 border-dashed">
                    <p className="text-destructive">{results.error}</p>
                </Card>
            ) : (
                <Card>
                    <CardContent className="p-4 space-y-4">
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">{formatCurrency(results.initialAmount)} in {results.startYear} has the same buying power as</p>
                            <p className="text-3xl font-bold my-2">{formatCurrency(results.finalAmount)}</p>
                            <p className="text-sm text-muted-foreground">in {results.endYear}.</p>
                        </div>
                        <div className="text-center border-t pt-4">
                             <p className="text-muted-foreground">Total Inflation</p>
                             <p className="font-semibold text-lg">{results.totalInflation.toFixed(2)}%</p>
                        </div>
                    </CardContent>
                </Card>
            )
        ) : (
             <div className="flex items-center justify-center h-60 bg-muted/50 rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">Enter an amount and date range to see the effects of inflation</p>
            </div>
        )}
      </div>
    </form>
  );
}
