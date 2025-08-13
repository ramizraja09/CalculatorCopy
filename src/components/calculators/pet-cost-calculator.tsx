
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
  oneTimeCosts: z.number().min(0),
  monthlyFoodCost: z.number().min(0),
  annualVetBills: z.number().min(0),
  monthlyGrooming: z.number().min(0),
  monthlyToys: z.number().min(0),
  petLifespan: z.number().int().min(1),
});

type FormData = z.infer<typeof formSchema>;

export default function PetCostCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      oneTimeCosts: 500,
      monthlyFoodCost: 60,
      annualVetBills: 400,
      monthlyGrooming: 0,
      monthlyToys: 20,
      petLifespan: 12,
    },
  });

  const calculateCost = (data: FormData) => {
    const monthlyCosts = data.monthlyFoodCost + data.monthlyGrooming + data.monthlyToys + (data.annualVetBills / 12);
    const lifetimeCost = (monthlyCosts * 12 * data.petLifespan) + data.oneTimeCosts;

    setResults({
      monthlyCost: monthlyCosts,
      lifetimeCost: lifetimeCost,
    });
    setFormData(data);
  };
  
  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `pet-cost-calculation.${format}`;
    const { oneTimeCosts, monthlyFoodCost, annualVetBills, monthlyGrooming, monthlyToys, petLifespan } = formData;

    if (format === 'txt') {
      content = `Pet Cost of Ownership Calculation\n\nInputs:\n- One-Time Costs: ${formatCurrency(oneTimeCosts)}\n- Monthly Food: ${formatCurrency(monthlyFoodCost)}\n- Annual Vet: ${formatCurrency(annualVetBills)}\n- Monthly Grooming: ${formatCurrency(monthlyGrooming)}\n- Monthly Toys: ${formatCurrency(monthlyToys)}\n- Lifespan (years): ${petLifespan}\n\nResults:\n- Estimated Monthly Cost: ${formatCurrency(results.monthlyCost)}\n- Estimated Lifetime Cost: ${formatCurrency(results.lifetimeCost)}`;
    } else {
      content = `One-Time Costs,Monthly Food,Annual Vet,Monthly Grooming,Monthly Toys,Lifespan (years),Monthly Cost,Lifetime Cost\n${oneTimeCosts},${monthlyFoodCost},${annualVetBills},${monthlyGrooming},${monthlyToys},${petLifespan},${results.monthlyCost.toFixed(2)},${results.lifetimeCost.toFixed(2)}`;
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
        <h3 className="text-xl font-semibold">Pet Expenses</h3>
        <div><Label>One-Time Costs ($)</Label><Controller name="oneTimeCosts" control={control} render={({ field }) => <Input type="number" placeholder="Adoption, supplies, etc." {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
        <div><Label>Monthly Food Cost ($)</Label><Controller name="monthlyFoodCost" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
        <div><Label>Annual Vet Bills ($)</Label><Controller name="annualVetBills" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
        <div><Label>Monthly Grooming ($)</Label><Controller name="monthlyGrooming" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
        <div><Label>Monthly Toys/Accessories ($)</Label><Controller name="monthlyToys" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
        <div><Label>Estimated Lifespan (years)</Label><Controller name="petLifespan" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))} />} /></div>
        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Calculate Cost</Button>
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
                        <p className="text-sm text-muted-foreground">Estimated Monthly Cost</p>
                        <p className="text-3xl font-bold">{formatCurrency(results.monthlyCost)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-sm text-muted-foreground">Estimated Lifetime Cost</p>
                        <p className="text-3xl font-bold">{formatCurrency(results.lifetimeCost)}</p>
                    </CardContent>
                </Card>
            </div>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter costs to estimate ownership expenses</p></div>
        )}
      </div>
    </form>
  );
}
