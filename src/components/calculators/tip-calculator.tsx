
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

const formSchema = z.object({
  billAmount: z.number().min(0.01, 'Bill amount must be positive'),
  tipPercentage: z.number().min(0, 'Tip percentage cannot be negative'),
  numberOfPeople: z.number().int().min(1, 'Must be at least one person'),
});

type FormData = z.infer<typeof formSchema>;

export default function TipCalculator() {
  const [results, setResults] = useState<any>(null);

  const { control, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      billAmount: 50,
      tipPercentage: 18,
      numberOfPeople: 1,
    },
  });

  const tipPercentage = watch('tipPercentage');

  const calculateTip = (data: FormData) => {
    const { billAmount, tipPercentage, numberOfPeople } = data;
    const tipAmount = billAmount * (tipPercentage / 100);
    const totalAmount = billAmount + tipAmount;
    const tipPerPerson = tipAmount / numberOfPeople;
    const totalPerPerson = totalAmount / numberOfPeople;

    setResults({
      tipAmount,
      totalAmount,
      tipPerPerson,
      totalPerPerson,
      error: null,
    });
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  return (
    <form onSubmit={handleSubmit(calculateTip)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs Column */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold">Inputs</h3>
        
        <div>
          <Label htmlFor="billAmount">Bill Amount ($)</Label>
          <Controller name="billAmount" control={control} render={({ field }) => <Input id="billAmount" type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
          {errors.billAmount && <p className="text-destructive text-sm mt-1">{errors.billAmount.message}</p>}
        </div>

        <div>
          <Label htmlFor="tipPercentage">Tip Percentage ({tipPercentage.toFixed(0)}%)</Label>
          <Controller name="tipPercentage" control={control} render={({ field }) => (
            <>
              <Slider
                id="tipPercentage"
                min={0}
                max={100}
                step={1}
                value={[field.value]}
                onValueChange={(value) => field.onChange(value[0])}
              />
            </>
          )} />
          {errors.tipPercentage && <p className="text-destructive text-sm mt-1">{errors.tipPercentage.message}</p>}
        </div>

        <div>
          <Label htmlFor="numberOfPeople">Split Between (people)</Label>
          <Controller name="numberOfPeople" control={control} render={({ field }) => <Input id="numberOfPeople" type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} />
          {errors.numberOfPeople && <p className="text-destructive text-sm mt-1">{errors.numberOfPeople.message}</p>}
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
                            <p className="text-sm text-muted-foreground">Total Per Person</p>
                            <p className="text-3xl font-bold">{formatCurrency(results.totalPerPerson)}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 grid grid-cols-2 gap-4 text-sm">
                             <div><p className="text-muted-foreground">Tip Amount</p><p className="font-semibold">{formatCurrency(results.tipAmount)}</p></div>
                             <div><p className="text-muted-foreground">Total Bill</p><p className="font-semibold">{formatCurrency(results.totalAmount)}</p></div>
                             <div><p className="text-muted-foreground">Tip Per Person</p><p className="font-semibold">{formatCurrency(results.tipPerPerson)}</p></div>
                        </CardContent>
                    </Card>
                </div>
            )
        ) : (
             <div className="flex items-center justify-center h-60 bg-muted/50 rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">Enter your bill details to calculate the tip</p>
            </div>
        )}
      </div>
    </form>
  );
}
