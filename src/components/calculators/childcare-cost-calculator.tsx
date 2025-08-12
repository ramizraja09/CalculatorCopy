
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
  monthlyCost: z.number().min(0, "Cost must be non-negative"),
  yearsNeeded: z.number().int().min(1, "Years must be at least 1"),
  numberOfChildren: z.number().int().min(1, "Must have at least 1 child"),
});

type FormData = z.infer<typeof formSchema>;

export default function ChildcareCostCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      monthlyCost: 1200,
      yearsNeeded: 5,
      numberOfChildren: 1,
    },
  });

  const calculateCost = (data: FormData) => {
    const { monthlyCost, yearsNeeded, numberOfChildren } = data;
    const annualCost = monthlyCost * 12 * numberOfChildren;
    const totalCost = annualCost * yearsNeeded;

    setResults({
      annualCost,
      totalCost,
    });
    setFormData(data);
  };
  
  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `childcare-cost-calculation.${format}`;
    const { monthlyCost, yearsNeeded, numberOfChildren } = formData;

    if (format === 'txt') {
      content = `Childcare Cost Calculation\n\nInputs:\n- Monthly Cost per Child: ${formatCurrency(monthlyCost)}\n- Years of Care: ${yearsNeeded}\n- Number of Children: ${numberOfChildren}\n\nResults:\n- Estimated Annual Cost: ${formatCurrency(results.annualCost)}\n- Estimated Total Cost: ${formatCurrency(results.totalCost)}`;
    } else {
       content = `Monthly Cost,Years Needed,Number of Children,Annual Cost,Total Cost\n${monthlyCost},${yearsNeeded},${numberOfChildren},${results.annualCost.toFixed(2)},${results.totalCost.toFixed(2)}`;
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
    <form onSubmit={handleSubmit(calculateCost)} className="grid md:grid-cols-2 gap-8">
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Childcare Details</h3>
        <div><Label>Monthly Cost per Child ($)</Label><Controller name="monthlyCost" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
        <div><Label>Years of Care Needed</Label><Controller name="yearsNeeded" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
        <div><Label>Number of Children</Label><Controller name="numberOfChildren" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Calculate Total Cost</Button>
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
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Cost Summary</h3>
        {results ? (
            <div className="space-y-4">
                <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-sm text-muted-foreground">Estimated Annual Cost</p>
                        <p className="text-3xl font-bold">{formatCurrency(results.annualCost)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-sm text-muted-foreground">Estimated Total Cost</p>
                        <p className="text-3xl font-bold">{formatCurrency(results.totalCost)}</p>
                    </CardContent>
                </Card>
            </div>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter details to estimate childcare costs</p></div>
        )}
      </div>
    </form>
  );
}
