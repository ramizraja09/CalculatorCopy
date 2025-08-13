
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  currentAge: z.number().int().min(0).max(17, 'Child must be under 18'),
  collegeAge: z.number().int().min(18).default(18),
  annualCost: z.number().min(1, 'Annual cost is required'),
  yearsInCollege: z.number().int().min(1).max(10).default(4),
  currentSavings: z.number().min(0, 'Cannot be negative'),
  annualReturn: z.number().min(0, 'Cannot be negative'),
  costIncreaseRate: z.number().min(0, 'Cannot be negative'),
});

type FormData = z.infer<typeof formSchema>;

export default function CollegeSavingsCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { currentAge: 5, collegeAge: 18, annualCost: 25000, yearsInCollege: 4, currentSavings: 10000, annualReturn: 6, costIncreaseRate: 5 },
  });

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const calculateSavings = (data: FormData) => {
    const { currentAge, collegeAge, annualCost, yearsInCollege, currentSavings, annualReturn, costIncreaseRate } = data;
    const yearsToCollege = collegeAge - currentAge;
    const monthlyReturn = annualReturn / 100 / 12;
    const monthsToCollege = yearsToCollege * 12;

    let totalFutureCost = 0;
    for (let i = 0; i < yearsInCollege; i++) {
        totalFutureCost += annualCost * Math.pow(1 + costIncreaseRate / 100, yearsToCollege + i);
    }
    
    const fvOfCurrentSavings = currentSavings * Math.pow(1 + monthlyReturn, monthsToCollege);
    const shortfall = totalFutureCost - fvOfCurrentSavings;

    let monthlyContribution = 0;
    if (shortfall > 0) {
        if (monthlyReturn === 0) {
            monthlyContribution = shortfall / monthsToCollege;
        } else {
            monthlyContribution = shortfall / ((Math.pow(1 + monthlyReturn, monthsToCollege) - 1) / monthlyReturn);
        }
    }

    setResults({ totalFutureCost, fvOfCurrentSavings, shortfall, monthlyContribution: Math.max(0, monthlyContribution) });
    setFormData(data);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `college-savings-calculation.${format}`;
    const { currentAge, collegeAge, annualCost, yearsInCollege, currentSavings, annualReturn, costIncreaseRate } = formData;

    if (format === 'txt') {
      content = `College Savings Calculation\n\nInputs:\n`;
      content += `- Child's Current Age: ${currentAge}\n- Age at College: ${collegeAge}\n- Annual College Cost (today): ${formatCurrency(annualCost)}\n`;
      content += `- Years in College: ${yearsInCollege}\n- Current Savings: ${formatCurrency(currentSavings)}\n- Annual Return: ${annualReturn}%\n- Cost Inflation Rate: ${costIncreaseRate}%\n\n`;
      content += `Results:\n- Monthly Contribution Needed: ${formatCurrency(results.monthlyContribution)}\n- Projected Total Cost: ${formatCurrency(results.totalFutureCost)}\n- Projected Savings Growth: ${formatCurrency(results.fvOfCurrentSavings)}\n- Shortfall: ${formatCurrency(results.shortfall)}\n`;
    } else {
      content = 'Category,Value\n';
      content += `Child's Current Age,${currentAge}\nAge at College,${collegeAge}\nAnnual College Cost (today),${annualCost}\n`;
      content += `Years in College,${yearsInCollege}\nCurrent Savings,${currentSavings}\nAnnual Return (%),${annualReturn}\nCost Inflation Rate (%),${costIncreaseRate}\n\n`;
      content += 'Result Category,Value\n';
      content += `Monthly Contribution Needed,${results.monthlyContribution.toFixed(2)}\nProjected Total Cost,${results.totalFutureCost.toFixed(2)}\nProjected Savings Growth,${results.fvOfCurrentSavings.toFixed(2)}\nShortfall,${results.shortfall.toFixed(2)}\n`;
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
    <form onSubmit={handleSubmit(calculateSavings)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs Column */}
      <div className="space-y-4">
        <Card><CardHeader><CardTitle>Student & College</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div><Label>Child's Current Age</Label><Controller name="currentAge" control={control} render={({ field }) => <Input type="number" placeholder="5" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))} />} /></div>
                    <div><Label>Age at College</Label><Controller name="collegeAge" control={control} render={({ field }) => <Input type="number" placeholder="18" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))} />} /></div>
                </div>
                 <div><Label>Annual College Cost (today's dollars)</Label><Controller name="annualCost" control={control} render={({ field }) => <Input type="number" placeholder="25000" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
                 <div><Label>Years in College</Label><Controller name="yearsInCollege" control={control} render={({ field }) => <Input type="number" placeholder="4" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))} />} /></div>
            </CardContent>
        </Card>
        <Card><CardHeader><CardTitle>Savings & Growth</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div><Label>Current College Savings ($)</Label><Controller name="currentSavings" control={control} render={({ field }) => <Input type="number" placeholder="10000" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
                <div><Label>Estimated Annual Return (%)</Label><Controller name="annualReturn" control={control} render={({ field }) => <Input type="number" step="0.1" placeholder="6" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
                <div><Label>College Cost Inflation Rate (%)</Label><Controller name="costIncreaseRate" control={control} render={({ field }) => <Input type="number" step="0.1" placeholder="5" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
            </CardContent>
        </Card>
        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Calculate</Button>
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
        <h3 className="text-xl font-semibold">Results</h3>
        {results ? (
             <div className="space-y-4">
                 <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-sm text-muted-foreground">You'll need to save</p>
                        <p className="text-3xl font-bold text-primary">{formatCurrency(results.monthlyContribution)}</p>
                        <p className="text-sm text-muted-foreground">per month to reach your goal.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 grid grid-cols-2 gap-2 text-sm">
                         <div><p className="text-muted-foreground">Projected Total Cost</p><p className="font-semibold">{formatCurrency(results.totalFutureCost)}</p></div>
                         <div><p className="text-muted-foreground">Projected Savings</p><p className="font-semibold">{formatCurrency(results.fvOfCurrentSavings)}</p></div>
                         <div className="col-span-2"><p className="text-muted-foreground">Shortfall</p><p className="font-semibold">{formatCurrency(results.shortfall)}</p></div>
                    </CardContent>
                </Card>
             </div>
        ) : (
             <div className="flex items-center justify-center h-60 bg-muted/50 rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">Enter your college savings details to see your plan</p>
            </div>
        )}
      </div>
    </form>
  );
}
