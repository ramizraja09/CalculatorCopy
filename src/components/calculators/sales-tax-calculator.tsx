
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const formSchema = z.object({
  price: z.number().min(0.01, 'Price must be positive'),
  taxRate: z.number().min(0, 'Tax rate must be non-negative'),
});

type FormData = z.infer<typeof formSchema>;

export default function SalesTaxCalculator() {
  const [results, setResults] = useState<any>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      price: 100,
      taxRate: 8,
    },
  });

  const calculateTax = (data: FormData) => {
    const { price, taxRate } = data;
    const taxAmount = price * (taxRate / 100);
    const totalPrice = price + taxAmount;

    setResults({
      taxAmount,
      totalPrice,
    });
  };
  
  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  return (
    <form onSubmit={handleSubmit(calculateTax)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs Column */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Inputs</h3>
        
        <div>
          <Label htmlFor="price">Pre-Tax Price ($)</Label>
          <Controller name="price" control={control} render={({ field }) => <Input id="price" type="number" step="0.01" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
          {errors.price && <p className="text-destructive text-sm mt-1">{errors.price.message}</p>}
        </div>

        <div>
          <Label htmlFor="taxRate">Sales Tax Rate (%)</Label>
          <Controller name="taxRate" control={control} render={({ field }) => <Input id="taxRate" type="number" step="0.01" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
          {errors.taxRate && <p className="text-destructive text-sm mt-1">{errors.taxRate.message}</p>}
        </div>
        
        <Button type="submit" className="w-full">Calculate</Button>
      </div>

      {/* Results Column */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Results</h3>
        {results ? (
            <div className="space-y-4">
                <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-sm text-muted-foreground">Total Price</p>
                        <p className="text-3xl font-bold">{formatCurrency(results.totalPrice)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                         <p className="text-muted-foreground">Sales Tax Amount</p>
                         <p className="font-semibold">{formatCurrency(results.taxAmount)}</p>
                    </CardContent>
                </Card>
            </div>
        ) : (
             <div className="flex items-center justify-center h-60 bg-muted/50 rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">Enter price and tax rate to calculate total cost</p>
            </div>
        )}
      </div>
    </form>
  );
}
