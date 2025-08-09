
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
  originalPrice: z.number().min(0.01, 'Original price must be positive'),
  discountPercentage: z.number().min(0, 'Discount cannot be negative').max(100, 'Discount cannot exceed 100%'),
});

type FormData = z.infer<typeof formSchema>;

export default function DiscountCalculator() {
  const [results, setResults] = useState<any>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      originalPrice: 100,
      discountPercentage: 25,
    },
  });

  const calculateDiscount = (data: FormData) => {
    const { originalPrice, discountPercentage } = data;
    const amountSaved = originalPrice * (discountPercentage / 100);
    const finalPrice = originalPrice - amountSaved;

    setResults({
      finalPrice,
      amountSaved,
      error: null,
    });
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  return (
    <form onSubmit={handleSubmit(calculateDiscount)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs Column */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Inputs</h3>
        
        <div>
          <Label htmlFor="originalPrice">Original Price ($)</Label>
          <Controller name="originalPrice" control={control} render={({ field }) => <Input id="originalPrice" type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
          {errors.originalPrice && <p className="text-destructive text-sm mt-1">{errors.originalPrice.message}</p>}
        </div>

        <div>
          <Label htmlFor="discountPercentage">Discount Percentage (%)</Label>
          <Controller name="discountPercentage" control={control} render={({ field }) => <Input id="discountPercentage" type="number" step="1" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
          {errors.discountPercentage && <p className="text-destructive text-sm mt-1">{errors.discountPercentage.message}</p>}
        </div>
        
        <Button type="submit" className="w-full">Calculate</Button>
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
                <div className="space-y-4">
                    <Card>
                        <CardContent className="p-4 text-center">
                            <p className="text-sm text-muted-foreground">Final Price</p>
                            <p className="text-3xl font-bold">{formatCurrency(results.finalPrice)}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                             <p className="text-muted-foreground">You Saved</p>
                             <p className="font-semibold">{formatCurrency(results.amountSaved)}</p>
                        </CardContent>
                    </Card>
                </div>
            )
        ) : (
             <div className="flex items-center justify-center h-60 bg-muted/50 rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">Enter price and discount to see the final cost</p>
            </div>
        )}
      </div>
    </form>
  );
}
