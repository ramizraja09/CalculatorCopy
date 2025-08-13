
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

const formSchema = z.object({
  retirementAge: z.number().int().min(18),
  lifeExpectancy: z.number().int().min(19),

  // Lump Sum
  lumpSumAmount: z.number().min(0),
  investmentReturn: z.number().min(0),

  // Monthly Pension
  monthlyPension: z.number().min(0),
  cola: z.number().min(0), // Cost of living adjustment
}).refine(data => data.lifeExpectancy > data.retirementAge, {
  message: "Life expectancy must be after retirement age.",
  path: ["lifeExpectancy"],
});

type FormData = z.infer<typeof formSchema>;

export default function PensionCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      retirementAge: 65,
      lifeExpectancy: 90,
      lumpSumAmount: 800000,
      investmentReturn: 5,
      monthlyPension: 5000,
      cola: 3.5,
    },
  });
  
  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const calculateComparison = (data: FormData) => {
    const { retirementAge, lifeExpectancy, lumpSumAmount, investmentReturn, monthlyPension, cola } = data;
    
    const n = (lifeExpectancy - retirementAge) * 12; // total number of payments
    const i = investmentReturn / 100 / 12; // monthly investment return
    const g = cola / 100 / 12; // monthly growth rate of pension
    
    let presentValue;
    if (i === g) {
        // Special case where growth rate equals discount rate
        presentValue = monthlyPension * n / (1 + i);
    } else {
        presentValue = monthlyPension * (1 - Math.pow((1 + g) / (1 + i), n)) / (i - g);
    }

    setResults({
      lumpSumAmount,
      presentValueOfPension: presentValue,
      difference: presentValue - lumpSumAmount,
    });
    setFormData(data);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `pension-comparison.${format}`;

    if (format === 'txt') {
      content = `Pension Comparison\n\nInputs:\n`;
      Object.entries(formData).forEach(([key, value]) => content += `- ${key}: ${value}\n`);
      content += `\nResults:\n`;
      content += `- Lump Sum Value: ${formatCurrency(results.lumpSumAmount)}\n`;
      content += `- Present Value of Pension: ${formatCurrency(results.presentValueOfPension)}\n`;
      content += `- Difference: ${formatCurrency(results.difference)}\n`;
    } else {
      content = 'Category,Value\n';
      Object.entries(formData).forEach(([key, value]) => content += `${key},${value}\n`);
      content += '\nResult Category,Value\n';
      content += `Lump Sum Value,${results.lumpSumAmount.toFixed(2)}\n`;
      content += `Present Value of Pension,${results.presentValueOfPension.toFixed(2)}\n`;
      content += `Difference,${results.difference.toFixed(2)}\n`;
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
    <div className="grid md:grid-cols-2 gap-8">
      <form onSubmit={handleSubmit(calculateComparison)} className="space-y-4">
        <Card>
            <CardHeader><CardTitle>Pension Payout Comparison</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div><Label>Your Retirement Age</Label><Controller name="retirementAge" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />} /></div>
                    <div><Label>Life Expectancy</Label><Controller name="lifeExpectancy" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />} /></div>
                </div>
                 {errors.lifeExpectancy && <p className="text-destructive text-sm mt-1">{errors.lifeExpectancy.message}</p>}
                
                <h4 className="font-semibold text-lg pt-4">Option 1: Lump Sum Payment</h4>
                <div><Label>Lump Sum Payout Amount ($)</Label><Controller name="lumpSumAmount" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                <div><Label>Expected Investment Return (% per year)</Label><Controller name="investmentReturn" control={control} render={({ field }) => <Input type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>

                <h4 className="font-semibold text-lg pt-4">Option 2: Monthly Pension</h4>
                <div><Label>Monthly Pension Income ($)</Label><Controller name="monthlyPension" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                <div><Label>Cost-of-Living Adjustment (% per year)</Label><Controller name="cola" control={control} render={({ field }) => <Input type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                
                 <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex-1">Compare</Button>
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
            </CardContent>
        </Card>
      </form>

      <div className="space-y-4">
          <h3 className="text-xl font-semibold">Comparison Result</h3>
          {results ? (
              <div className="space-y-4">
                  <Alert variant={results.difference > 0 ? "default" : "destructive"} className={results.difference > 0 ? "border-green-500" : ""}>
                    <Info className="h-4 w-4" />
                    <AlertTitle>
                        {results.difference > 0 ? "Monthly Pension Appears More Valuable" : "Lump Sum Appears More Valuable"}
                    </AlertTitle>
                    <AlertDescription>
                        The calculated present value of the monthly pension is {formatCurrency(Math.abs(results.difference))} {results.difference > 0 ? 'more' : 'less'} than the lump sum offer.
                    </AlertDescription>
                </Alert>
                <Card>
                    <CardHeader><CardTitle className="text-base text-center">Financial Value Comparison</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-center">
                            <p className="text-muted-foreground">Lump Sum Value</p>
                            <p className="text-2xl font-bold">{formatCurrency(results.lumpSumAmount)}</p>
                        </div>
                        <div className="text-center border-t pt-4">
                            <p className="text-muted-foreground">Present Value of Monthly Pension</p>
                            <p className="text-2xl font-bold">{formatCurrency(results.presentValueOfPension)}</p>
                        </div>
                    </CardContent>
                </Card>
              </div>
          ) : (
            <div className="flex items-center justify-center h-60 bg-muted/50 rounded-lg border border-dashed">
              <p className="text-sm text-muted-foreground">Enter details to compare pension options</p>
            </div>
          )}
      </div>
    </div>
  );
}
