"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download } from 'lucide-react';

const formSchema = z.object({
  packsPerDay: z.number().min(0.1),
  costPerPack: z.number().min(0.01),
});

type FormData = z.infer<typeof formSchema>;

export default function SmokingCostCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { packsPerDay: 1, costPerPack: 8.00 },
  });

  const calculateCost = (data: FormData) => {
    const dailyCost = data.packsPerDay * data.costPerPack;
    setResults({
        daily: dailyCost,
        weekly: dailyCost * 7,
        monthly: dailyCost * 30.44,
        yearly: dailyCost * 365,
    });
    setFormData(data);
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `smoking-cost-calculation.${format}`;
    const { packsPerDay, costPerPack } = formData;

    if (format === 'txt') {
      content = `Smoking Cost Calculation\n\nInputs:\n- Packs Per Day: ${packsPerDay}\n- Cost Per Pack: ${formatCurrency(costPerPack)}\n\nResult:\n- Daily Cost: ${formatCurrency(results.daily)}\n- Weekly Cost: ${formatCurrency(results.weekly)}\n- Monthly Cost: ${formatCurrency(results.monthly)}\n- Yearly Cost: ${formatCurrency(results.yearly)}`;
    } else {
       content = `Packs Per Day,Cost Per Pack,Daily Cost,Weekly Cost,Monthly Cost,Yearly Cost\n${packsPerDay},${costPerPack},${results.daily.toFixed(2)},${results.weekly.toFixed(2)},${results.monthly.toFixed(2)},${results.yearly.toFixed(2)}`;
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
      {/* Inputs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Inputs</h3>
        <div><Label>Packs Per Day</Label><Controller name="packsPerDay" control={control} render={({ field }) => <Input type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
        <div><Label>Cost Per Pack ($)</Label><Controller name="costPerPack" control={control} render={({ field }) => <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
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

      {/* Results */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Cost of Smoking</h3>
        {results ? (
            <Card>
                <CardContent className="p-4 grid grid-cols-2 gap-4 text-center">
                    <div><p className="font-semibold">Daily</p><p>{formatCurrency(results.daily)}</p></div>
                    <div><p className="font-semibold">Weekly</p><p>{formatCurrency(results.weekly)}</p></div>
                    <div><p className="font-semibold">Monthly</p><p>{formatCurrency(results.monthly)}</p></div>
                    <div><p className="font-semibold">Yearly</p><p>{formatCurrency(results.yearly)}</p></div>
                </CardContent>
            </Card>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter details to see the cost</p></div>
        )}
      </div>
    </form>
  );
}
