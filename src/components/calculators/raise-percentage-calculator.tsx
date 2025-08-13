
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
  currentSalary: z.number().min(1, "Current salary must be positive"),
  raisePercentage: z.number().min(0.1, "Raise must be positive"),
});

type FormData = z.infer<typeof formSchema>;

export default function RaisePercentageCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currentSalary: 75000,
      raisePercentage: 5,
    },
  });

  const calculateRaise = (data: FormData) => {
    const { currentSalary, raisePercentage } = data;
    const raiseAmount = currentSalary * (raisePercentage / 100);
    const newSalary = currentSalary + raiseAmount;
    
    setResults({
      newSalary,
      raiseAmount,
      newMonthly: newSalary / 12,
      newBiWeekly: newSalary / 26,
    });
    setFormData(data);
  };
  
  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `raise-calculation.${format}`;
    const { currentSalary, raisePercentage } = formData;

    if (format === 'txt') {
      content = `Raise Calculation\n\nInputs:\n- Current Salary: ${formatCurrency(currentSalary)}\n- Raise Percentage: ${raisePercentage}%\n\nResults:\n- Raise Amount: ${formatCurrency(results.raiseAmount)}\n- New Annual Salary: ${formatCurrency(results.newSalary)}\n- New Monthly Pay: ${formatCurrency(results.newMonthly)}\n- New Bi-Weekly Pay: ${formatCurrency(results.newBiWeekly)}`;
    } else {
       content = `Category,Value\nCurrent Salary,${currentSalary}\nRaise Percentage,${raisePercentage}\nRaise Amount,${results.raiseAmount.toFixed(2)}\nNew Annual Salary,${results.newSalary.toFixed(2)}\nNew Monthly Pay,${results.newMonthly.toFixed(2)}\nNew Bi-Weekly Pay,${results.newBiWeekly.toFixed(2)}`;
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
    <form onSubmit={handleSubmit(calculateRaise)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs Column */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Raise Details</h3>
        <div><Label>Current Annual Salary ($)</Label><Controller name="currentSalary" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
        <div><Label>Raise Percentage (%)</Label><Controller name="raisePercentage" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Calculate New Salary</Button>
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
        <h3 className="text-xl font-semibold">Salary After Raise</h3>
        {results ? (
            <div className="space-y-4">
                <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-sm text-muted-foreground">New Annual Salary</p>
                        <p className="text-3xl font-bold">{formatCurrency(results.newSalary)}</p>
                        <p className="text-sm text-green-600 font-semibold">(+{formatCurrency(results.raiseAmount)})</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardContent className="p-4 grid grid-cols-2 gap-4 text-center">
                         <div><p className="text-muted-foreground">New Monthly Pay</p><p className="font-semibold">{formatCurrency(results.newMonthly)}</p></div>
                         <div><p className="text-muted-foreground">New Bi-Weekly Pay</p><p className="font-semibold">{formatCurrency(results.newBiWeekly)}</p></div>
                    </CardContent>
                </Card>
            </div>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter details to see the new salary</p></div>
        )}
      </div>
    </form>
  );
}
