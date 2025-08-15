
"use client";

import { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Trash, Download, Info } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const itemSchema = z.object({
  name: z.string().nonempty('Item name is required'),
  cost: z.number().min(0, 'Cost must be non-negative'),
});

const formSchema = z.object({
  petLifespan: z.number().int().min(1, 'Lifespan must be at least 1 year'),
  oneTimeExpenses: z.array(itemSchema),
  recurringExpenses: z.array(itemSchema.extend({
    frequency: z.enum(['monthly', 'annually'])
  })),
});

type FormData = z.infer<typeof formSchema>;

const defaultOneTimeExpenses = [
  { name: 'Adoption/Purchase Fee', cost: 350 },
  { name: 'Spay/Neuter', cost: 200 },
  { name: 'Initial Vet Visit', cost: 150 },
  { name: 'Crate/Bed', cost: 100 },
  { name: 'Initial Supplies', cost: 75 },
];

const defaultRecurringExpenses = [
  { name: 'Food', cost: 50, frequency: 'monthly' },
  { name: 'Routine Vet Care', cost: 250, frequency: 'annually' },
  { name: 'Flea/Tick Prevention', cost: 20, frequency: 'monthly' },
  { name: 'Toys & Treats', cost: 25, frequency: 'monthly' },
  { name: 'Grooming', cost: 0, frequency: 'monthly' },
  { name: 'Pet Insurance', cost: 40, frequency: 'monthly' },
];

const PIE_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];
const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

export default function PetCostCalculator() {
  const [results, setResults] = useState<any | null>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      petLifespan: 12,
      oneTimeExpenses: defaultOneTimeExpenses,
      recurringExpenses: defaultRecurringExpenses,
    },
  });

  const { fields: oneTimeFields, append: appendOneTime, remove: removeOneTime } = useFieldArray({ control, name: "oneTimeExpenses" });
  const { fields: recurringFields, append: appendRecurring, remove: removeRecurring } = useFieldArray({ control, name: "recurringExpenses" });

  const calculateTotal = (data: FormData) => {
    const totalOneTime = data.oneTimeExpenses.reduce((acc, item) => acc + item.cost, 0);
    
    let totalAnnualRecurring = 0;
    const recurringBreakdown: {[key: string]: number} = {};

    data.recurringExpenses.forEach(item => {
        const annualCost = item.frequency === 'monthly' ? item.cost * 12 : item.cost;
        totalAnnualRecurring += annualCost;
        recurringBreakdown[item.name] = (recurringBreakdown[item.name] || 0) + annualCost;
    });

    const lifetimeRecurring = totalAnnualRecurring * data.petLifespan;
    const totalLifetimeCost = totalOneTime + lifetimeRecurring;
    
    const pieData = [
        { name: 'One-Time Costs', value: totalOneTime },
        ...Object.entries(recurringBreakdown).map(([name, cost]) => ({
            name, value: cost * data.petLifespan
        })).filter(d => d.value > 0)
    ];

    setResults({
      totalLifetimeCost,
      totalAnnualRecurring,
      totalOneTime,
      pieData
    });
    setFormData(data);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `pet-cost-calculation.${format}`;

    if (format === 'txt') {
      content += `Pet Cost Calculation\n\n`;
      content += `Inputs:\n- Lifespan: ${formData.petLifespan} years\n`;
      content += `\nOne-Time Expenses:\n`;
      formData.oneTimeExpenses.forEach(item => { content += `- ${item.name}: ${formatCurrency(item.cost)}\n`; });
      content += `\nRecurring Expenses:\n`;
      formData.recurringExpenses.forEach(item => { content += `- ${item.name}: ${formatCurrency(item.cost)} / ${item.frequency}\n`; });
      content += `\nResults:\n- Total Lifetime Cost: ${formatCurrency(results.totalLifetimeCost)}\n- Average Annual Cost: ${formatCurrency(results.totalAnnualRecurring)}\n- Total One-Time Costs: ${formatCurrency(results.totalOneTime)}`;
    } else {
      content = 'Category,Item,Cost,Frequency\n';
      formData.oneTimeExpenses.forEach(item => { content += `One-Time,"${item.name}",${item.cost},N/A\n`; });
      formData.recurringExpenses.forEach(item => { content += `Recurring,"${item.name}",${item.cost},${item.frequency}\n`; });
      content += `\nResult,Value\n`;
      content += `Total Lifetime Cost,${results.totalLifetimeCost.toFixed(2)}\n`;
      content += `Average Annual Cost,${results.totalAnnualRecurring.toFixed(2)}\n`;
      content += `Total One-Time Costs,${results.totalOneTime.toFixed(2)}\n`;
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
    <form onSubmit={handleSubmit(calculateTotal)} className="grid lg:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <Card>
            <CardHeader><CardTitle>Pet & Lifespan</CardTitle></CardHeader>
            <CardContent>
                <div><Label>Estimated Lifespan (years)</Label><Controller name="petLifespan" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle>One-Time Expenses</CardTitle></CardHeader>
            <CardContent className="space-y-2">
                {oneTimeFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 items-center">
                    <Controller name={`oneTimeExpenses.${index}.name`} control={control} render={({ field }) => <Input placeholder="Expense Name" {...field} />} />
                    <Controller name={`oneTimeExpenses.${index}.cost`} control={control} render={({ field }) => <Input type="number" placeholder="Cost ($)" className="w-32" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeOneTime(index)}><Trash className="h-4 w-4" /></Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => appendOneTime({ name: '', cost: 0 })}>Add One-Time Cost</Button>
            </CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle>Recurring Expenses</CardTitle></CardHeader>
            <CardContent className="space-y-2">
                {recurringFields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-[1fr,100px,120px,auto] gap-2 items-end">
                    <Controller name={`recurringExpenses.${index}.name`} control={control} render={({ field }) => <Input placeholder="Expense Name" {...field} />} />
                    <Controller name={`recurringExpenses.${index}.cost`} control={control} render={({ field }) => <Input type="number" placeholder="Cost ($)" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
                    <Controller name={`recurringExpenses.${index}.frequency`} control={control} render={({ field: selectField }) => (
                      <select {...selectField} className="h-10 border rounded-md px-2 text-sm">
                        <option value="monthly">per month</option>
                        <option value="annually">per year</option>
                      </select>
                    )} />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeRecurring(index)}><Trash className="h-4 w-4" /></Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => appendRecurring({ name: '', cost: 0, frequency: 'monthly' })}>Add Recurring Cost</Button>
            </CardContent>
        </Card>
        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Calculate Total Cost</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={!results}><Download className="mr-2 h-4 w-4" /> Export</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent><DropdownMenuItem onClick={() => handleExport('txt')}>Download as .txt</DropdownMenuItem><DropdownMenuItem onClick={() => handleExport('csv')}>Download as .csv</DropdownMenuItem></DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Cost of Ownership Summary</h3>
        {results ? (
            <div className="space-y-4">
                 <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Summary</AlertTitle>
                  <AlertDescription>
                    The estimated total lifetime cost of owning your pet for {formData?.petLifespan} years is <strong>{formatCurrency(results.totalLifetimeCost)}</strong>.
                  </AlertDescription>
                </Alert>
                <div className="grid grid-cols-2 gap-4">
                  <Card><CardContent className="p-4 text-center"><p className="text-muted-foreground">Average Annual Cost</p><p className="font-semibold text-xl">{formatCurrency(results.totalAnnualRecurring)}</p></CardContent></Card>
                  <Card><CardContent className="p-4 text-center"><p className="text-muted-foreground">Total Lifetime Cost</p><p className="font-semibold text-xl">{formatCurrency(results.totalLifetimeCost)}</p></CardContent></Card>
                </div>
                 <Card>
                    <CardHeader><CardTitle className="text-base text-center">Lifetime Cost Breakdown</CardTitle></CardHeader>
                    <CardContent className="h-64">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={results.pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                    {results.pieData.map((_entry: any, index: number) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                                </Pie>
                                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                <Legend iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter your expenses to calculate the total cost.</p></div>
        )}
      </div>
    </form>
  );
}
