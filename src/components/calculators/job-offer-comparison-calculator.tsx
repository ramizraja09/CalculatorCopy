
"use client";

import { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const offerSchema = z.object({
  name: z.string().nonempty("Name is required"),
  salary: z.number().min(0),
});

const formSchema = z.object({
  offers: z.array(offerSchema).length(2, "Exactly two offers are required."),
});
type FormData = z.infer<typeof formSchema>;

export default function JobOfferComparisonCalculator() {
  const [results, setResults] = useState<{ compA: number; compB: number; winner: string } | null>(null);

  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      offers: [
        { name: 'Job A', salary: 90000 },
        { name: 'Job B', salary: 100000 },
      ],
    },
  });
  
  const { fields } = useFieldArray({ control, name: "offers" });

  const calculateComparison = (data: FormData) => {
    const compA = data.offers[0].salary;
    const compB = data.offers[1].salary;
    const winner = compA > compB ? data.offers[0].name : data.offers[1].name;
    if (compA === compB) {
        setResults({ compA, compB, winner: 'It\'s a tie!' });
    } else {
        setResults({ compA, compB, winner });
    }
  };
  
  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  return (
    <form onSubmit={handleSubmit(calculateComparison)} className="space-y-8">
      <div className="grid md:grid-cols-2 gap-8">
        {fields.map((field, index) => (
          <Card key={field.id}>
            <CardHeader>
                <Controller name={`offers.${index}.name`} control={control} render={({ field }) => (
                    <Input {...field} className="text-xl font-bold border-0 shadow-none focus-visible:ring-0 p-0" />
                )} />
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm">Total Compensation ($)</Label>
                <Controller name={`offers.${index}.salary`} control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="flex justify-center">
        <Button type="submit" size="lg">Calculate</Button>
      </div>

      {results && (
        <Card>
            <CardHeader>
                <CardTitle>Comparison Result</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-lg">
                <p>Job A Total Compensation: <strong>{formatCurrency(results.compA)}</strong></p>
                <p>Job B Total Compensation: <strong>{formatCurrency(results.compB)}</strong></p>
                <p className="pt-2">Compensation Winner: <strong className="text-primary">{results.winner}</strong></p>
            </CardContent>
        </Card>
      )}
    </form>
  );
}
