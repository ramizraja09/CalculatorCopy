
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const formSchema = z.object({
  loanAmount: z.number().min(1, "Loan amount must be positive"),
  propertyValue: z.number().min(1, "Property value must be positive"),
}).refine(data => data.loanAmount <= data.propertyValue, {
  message: "Loan amount cannot be greater than property value.",
  path: ["loanAmount"],
});

type FormData = z.infer<typeof formSchema>;

const getLtvCategory = (ltv: number) => {
    if (ltv <= 80) return { category: "Low Risk", color: "text-green-600" };
    if (ltv <= 95) return { category: "Medium Risk", color: "text-yellow-600" };
    return { category: "High Risk", color: "text-destructive" };
};

export default function LtvCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      loanAmount: 280000,
      propertyValue: 350000,
    },
  });

  const calculateLtv = (data: FormData) => {
    const { loanAmount, propertyValue } = data;
    const ltv = (loanAmount / propertyValue) * 100;
    
    setResults({
      ltv: ltv.toFixed(2),
      category: getLtvCategory(ltv),
    });
    setFormData(data);
  };

  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `ltv-calculation.${format}`;
    const { loanAmount, propertyValue } = formData;

    if (format === 'txt') {
      content = `Loan-to-Value (LTV) Calculation\n\nInputs:\n- Loan Amount: ${formatCurrency(loanAmount)}\n- Property Value: ${formatCurrency(propertyValue)}\n\nResult:\n- LTV Ratio: ${results.ltv}%\n- Risk Category: ${results.category.category}`;
    } else {
       content = `Category,Value\nLoan Amount,${loanAmount}\nProperty Value,${propertyValue}\nLTV (%),${results.ltv}\nRisk Category,${results.category.category}`;
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

  return (
    <form onSubmit={handleSubmit(calculateLtv)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs Column */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Inputs</h3>
        
        <div>
          <Label htmlFor="loanAmount">Loan Amount ($)</Label>
          <Controller name="loanAmount" control={control} render={({ field }) => <Input id="loanAmount" type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
          {errors.loanAmount && <p className="text-destructive text-sm mt-1">{errors.loanAmount.message}</p>}
        </div>

        <div>
          <Label htmlFor="propertyValue">Appraised Property Value ($)</Label>
          <Controller name="propertyValue" control={control} render={({ field }) => <Input id="propertyValue" type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
          {errors.propertyValue && <p className="text-destructive text-sm mt-1">{errors.propertyValue.message}</p>}
        </div>
        
        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Calculate LTV</Button>
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
            <Card>
                <CardContent className="p-6 text-center">
                    <p className="text-sm text-muted-foreground">Loan-to-Value (LTV) Ratio</p>
                    <p className="text-4xl font-bold my-2">{results.ltv}%</p>
                    <p className={`text-lg font-semibold ${results.category.color}`}>{results.category.category}</p>
                </CardContent>
            </Card>
        ) : (
             <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">Enter values to calculate LTV</p>
            </div>
        )}
      </div>
    </form>
  );
}
