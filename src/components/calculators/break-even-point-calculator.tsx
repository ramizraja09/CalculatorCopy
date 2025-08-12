
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
  fixedCosts: z.number().min(0, "Fixed costs must be non-negative"),
  variableCostPerUnit: z.number().min(0, "Variable cost must be non-negative"),
  sellingPricePerUnit: z.number().min(0.01, "Selling price must be positive"),
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
      fixedCosts: 10000,
      variableCostPerUnit: 20,
      sellingPricePerUnit: 50,
    },
  });

  const calculateBreakEven = (data: FormData) => {
    const { fixedCosts, variableCostPerUnit, sellingPricePerUnit } = data;
    const contributionMargin = sellingPricePerUnit - variableCostPerUnit;
    const breakEvenUnits = fixedCosts / contributionMargin;
    const breakEvenRevenue = breakEvenUnits * sellingPricePerUnit;

    setResults({
      breakEvenUnits,
      breakEvenRevenue,
      error: null,
    });
    setFormData(data);
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `break-even-calculation.${format}`;
    const { fixedCosts, variableCostPerUnit, sellingPricePerUnit } = formData;

    if (format === 'txt') {
      content = `Break-Even Point Calculation\n\nInputs:\n- Fixed Costs: ${formatCurrency(fixedCosts)}\n- Variable Cost per Unit: ${formatCurrency(variableCostPerUnit)}\n- Selling Price per Unit: ${formatCurrency(sellingPricePerUnit)}\n\nResult:\n- Break-Even Units: ${results.breakEvenUnits.toFixed(2)}\n- Break-Even Revenue: ${formatCurrency(results.breakEvenRevenue)}`;
    } else {
       content = `Fixed Costs,Variable Cost per Unit,Selling Price per Unit,Break-Even Units,Break-Even Revenue\n${fixedCosts},${variableCostPerUnit},${sellingPricePerUnit},${results.breakEvenUnits.toFixed(2)},${results.breakEvenRevenue.toFixed(2)}`;
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
    <form onSubmit={handleSubmit(calculateBreakEven)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs Column */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Cost & Price Details</h3>
        
        <div>
          <Label htmlFor="fixedCosts">Total Fixed Costs ($)</Label>
          <Controller name="fixedCosts" control={control} render={({ field }) => <Input id="fixedCosts" type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
          {errors.fixedCosts && <p className="text-destructive text-sm mt-1">{errors.fixedCosts.message}</p>}
        </div>

        <div>
          <Label htmlFor="variableCostPerUnit">Variable Cost per Unit ($)</Label>
          <Controller name="variableCostPerUnit" control={control} render={({ field }) => <Input id="variableCostPerUnit" type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
          {errors.variableCostPerUnit && <p className="text-destructive text-sm mt-1">{errors.variableCostPerUnit.message}</p>}
        </div>

        <div>
          <Label htmlFor="sellingPricePerUnit">Selling Price per Unit ($)</Label>
          <Controller name="sellingPricePerUnit" control={control} render={({ field }) => <Input id="sellingPricePerUnit" type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
          {errors.sellingPricePerUnit && <p className="text-destructive text-sm mt-1">{errors.sellingPricePerUnit.message}</p>}
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
        <h3 className="text-xl font-semibold">Break-Even Point</h3>
        {results ? (
            results.error ? (
                <Card className="flex items-center justify-center h-60 bg-muted/50 border-dashed">
                    <p className="text-destructive">{results.error}</p>
                </Card>
            ) : (
                <div className="space-y-4">
                    <Card>
                        <CardContent className="p-4 text-center">
                            <p className="text-sm text-muted-foreground">Break-Even Units</p>
                            <p className="text-3xl font-bold">{Math.ceil(results.breakEvenUnits).toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">You need to sell this many units to cover costs.</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                             <p className="text-sm text-muted-foreground">Break-Even Revenue</p>
                             <p className="text-3xl font-bold">{formatCurrency(results.breakEvenRevenue)}</p>
                             <p className="text-xs text-muted-foreground">This is the total revenue needed to cover costs.</p>
                        </CardContent>
                    </Card>
                </div>
            )
        ) : (
             <div className="flex items-center justify-center h-60 bg-muted/50 rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">Enter your cost and price details</p>
            </div>
        )}
      </div>
    </form>
  );
}
