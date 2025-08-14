
"use client";

import { useState } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, Info, Trash } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
const PIE_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

// --- Tab 1: 401k Growth Calculator ---
const growthSchema = z.object({
  currentAge: z.number().int().min(18),
  retirementAge: z.number().int().min(19),
  currentBalance: z.number().min(0),
  annualSalary: z.number().min(1),
  contributionPercent: z.number().min(0).max(100),
  employerMatchPercent: z.number().min(0).max(100),
  matchUpToPercent: z.number().min(0).max(100),
  annualReturn: z.number().min(0),
}).refine(data => data.retirementAge > data.currentAge, {
  message: "Retirement age must be after current age.",
  path: ["retirementAge"],
});
type GrowthFormData = z.infer<typeof growthSchema>;

function GrowthCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<GrowthFormData | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<GrowthFormData>({
    resolver: zodResolver(growthSchema),
    defaultValues: {
      currentAge: 30,
      retirementAge: 67,
      currentBalance: 50000,
      annualSalary: 80000,
      contributionPercent: 10,
      employerMatchPercent: 50,
      matchUpToPercent: 6,
      annualReturn: 7,
    },
  });

  const calculate401k = (data: GrowthFormData) => {
    const yearsToRetirement = data.retirementAge - data.currentAge;
    const monthlyRate = data.annualReturn / 100 / 12;
    let balance = data.currentBalance;
    const schedule = [{ age: data.currentAge, balance, totalContributions: data.currentBalance, totalInterest: 0 }];
    
    let totalEmployeeContribution = 0;
    let totalEmployerContribution = 0;

    for (let year = 1; year <= yearsToRetirement; year++) {
      let currentYearSalary = data.annualSalary; // Assuming salary doesn't increase for simplicity here
      const employeeContributionMonthly = (currentYearSalary * (data.contributionPercent / 100)) / 12;
      const employerMatchable = (currentYearSalary * (data.matchUpToPercent / 100)) / 12;
      const employerMatchMonthly = Math.min(employeeContributionMonthly, employerMatchable) * (data.employerMatchPercent / 100);
      
      const currentTotalMonthly = employeeContributionMonthly + employerMatchMonthly;

      for (let month = 1; month <= 12; month++) {
        balance += currentTotalMonthly;
        balance = balance * (1 + monthlyRate);
        totalEmployeeContribution += employeeContributionMonthly;
        totalEmployerContribution += employerMatchMonthly;
      }
      schedule.push({ age: data.currentAge + year, balance });
    }
    
    const totalContributions = totalEmployeeContribution + totalEmployerContribution;
    const totalInterest = balance - data.currentBalance - totalContributions;

    setResults({
      finalBalance: balance,
      initialBalance: data.currentBalance,
      totalEmployeeContribution,
      totalEmployerContribution,
      totalContributions,
      totalInterest,
      schedule,
      pieData: [
        { name: 'Initial Balance', value: data.currentBalance },
        { name: 'Your Contributions', value: totalEmployeeContribution },
        { name: 'Employer Contributions', value: totalEmployerContribution },
        { name: 'Interest Earned', value: totalInterest },
      ].filter(item => item.value > 0),
      error: null,
    });
    setFormData(data);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    let content = '';
    const filename = `401k-growth-calculation.${format}`;
    if (format === 'txt') {
      content = `401k Growth Calculation\n\nInputs:\n${Object.entries(formData).map(([k,v]) => `- ${k}: ${v}`).join('\n')}\n\nResult:\n- Balance at Retirement: ${formatCurrency(results.finalBalance)}`;
    } else {
      content = `Category,Value\n${Object.entries(formData).map(([k,v]) => `${k},${v}`).join('\n')}\n\nResult - Balance at Retirement,${results.finalBalance}`;
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
    <form onSubmit={handleSubmit(calculate401k)}>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <Card>
              <CardHeader><CardTitle className="text-lg">Your Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                      <div><Label>Current Age</Label><Controller name="currentAge" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />} /></div>
                      <div><Label>Retirement Age</Label><Controller name="retirementAge" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />} /></div>
                  </div>
                  {errors.retirementAge && <p className="text-destructive text-sm">{errors.retirementAge.message}</p>}
                  <div><Label>Annual Salary ($)</Label><Controller name="annualSalary" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                  <div><Label>Current 401k Balance ($)</Label><Controller name="currentBalance" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
              </CardContent>
          </Card>
          <Card>
              <CardHeader><CardTitle className="text-lg">Contributions & Growth</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                  <div><Label>Your Contribution (%)</Label><Controller name="contributionPercent" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                  <div><Label>Employer Match (%)</Label><Controller name="employerMatchPercent" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                  <div><Label>Employer Match Up To (%)</Label><Controller name="matchUpToPercent" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                  <div><Label>Estimated Annual Return (%)</Label><Controller name="annualReturn" control={control} render={({ field }) => <Input type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
              </CardContent>
          </Card>
          <div className="flex gap-2">
              <Button type="submit" className="flex-1">Calculate</Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="outline" disabled={!results}><Download className="mr-2 h-4 w-4" /> Export</Button></DropdownMenuTrigger>
                <DropdownMenuContent><DropdownMenuItem onClick={() => handleExport('txt')}>Download .txt</DropdownMenuItem><DropdownMenuItem onClick={() => handleExport('csv')}>Download .csv</DropdownMenuItem></DropdownMenuContent>
              </DropdownMenu>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Projected Balance</h3>
          {results ? (
              <div className="space-y-4">
                  <Card><CardHeader><CardTitle className="text-center">Balance at Retirement</CardTitle></CardHeader><CardContent className="text-center"><p className="text-3xl font-bold">{formatCurrency(results.finalBalance)}</p></CardContent></Card>
                  <Card><CardHeader><CardTitle className="text-lg">Summary</CardTitle></CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between font-bold"><span>End Balance</span><span>{formatCurrency(results.finalBalance)}</span></div>
                        <div className="flex justify-between pl-4 text-muted-foreground"><span>Initial Balance</span><span>{formatCurrency(results.initialBalance)}</span></div>
                        <div className="flex justify-between pl-4 text-muted-foreground"><span>Your Contributions</span><span>{formatCurrency(results.totalEmployeeContribution)}</span></div>
                        <div className="flex justify-between pl-4 text-muted-foreground"><span>Employer Contributions</span><span>{formatCurrency(results.totalEmployerContribution)}</span></div>
                        <div className="flex justify-between pl-4 text-muted-foreground"><span>Total Interest Earned</span><span>{formatCurrency(results.totalInterest)}</span></div>
                    </CardContent>
                  </Card>
                   <Card><CardHeader><CardTitle className="text-base text-center">Balance Breakdown</CardTitle></CardHeader>
                    <CardContent className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={results.pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={30} outerRadius={50} paddingAngle={5}>
                              {results.pieData.map((_entry: any, index: number) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                          </Pie>
                          <Tooltip formatter={(value: number) => formatCurrency(value)} /><Legend iconType="circle" />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
              </div>
          ) : ( <div className="flex items-center justify-center h-60 bg-muted/50 rounded-lg border border-dashed"><p className="text-sm text-muted-foreground">Enter your details to project your growth</p></div> )}
        </div>
      </div>
      
      {results && (
        <div className="col-span-1 md:col-span-2 mt-8">
            <h3 className="text-xl font-semibold mb-4">Projected Growth</h3>
            <Card><CardContent className="p-4"><div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={results.schedule} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="age" name="Age" /><YAxis tickFormatter={(value) => formatCurrency(value)} /><Tooltip formatter={(value: number) => formatCurrency(value)} /><Legend /><Line type="monotone" dataKey="balance" name="Savings Balance" stroke="hsl(var(--primary))" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div></CardContent></Card>
        </div>
      )}
    </form>
  );
}


// --- Tab 2: Early Withdrawal Calculator ---
const withdrawalSchema = z.object({
    withdrawalAmount: z.number().min(1, 'Amount must be positive'),
    federalTaxRate: z.number().min(0).max(100),
    stateTaxRate: z.number().min(0).max(100),
    localTaxRate: z.number().min(0).max(100),
    hasExemption: z.enum(['yes', 'no']),
});
type WithdrawalFormData = z.infer<typeof withdrawalSchema>;

function WithdrawalCalculator() {
    const [results, setResults] = useState<any>(null);
    const [formData, setFormData] = useState<WithdrawalFormData | null>(null);

    const { control, handleSubmit } = useForm<WithdrawalFormData>({
        resolver: zodResolver(withdrawalSchema),
        defaultValues: { withdrawalAmount: 10000, federalTaxRate: 25, stateTaxRate: 5, localTaxRate: 0, hasExemption: 'no' },
    });

    const calculate = (data: WithdrawalFormData) => {
        const { withdrawalAmount, federalTaxRate, stateTaxRate, localTaxRate, hasExemption } = data;
        const earlyPenalty = hasExemption === 'yes' ? 0 : withdrawalAmount * 0.10;
        const federalTax = withdrawalAmount * (federalTaxRate / 100);
        const stateTax = withdrawalAmount * (stateTaxRate / 100);
        const localTax = withdrawalAmount * (localTaxRate / 100);
        const totalTaxesAndPenalty = earlyPenalty + federalTax + stateTax + localTax;
        const netAmount = withdrawalAmount - totalTaxesAndPenalty;
        setResults({ netAmount, totalTaxesAndPenalty, earlyPenalty, federalTax, stateTax, localTax });
        setFormData(data);
    };

    const handleExport = (format: 'txt' | 'csv') => {
        if (!results || !formData) return;
        let content = '';
        const filename = `401k-withdrawal-cost.${format}`;
        if (format === 'txt') {
            content = `401k Withdrawal Cost\n\nInputs:\n${Object.entries(formData).map(([k,v]) => `- ${k}: ${v}`).join('\n')}\n\nResult:\n- Net Amount: ${formatCurrency(results.netAmount)}`;
        } else {
            content = `Category,Value\n${Object.entries(formData).map(([k,v]) => `${k},${v}`).join('\n')}\n\nResult,Net Amount\nResult,${results.netAmount}`;
        }
        const blob = new Blob([content], { type: `text/${format}` });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <form onSubmit={handleSubmit(calculate)} className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
                <Card><CardHeader><CardTitle>Withdrawal Details</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div><Label>Early Withdrawal Amount ($)</Label><Controller name="withdrawalAmount" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                        <div><Label>Federal Income Tax Rate (%)</Label><Controller name="federalTaxRate" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                        <div><Label>State Income Tax Rate (%)</Label><Controller name="stateTaxRate" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                        <div><Label>Local/City Income Tax Rate (%)</Label><Controller name="localTaxRate" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                        <div><Label>Qualify for penalty exemption?</Label><Controller name="hasExemption" control={control} render={({ field }) => (<RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4 pt-2"><div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="yes" /><Label htmlFor="yes">Yes</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="no" id="no" /><Label htmlFor="no">No</Label></div></RadioGroup>)} /></div>
                    </CardContent>
                </Card>
                 <div className="flex gap-2">
                    <Button type="submit" className="flex-1">Calculate</Button>
                    <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" disabled={!results}><Download className="mr-2 h-4 w-4" /> Export</Button></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem onClick={() => handleExport('txt')}>Download .txt</DropdownMenuItem><DropdownMenuItem onClick={() => handleExport('csv')}>Download .csv</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
                </div>
            </div>
             <div className="space-y-4">
                <h3 className="text-xl font-semibold">Withdrawal Breakdown</h3>
                {results ? (
                    <Card><CardContent className="p-4">
                        <div className="flex justify-between font-bold text-lg"><p>Net Amount Received</p><p>{formatCurrency(results.netAmount)}</p></div>
                        <div className="flex justify-between mt-4"><p className="text-muted-foreground">Withdrawal Amount</p><p>{formatCurrency(formData?.withdrawalAmount || 0)}</p></div>
                        <div className="flex justify-between text-destructive"><p>10% Early Withdrawal Penalty</p><p>-{formatCurrency(results.earlyPenalty)}</p></div>
                        <div className="flex justify-between text-destructive"><p>Federal Tax</p><p>-{formatCurrency(results.federalTax)}</p></div>
                        <div className="flex justify-between text-destructive"><p>State Tax</p><p>-{formatCurrency(results.stateTax)}</p></div>
                        <div className="flex justify-between text-destructive"><p>Local Tax</p><p>-{formatCurrency(results.localTax)}</p></div>
                        <div className="flex justify-between font-bold border-t mt-2 pt-2"><p>Total Taxes & Penalty</p><p>{formatCurrency(results.totalTaxesAndPenalty)}</p></div>
                    </CardContent></Card>
                ) : <div className="flex items-center justify-center h-60 bg-muted/50 rounded-lg border border-dashed"><p className="text-sm text-muted-foreground">Enter details to calculate</p></div>}
            </div>
        </form>
    );
}

// --- Tab 3: Maximize Match Calculator ---
const matchSchema = z.object({
  annualSalary: z.number().min(1),
  matches: z.array(z.object({
    matchPercent: z.number().min(0).max(100),
    matchLimit: z.number().min(0).max(100),
  })).min(1),
});
type MatchFormData = z.infer<typeof matchSchema>;

function MaxMatchCalculator() {
    const [results, setResults] = useState<any>(null);
    const { control, handleSubmit } = useForm<MatchFormData>({
        resolver: zodResolver(matchSchema),
        defaultValues: {
            annualSalary: 75000,
            matches: [{ matchPercent: 50, matchLimit: 3 }, { matchPercent: 20, matchLimit: 6 }],
        },
    });

    const { fields, append, remove } = useFieldArray({ control, name: "matches" });
    
    const calculate = (data: MatchFormData) => {
        let totalContributionPercent = 0;
        let totalMatchAmount = 0;
        data.matches.forEach(m => {
            totalContributionPercent = Math.max(totalContributionPercent, m.matchLimit);
            totalMatchAmount += data.annualSalary * (m.matchLimit / 100) * (m.matchPercent / 100);
        });
        setResults({
            requiredContribution: totalContributionPercent,
            totalMatch: totalMatchAmount
        });
    };

    return (
        <form onSubmit={handleSubmit(calculate)} className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
                <Card><CardHeader><CardTitle>Employer Match Details</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div><Label>Current Annual Salary ($)</Label><Controller name="annualSalary" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                        {fields.map((field, index) => (
                          <div key={field.id} className="flex gap-2 items-end p-2 border rounded-md relative">
                            <div className="grid grid-cols-2 gap-2 flex-1">
                              <div><Label className="text-xs">Employer Match %</Label><Controller name={`matches.${index}.matchPercent`} control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                              <div><Label className="text-xs">Match Limit %</Label><Controller name={`matches.${index}.matchLimit`} control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                            </div>
                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash className="h-4 w-4" /></Button>
                          </div>
                        ))}
                        <Button type="button" variant="outline" onClick={() => append({ matchPercent: 0, matchLimit: 0 })}>Add Match Tier</Button>
                    </CardContent>
                </Card>
                <Button type="submit" className="w-full">Calculate</Button>
            </div>
             <div className="space-y-4">
                <h3 className="text-xl font-semibold">Results</h3>
                {results ? (
                    <Card>
                        <CardContent className="p-4 grid grid-cols-2 gap-4 text-center">
                            <div><p className="text-muted-foreground">Required Contribution</p><p className="font-semibold text-xl">{results.requiredContribution}%</p></div>
                            <div><p className="text-muted-foreground">Total Annual Match</p><p className="font-semibold text-xl">{formatCurrency(results.totalMatch)}</p></div>
                        </CardContent>
                        <CardFooter><Alert><Info className="h-4 w-4" /><AlertDescription className="text-xs">To maximize your match, you should contribute at least the highest match limit percentage.</AlertDescription></Alert></CardFooter>
                    </Card>
                ) : <div className="flex items-center justify-center h-60 bg-muted/50 rounded-lg border border-dashed"><p className="text-sm text-muted-foreground">Enter details to calculate</p></div>}
            </div>
        </form>
    );
}

// --- Main Component ---
export default function Four01kCalculator() {
  return (
    <Tabs defaultValue="growth" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="growth">401(k) Growth</TabsTrigger>
        <TabsTrigger value="withdrawal">Early Withdrawal</TabsTrigger>
        <TabsTrigger value="match">Maximize Match</TabsTrigger>
      </TabsList>
      <TabsContent value="growth" className="mt-6"><GrowthCalculator /></TabsContent>
      <TabsContent value="withdrawal" className="mt-6"><WithdrawalCalculator /></TabsContent>
      <TabsContent value="match" className="mt-6"><MaxMatchCalculator /></TabsContent>
    </Tabs>
  );
}
