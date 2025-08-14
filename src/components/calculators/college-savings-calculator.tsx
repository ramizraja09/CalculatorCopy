
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Download, Info } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


const formSchema = z.object({
  currentAge: z.number().int().min(0).max(17, 'Child must be under 18'),
  collegeAge: z.number().int().min(18).default(18),
  annualCost: z.number().min(1, 'Annual cost is required'),
  yearsInCollege: z.number().int().min(1).max(10).default(4),
  currentSavings: z.number().min(0, 'Cannot be negative'),
  annualContribution: z.number().min(0),
  annualIncrease: z.number().min(0),
  annualReturn: z.number().min(0, 'Cannot be negative'),
  costIncreaseRate: z.number().min(0, 'Cannot be negative'),
}).refine(data => data.collegeAge > data.currentAge, {
  message: "College start age must be after child's current age.",
  path: ["collegeAge"],
});

type FormData = z.infer<typeof formSchema>;
const PIE_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))'];


export default function CollegeSavingsCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { currentAge: 5, collegeAge: 18, annualCost: 25000, yearsInCollege: 4, currentSavings: 10000, annualContribution: 5000, annualIncrease: 3, annualReturn: 6, costIncreaseRate: 5 },
  });

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const calculateSavings = (data: FormData) => {
    const { currentAge, collegeAge, annualCost, yearsInCollege, currentSavings, annualContribution, annualIncrease, annualReturn, costIncreaseRate } = data;
    const yearsToCollege = collegeAge - currentAge;
    const returnRate = annualReturn / 100;
    
    let balance = currentSavings;
    let currentContribution = annualContribution;
    let totalContributions = 0;
    const schedule = [{ year: 0, age: currentAge, balance: balance, contribution: 0, interest: 0, tuitionCost: annualCost * Math.pow(1 + costIncreaseRate/100, yearsToCollege) }];

    for (let i = 1; i <= yearsToCollege; i++) {
        const interest = balance * returnRate;
        balance += interest + currentContribution;
        totalContributions += currentContribution;
        schedule.push({
            year: i,
            age: currentAge + i,
            balance: balance,
            contribution: currentContribution,
            interest: interest,
            tuitionCost: annualCost * Math.pow(1 + costIncreaseRate/100, yearsToCollege + i)
        });
        currentContribution *= (1 + annualIncrease / 100);
    }
    
    const projectedNestEgg = balance;

    let totalFutureCost = 0;
    for (let i = 0; i < yearsInCollege; i++) {
        totalFutureCost += annualCost * Math.pow(1 + costIncreaseRate / 100, yearsToCollege + i);
    }

    const shortfall = totalFutureCost - projectedNestEgg;
    
    setResults({
        projectedNestEgg,
        totalFutureCost,
        shortfall,
        schedule,
        initialDeposit: currentSavings,
        totalContributions,
        totalInterest: projectedNestEgg - currentSavings - totalContributions,
    });
    setFormData(data);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `college-savings-calculation.${format}`;
    
    if (format === 'txt') {
      content = `College Savings Calculation\n\nInputs:\n`;
      Object.entries(formData).forEach(([key, value]) => content += `- ${key}: ${value}\n`);
      content += `\nResults:\n`;
      content += `- Projected Nest Egg: ${formatCurrency(results.projectedNestEgg)}\n`;
      content += `- Total Future Cost: ${formatCurrency(results.totalFutureCost)}\n`;
      content += `- Shortfall/Surplus: ${formatCurrency(results.shortfall)}\n`;
    } else {
      content = 'Category,Value\n';
      Object.entries(formData).forEach(([key, value]) => content += `${key},${value}\n`);
      content += '\nResult Category,Value\n';
      content += `Projected Nest Egg,${results.projectedNestEgg.toFixed(2)}\n`;
      content += `Total Future Cost,${results.totalFutureCost.toFixed(2)}\n`;
      content += `Shortfall/Surplus,${results.shortfall.toFixed(2)}\n`;
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
    <form onSubmit={handleSubmit(calculateSavings)} className="space-y-8">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
            <Card><CardHeader><CardTitle>Student & College</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div><Label>Child's Current Age</Label><Controller name="currentAge" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />} /></div>
                        <div><Label>College Start Age</Label><Controller name="collegeAge" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />} /></div>
                    </div>
                    {errors.collegeAge && <p className="text-destructive text-sm mt-1">{errors.collegeAge.message}</p>}
                    <div><Label>Annual College Cost (today's dollars)</Label><Controller name="annualCost" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                    <div><Label>Years in College</Label><Controller name="yearsInCollege" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />} /></div>
                </CardContent>
            </Card>
            <Card><CardHeader><CardTitle>Savings & Growth</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div><Label>Current College Savings ($)</Label><Controller name="currentSavings" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                    <div><Label>Annual Contribution ($)</Label><Controller name="annualContribution" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                    <div><Label>Annual Contribution Increase (%)</Label><Controller name="annualIncrease" control={control} render={({ field }) => <Input type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                    <div><Label>Estimated Annual Return (%)</Label><Controller name="annualReturn" control={control} render={({ field }) => <Input type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                    <div><Label>College Cost Inflation Rate (%)</Label><Controller name="costIncreaseRate" control={control} render={({ field }) => <Input type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                </CardContent>
            </Card>
        </div>

        <div className="space-y-4">
            <h3 className="text-xl font-semibold">Results Summary</h3>
            {results ? (
                <div className="space-y-4">
                    <Alert variant={results.shortfall > 0 ? "destructive" : "default"} className={results.shortfall <= 0 ? "border-green-500" : ""}>
                        <Info className="h-4 w-4" />
                        <AlertTitle>{results.shortfall > 0 ? "You have a projected shortfall" : "You are on track to meet your goal!"}</AlertTitle>
                        <AlertDescription>Your projected savings of <strong>{formatCurrency(results.projectedNestEgg)}</strong> is {results.shortfall > 0 ? "less" : "more"} than the required <strong>{formatCurrency(results.totalFutureCost)}</strong>. The difference is <strong>{formatCurrency(Math.abs(results.shortfall))}</strong>.</AlertDescription>
                    </Alert>
                    <div className="grid md:grid-cols-2 gap-4">
                         <Card><CardHeader><CardTitle className="text-base text-center">Projected Savings Breakdown</CardTitle></CardHeader>
                            <CardContent className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={[ { name: 'Initial', value: results.initialDeposit }, { name: 'Contributions', value: results.totalContributions }, { name: 'Interest', value: results.totalInterest } ]} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5}>
                                        {[ { name: 'Initial', value: results.initialDeposit }, { name: 'Contributions', value: results.totalContributions }, { name: 'Interest', value: results.totalInterest } ].map((_entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                    <Legend iconType="circle" />
                                </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                         <Card><CardHeader><CardTitle className="text-base text-center">Savings vs. Tuition Cost</CardTitle></CardHeader>
                            <CardContent className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={results.schedule} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="age" name="Child's Age" />
                                        <YAxis tickFormatter={(val) => `$${(val/1000)}k`} />
                                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                        <Legend />
                                        <Line type="monotone" dataKey="balance" name="Savings Balance" stroke="hsl(var(--chart-2))" dot={false} />
                                        <Line type="monotone" dataKey="tuitionCost" name="Annual Tuition" stroke="hsl(var(--destructive))" dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-center h-60 bg-muted/50 rounded-lg border border-dashed"><p className="text-sm text-muted-foreground">Enter your college savings details to see your plan</p></div>
            )}
        </div>
      </div>
      
       {results && (
        <div className="col-span-full mt-4">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Year-by-Year Projection</h3>
                <div className="flex gap-2">
                    <Button type="submit" className="flex-1">Calculate</Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="outline" disabled={!results}><Download className="mr-2 h-4 w-4" /> Export</Button></DropdownMenuTrigger>
                      <DropdownMenuContent><DropdownMenuItem onClick={() => handleExport('txt')}>Download .txt</DropdownMenuItem><DropdownMenuItem onClick={() => handleExport('csv')}>Download .csv</DropdownMenuItem></DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
            <Card>
                <CardContent className="p-0">
                    <ScrollArea className="h-96">
                        <Table>
                            <TableHeader className="sticky top-0 bg-muted z-10">
                                <TableRow><TableHead>Year</TableHead><TableHead>Child's Age</TableHead><TableHead className="text-right">Contribution</TableHead><TableHead className="text-right">Interest Earned</TableHead><TableHead className="text-right">Year-End Balance</TableHead></TableRow>
                            </TableHeader>
                            <TableBody>
                                {results.schedule.map((row: any) => (
                                    <TableRow key={row.year}>
                                        <TableCell>{row.year}</TableCell>
                                        <TableCell>{row.age}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(row.contribution)}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(row.interest)}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(row.balance)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
      )}
    </form>
  );
}
