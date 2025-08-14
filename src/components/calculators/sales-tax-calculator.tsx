
"use client";

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const formSchema = z.object({
  solveFor: z.enum(['total', 'preTax', 'taxRate']),
  preTax: z.number().optional(),
  taxRate: z.number().optional(),
  total: z.number().optional(),
});

type FormData = z.infer<typeof formSchema>;

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

export default function SalesTaxCalculator() {
  const [isCalculated, setIsCalculated] = useState(false);
  const { control, handleSubmit, watch, setValue, trigger } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      solveFor: 'total',
      preTax: 100,
      taxRate: 8,
    },
  });

  const solveFor = watch('solveFor');
  const formValues = watch();

  useEffect(() => {
    // This effect will re-calculate whenever an input changes, providing a live update feel.
    const subscription = watch((values, { name, type }) => {
      if (type === 'change') {
        const { solveFor, preTax, taxRate, total } = values;
        if (preTax === undefined || taxRate === undefined || total === undefined) return;
        
        try {
          if (solveFor === 'total' && preTax > 0 && taxRate >= 0) {
            const taxAmount = preTax * (taxRate / 100);
            setValue('total', preTax + taxAmount);
          } else if (solveFor === 'preTax' && total > 0 && taxRate >= 0) {
            const calculatedPreTax = total / (1 + taxRate / 100);
            setValue('preTax', calculatedPreTax);
          } else if (solveFor === 'taxRate' && total > 0 && preTax > 0 && total > preTax) {
             const calculatedTaxRate = ((total / preTax) - 1) * 100;
             setValue('taxRate', calculatedTaxRate);
          }
        } catch(e) {
            // handle potential errors if necessary
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, setValue, solveFor]);

  const handleCalculate = (data: FormData) => {
    // The main calculation logic is now in the useEffect for live updates.
    // This function can be used to set a "calculated" state if needed.
    setIsCalculated(true);
  };
  
  const isInputDisabled = (field: 'preTax' | 'taxRate' | 'total') => solveFor === field;

  return (
    <form onSubmit={handleSubmit(handleCalculate)} className="space-y-6">
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-start">
            <div className="flex-1 space-y-2">
                <Label htmlFor="preTax">Before Tax Price</Label>
                <div className="flex items-center gap-2">
                    <RadioGroup value={solveFor} onValueChange={(val) => setValue('solveFor', val as any)}>
                        <RadioGroupItem value="preTax" id="solveForPreTax" checked={isInputDisabled('preTax')} />
                    </RadioGroup>
                    <Controller name="preTax" control={control} render={({ field }) => (
                         <Input id="preTax" type="number" step="0.01" {...field} disabled={isInputDisabled('preTax')} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                    )}/>
                </div>
            </div>
            <div className="flex-1 space-y-2">
                <Label htmlFor="taxRate">Sales Tax Rate</Label>
                <div className="flex items-center gap-2">
                    <RadioGroup value={solveFor} onValueChange={(val) => setValue('solveFor', val as any)}>
                      <RadioGroupItem value="taxRate" id="solveForTaxRate" checked={isInputDisabled('taxRate')} />
                    </RadioGroup>
                    <Controller name="taxRate" control={control} render={({ field }) => (
                       <Input id="taxRate" type="number" step="0.01" {...field} disabled={isInputDisabled('taxRate')} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                    )}/>
                    <span className="font-semibold">%</span>
                </div>
            </div>
             <div className="flex-1 space-y-2">
                <Label htmlFor="total">After Tax Price</Label>
                <div className="flex items-center gap-2">
                    <RadioGroup value={solveFor} onValueChange={(val) => setValue('solveFor', val as any)}>
                      <RadioGroupItem value="total" id="solveForTotal" checked={isInputDisabled('total')} />
                    </RadioGroup>
                    <Controller name="total" control={control} render={({ field }) => (
                         <Input id="total" type="number" step="0.01" {...field} disabled={isInputDisabled('total')} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                    )}/>
                </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center">Select the value you want to calculate, and enter the other two.</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card>
            <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Sales Tax Amount</p>
                <p className="font-bold text-lg">
                    {formValues.total && formValues.preTax ? formatCurrency(formValues.total - formValues.preTax) : formatCurrency(0)}
                </p>
            </CardContent>
        </Card>
        <Card>
            <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Total Price</p>
                <p className="font-bold text-lg">
                    {formValues.total ? formatCurrency(formValues.total) : formatCurrency(0)}
                </p>
            </CardContent>
        </Card>
      </div>

    </form>
  );
}
