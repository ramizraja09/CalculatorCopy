
"use client";

import { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Trash, Download, Info } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const itemSchema = z.object({
  name: z.string().nonempty('Item name is required'),
  cost: z.number().min(0, 'Cost must be non-negative'),
});

const formSchema = z.object({
  numberOfInterviews: z.number().int().min(1, "Must have at least one interview"),
  oneTimeExpenses: z.array(itemSchema),
  perInterviewExpenses: z.array(itemSchema),
});

type FormData = z.infer<typeof formSchema>;

const defaultOneTimeExpenses = [
  { name: 'New Interview Outfit', cost: 150 },
  { name: 'Portfolio/Resume Printing', cost: 50 },
  { name: 'Professional Headshot', cost: 100 },
];
const defaultPerInterviewExpenses = [
  { name: 'Travel (Gas/Tickets)', cost: 40 },
  { name: 'Meals', cost: 25 },
  { name: 'Parking', cost: 15 },
];
const PIE_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

export default function InterviewPrepCostCalculator() {
  const [results, setResults] = useState<any | null>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      numberOfInterviews: 3,
      oneTimeExpenses: defaultOneTimeExpenses,
      perInterviewExpenses: defaultPerInterviewExpenses,
    },
  });

  const { fields: oneTimeFields, append: appendOneTime, remove: removeOneTime } = useFieldArray({ control, name: "oneTimeExpenses" });
  const { fields: perInterviewFields, append: appendPerInterview, remove: removePerInterview } = useFieldArray({ control, name: "perInterviewExpenses" });

  const calculateTotal = (data: FormData) => {
    const totalOneTime = data.oneTimeExpenses.reduce((acc, item) => acc + item.cost, 0);
    const totalPerInterview = data.perInterviewExpenses.reduce((acc, item) => acc + item.cost, 0);
    const totalCost = totalOneTime + (totalPerInterview * data.numberOfInterviews);
    
    const costBreakdown = [
        { name: 'One-Time Costs', value: totalOneTime},
        { name: 'Per-Interview Costs', value: totalPerInterview * data.numberOfInterviews}
    ].filter(d => d.value > 0);

    setResults({ totalCost, totalOneTime, totalPerInterview, costBreakdown });
    setFormData(data);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `interview-prep-cost.${format}`;

    if (format === 'txt') {
      content = `Interview Prep Cost Calculation\n\nInputs:\nNumber of Interviews: ${formData.numberOfInterviews}\n\nOne-Time Expenses:\n`;
      formData.oneTimeExpenses.forEach(item => { content += `- ${item.name}: ${formatCurrency(item.cost)}\n`; });
      content += `\nPer-Interview Expenses:\n`;
      formData.perInterviewExpenses.forEach(item => { content += `- ${item.name}: ${formatCurrency(item.cost)}\n`; });
      content += `\nResults:\n- Total Estimated Cost: ${formatCurrency(results.totalCost)}`;
    } else {
      content = 'Category,Item,Cost\n';
      formData.oneTimeExpenses.forEach(item => { content += `One-Time,"${item.name}",${item.cost}\n`; });
      formData.perInterviewExpenses.forEach(item => { content += `Per-Interview,"${item.name}",${item.cost}\n`; });
      content += `\nNumber of Interviews,${formData.numberOfInterviews}\nTotal Cost,${results.totalCost}`;
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
      {/* Inputs Column */}
      <div className="space-y-4">
        <Card>
            <CardHeader><CardTitle>Interview Plan</CardTitle></CardHeader>
            <CardContent>
                <div><Label>Number of Interviews to Prep For</Label><Controller name="numberOfInterviews" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
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
                <Button type="button" variant="outline" size="sm" onClick={() => appendOneTime({ name: '', cost: 0 })}>Add Expense</Button>
            </CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle>Per-Interview Expenses</CardTitle></CardHeader>
            <CardContent className="space-y-2">
                {perInterviewFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 items-center">
                    <Controller name={`perInterviewExpenses.${index}.name`} control={control} render={({ field }) => <Input placeholder="Expense Name" {...field} />} />
                    <Controller name={`perInterviewExpenses.${index}.cost`} control={control} render={({ field }) => <Input type="number" placeholder="Cost ($)" className="w-32" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removePerInterview(index)}><Trash className="h-4 w-4" /></Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => appendPerInterview({ name: '', cost: 0 })}>Add Expense</Button>
            </CardContent>
        </Card>
        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Calculate Total</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={!results}><Download className="mr-2 h-4 w-4" /> Export</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent><DropdownMenuItem onClick={() => handleExport('txt')}>Download as .txt</DropdownMenuItem><DropdownMenuItem onClick={() => handleExport('csv')}>Download as .csv</DropdownMenuItem></DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>

      {/* Results Column */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Cost Summary</h3>
        {results ? (
            <div className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Summary</AlertTitle>
                  <AlertDescription>
                    For {formData?.numberOfInterviews} interviews, your estimated total preparation cost is <strong>{formatCurrency(results.totalCost)}</strong>.
                  </AlertDescription>
                </Alert>
                 <Card>
                    <CardHeader><CardTitle className="text-base text-center">Total Estimated Cost</CardTitle></CardHeader>
                    <CardContent className="p-4 text-center"><p className="text-3xl font-bold">{formatCurrency(results.totalCost)}</p></CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="text-base text-center">Cost Breakdown</CardTitle></CardHeader>
                    <CardContent className="h-64">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={results.costBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} label={({ percent }) => `${(percent * 100).toFixed(0)}%`}>
                                    {results.costBreakdown.map((_entry: any, index: number) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                                </Pie>
                                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                <Legend iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle className="text-base">Expense Details</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableBody>
                                <TableRow><TableCell>Total One-Time Costs</TableCell><TableCell className="text-right font-semibold">{formatCurrency(results.totalOneTime)}</TableCell></TableRow>
                                <TableRow><TableCell>Total Per-Interview Costs</TableCell><TableCell className="text-right font-semibold">{formatCurrency(results.totalPerInterview * (formData?.numberOfInterviews || 1))}</TableCell></TableRow>
                                <TableRow className="font-bold border-t"><TableCell>Total Combined Cost</TableCell><TableCell className="text-right">{formatCurrency(results.totalCost)}</TableCell></TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter expenses to calculate total</p></div>
        )}
      </div>
    </form>
  );
}
