
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// 2024 Federal Income Tax Brackets & Standard Deductions
const taxBrackets = {
  single: [
    { rate: 0.10, from: 0, to: 11600 },
    { rate: 0.12, from: 11601, to: 47150 },
    { rate: 0.22, from: 47151, to: 100525 },
    { rate: 0.24, from: 100526, to: 191950 },
    { rate: 0.32, from: 191951, to: 243725 },
    { rate: 0.35, from: 243726, to: 609350 },
    { rate: 0.37, from: 609351, to: Infinity },
  ],
  married_jointly: [
    { rate: 0.10, from: 0, to: 23200 },
    { rate: 0.12, from: 23201, to: 94300 },
    { rate: 0.22, from: 94301, to: 201050 },
    { rate: 0.24, from: 201051, to: 383900 },
    { rate: 0.32, from: 383901, to: 487450 },
    { rate: 0.35, from: 487451, to: 731200 },
    { rate: 0.37, from: 731201, to: Infinity },
  ],
};

const standardDeductions = {
  single: 14600,
  married_jointly: 29200,
};

const formSchema = z.object({
  income: z.number().min(0, 'Income must be non-negative'),
  filingStatus: z.enum(['single', 'married_jointly']),
});

type FormData = z.infer<typeof formSchema>;

export default function IncomeTaxCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      income: 75000,
      filingStatus: 'single',
    },
  });

  const calculateTax = (data: FormData) => {
    const { income, filingStatus } = data;
    const deduction = standardDeductions[filingStatus];
    const taxableIncome = Math.max(0, income - deduction);
    const brackets = taxBrackets[filingStatus];

    let tax = 0;
    let remainingIncome = taxableIncome;

    for (const bracket of brackets) {
      if (remainingIncome > bracket.from) {
        const taxableInBracket = Math.min(remainingIncome, bracket.to) - bracket.from;
        tax += taxableInBracket * bracket.rate;
      }
    }

    const effectiveRate = income > 0 ? (tax / income) * 100 : 0;

    setResults({
      totalTax: tax,
      taxableIncome,
      effectiveRate,
      error: null,
    });
    setFormData(data);
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `income-tax-calculation.${format}`;
    const { income, filingStatus } = formData;

    if (format === 'txt') {
      content = `Income Tax Calculation\n\nInputs:\n- Gross Annual Income: ${formatCurrency(income)}\n- Filing Status: ${filingStatus}\n\nResult:\n- Estimated Federal Tax: ${formatCurrency(results.totalTax)}\n- Taxable Income: ${formatCurrency(results.taxableIncome)}\n- Effective Tax Rate: ${results.effectiveRate.toFixed(2)}%`;
    } else {
       content = `Category,Value\nGross Annual Income,${income}\nFiling Status,${filingStatus}\n\nResult Category,Value\nEstimated Federal Tax,${results.totalTax}\nTaxable Income,${results.taxableIncome}\nEffective Tax Rate (%),${results.effectiveRate.toFixed(2)}`;
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
    <form onSubmit={handleSubmit(calculateTax)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs Column */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Inputs</h3>
        
        <div>
          <Label htmlFor="income">Gross Annual Income ($)</Label>
          <Controller name="income" control={control} render={({ field }) => <Input id="income" type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
          {errors.income && <p className="text-destructive text-sm mt-1">{errors.income.message}</p>}
        </div>

        <div>
          <Label htmlFor="filingStatus">Filing Status</Label>
          <Controller name="filingStatus" control={control} render={({ field }) => (
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single</SelectItem>
                <SelectItem value="married_jointly">Married Filing Jointly</SelectItem>
              </SelectContent>
            </Select>
          )} />
        </div>
        
        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Calculate Tax</Button>
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
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>For Estimation Only</AlertTitle>
          <AlertDescription className="text-xs">
            This calculator provides an estimate for U.S. Federal income tax based on 2024 brackets and standard deductions. It does not account for state taxes, local taxes, tax credits, or other complex situations.
          </AlertDescription>
        </Alert>
      </div>

      {/* Results Column */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Results</h3>
        {results ? (
            <div className="space-y-4">
                <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-sm text-muted-foreground">Estimated Federal Tax</p>
                        <p className="text-3xl font-bold">{formatCurrency(results.totalTax)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 grid grid-cols-2 gap-2 text-sm text-center">
                        <div><p className="text-muted-foreground">Taxable Income</p><p className="font-semibold">{formatCurrency(results.taxableIncome)}</p></div>
                        <div><p className="text-muted-foreground">Effective Tax Rate</p><p className="font-semibold">{results.effectiveRate.toFixed(2)}%</p></div>
                    </CardContent>
                </Card>
            </div>
        ) : (
             <div className="flex items-center justify-center h-60 bg-muted/50 rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">Enter your details to estimate your federal income tax</p>
            </div>
        )}
      </div>
    </form>
  );
}
