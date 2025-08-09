
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const formSchema = z.object({
  principal: z.number().min(0.01, 'Principal must be positive'),
  rate: z.number().min(0, 'Interest rate cannot be negative'),
  term: z.number().int().min(1, 'Term must be at least 1'),
  termUnit: z.enum(['years', 'months']),
  interestType: z.enum(['simple', 'compound']),
  compoundFrequency: z.enum(['annually', 'semiannually', 'quarterly', 'monthly', 'daily']),
});

type FormData = z.infer<typeof formSchema>;

export default function InterestCalculator() {
  const [results, setResults] = useState<any>(null);

  const { control, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      principal: 1000,
      rate: 5,
      term: 5,
      termUnit: 'years',
      interestType: 'compound',
      compoundFrequency: 'annually',
    },
  });
  
  const interestType = watch('interestType');

  const calculateInterest = (data: FormData) => {
    const { principal, rate, term, termUnit, interestType, compoundFrequency } = data;
    
    const annualRate = rate / 100;
    const timeInYears = termUnit === 'years' ? term : term / 12;

    let totalAmount = 0;
    let totalInterest = 0;

    if (interestType === 'simple') {
      totalInterest = principal * annualRate * timeInYears;
      totalAmount = principal + totalInterest;
    } else { // Compound Interest
      const compoundMap: { [key: string]: number } = {
        'annually': 1,
        'semiannually': 2,
        'quarterly': 4,
        'monthly': 12,
        'daily': 365,
      };
      const n = compoundMap[compoundFrequency];
      totalAmount = principal * Math.pow(1 + annualRate / n, n * timeInYears);
      totalInterest = totalAmount - principal;
    }

    setResults({
      principal,
      totalInterest,
      totalAmount,
      error: null
    });
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  return (
    <form onSubmit={handleSubmit(calculateInterest)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs Column */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Inputs</h3>
        
        <div>
          <Label htmlFor="principal">Principal Amount ($)</Label>
          <Controller name="principal" control={control} render={({ field }) => <Input id="principal" type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
          {errors.principal && <p className="text-destructive text-sm mt-1">{errors.principal.message}</p>}
        </div>

        <div>
          <Label htmlFor="rate">Annual Interest Rate (%)</Label>
          <Controller name="rate" control={control} render={({ field }) => <Input id="rate" type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
          {errors.rate && <p className="text-destructive text-sm mt-1">{errors.rate.message}</p>}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <Label htmlFor="term">Investment/Loan Term</Label>
            <Controller name="term" control={control} render={({ field }) => <Input id="term" type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} />
            {errors.term && <p className="text-destructive text-sm mt-1">{errors.term.message}</p>}
          </div>
          <div>
            <Label>&nbsp;</Label>
            <Controller name="termUnit" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="years">Years</SelectItem>
                  <SelectItem value="months">Months</SelectItem>
                </SelectContent>
              </Select>
            )} />
          </div>
        </div>

        <div>
          <Label>Interest Type</Label>
          <Controller name="interestType" control={control} render={({ field }) => (
            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4 pt-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="simple" id="simple" />
                <Label htmlFor="simple">Simple</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="compound" id="compound" />
                <Label htmlFor="compound">Compound</Label>
              </div>
            </RadioGroup>
          )} />
        </div>
        
        {interestType === 'compound' && (
          <div>
            <Label htmlFor="compoundFrequency">Compound Frequency</Label>
            <Controller name="compoundFrequency" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger id="compoundFrequency"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="annually">Annually</SelectItem>
                  <SelectItem value="semiannually">Semiannually</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                </SelectContent>
              </Select>
            )} />
          </div>
        )}
        
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
                        <CardContent className="p-4">
                            <p className="text-sm text-muted-foreground">Final Amount</p>
                            <p className="text-3xl font-bold">{formatCurrency(results.totalAmount)}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 grid grid-cols-2 gap-2 text-sm">
                             <div><p className="text-muted-foreground">Principal Amount</p><p className="font-semibold">{formatCurrency(results.principal)}</p></div>
                             <div><p className="text-muted-foreground">Total Interest</p><p className="font-semibold">{formatCurrency(results.totalInterest)}</p></div>
                        </CardContent>
                    </Card>
                </div>
            )
        ) : (
             <div className="flex items-center justify-center h-60 bg-muted/50 rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">Enter your details to calculate the interest</p>
            </div>
        )}
      </div>
    </form>
  );
}
