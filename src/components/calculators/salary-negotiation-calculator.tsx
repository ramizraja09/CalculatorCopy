
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
  currentSalary: z.number().min(1),
  desiredIncrease: z.number().min(1).max(100),
});

type FormData = z.infer<typeof formSchema>;

export default function SalaryNegotiationCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { currentSalary: 70000, desiredIncrease: 15 },
  });
  
  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const calculateTargets = (data: FormData) => {
    const targetSalary = data.currentSalary * (1 + data.desiredIncrease / 100);
    setResults({
        walkAway: data.currentSalary * 1.05, 
        target: targetSalary,
        ideal: targetSalary * 1.10, 
    });
    setFormData(data);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `salary-negotiation-targets.${format}`;
    const { currentSalary, desiredIncrease } = formData;

    if (format === 'txt') {
      content = `Salary Negotiation Targets\n\nInputs:\n- Current Salary: ${formatCurrency(currentSalary)}\n- Desired Increase: ${desiredIncrease}%\n\nResults:\n- Walk-Away Point: ${formatCurrency(results.walkAway)}\n- Target Salary: ${formatCurrency(results.target)}\n- Ideal Outcome: ${formatCurrency(results.ideal)}`;
    } else {
       content = `Category,Value\nCurrent Salary,${currentSalary}\nDesired Increase (%),${desiredIncrease}\nWalk-Away Point,${results.walkAway}\nTarget Salary,${results.target}\nIdeal Outcome,${results.ideal}`;
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
    <form onSubmit={handleSubmit(calculateTargets)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Inputs</h3>
        <div><Label>Current Annual Salary ($)</Label><Controller name="currentSalary" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))} />} /></div>
        <div><Label>Desired Increase (%)</Label><Controller name="desiredIncrease" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))} />} /></div>
        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Calculate Targets</Button>
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
        <h3 className="text-xl font-semibold">Negotiation Targets</h3>
        {results ? (
            <Card>
                <CardContent className="p-4 grid grid-cols-1 gap-4 text-center">
                    <div><p className="font-semibold text-destructive">Walk-Away Point</p><p>{formatCurrency(results.walkAway)}</p></div>
                    <div><p className="font-semibold text-primary">Target Salary</p><p className="text-2xl font-bold">{formatCurrency(results.target)}</p></div>
                    <div><p className="font-semibold text-green-600">Ideal Outcome</p><p>{formatCurrency(results.ideal)}</p></div>
                </CardContent>
            </Card>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter your details to see targets</p></div>
        )}
      </div>
    </form>
  );
}
