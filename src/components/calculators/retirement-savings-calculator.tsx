
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Info, Download } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

// --- Tab 1: How Much to Save ---
const saveSchema = z.object({
  currentAge: z.number().int().min(18),
  retirementAge: z.number().int().min(19),
  lifeExpectancy: z.number().int().min(20),
  currentIncome: z.number().min(1),
  incomeIncrease: z.number().min(0),
  incomeNeededPercent: z.number().min(1),
  investmentReturn: z.number().min(0),
  inflationRate: z.number().min(0),
  otherIncome: z.number().min(0),
  currentSavings: z.number().min(0),
  futureSavingsPercent: z.number().min(0),
}).refine(data => data.retirementAge > data.currentAge, {
  message: "Retirement age must be after current age.",
  path: ["retirementAge"],
}).refine(data => data.lifeExpectancy > data.retirementAge, {
    message: "Life expectancy must be after retirement age.",
    path: ["lifeExpectancy"],
});

type SaveFormData = z.infer<typeof saveSchema>;

function HowMuchToSave() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<SaveFormData | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<SaveFormData>({
    resolver: zodResolver(saveSchema),
    defaultValues: {
      currentAge: 35,
      retirementAge: 67,
      lifeExpectancy: 85,
      currentIncome: 70000,
      incomeIncrease: 3,
      incomeNeededPercent: 75,
      investmentReturn: 6,
      inflationRate: 3,
      otherIncome: 0,
      currentSavings: 30000,
      futureSavingsPercent: 10,
    },
  });

  const calculate = (data: SaveFormData) => {
    const yearsToRetirement = data.retirementAge - data.currentAge;
    let finalSalary = data.currentIncome * Math.pow(1 + data.incomeIncrease / 100, yearsToRetirement);
    let retirementIncomeNeeded = finalSalary * (data.incomeNeededPercent / 100);

    let nestEgg = data.currentSavings;
    let income = data.currentIncome;
    let schedule = [{ age: data.currentAge, balance: nestEgg }];

    for (let year = 1; year <= yearsToRetirement; year++) {
      const contribution = income * (data.futureSavingsPercent / 100);
      nestEgg = nestEgg * (1 + data.investmentReturn / 100) + contribution;
      income *= (1 + data.incomeIncrease / 100);
      schedule.push({ age: data.currentAge + year, balance: nestEgg });
    }

    const yearsInRetirement = data.lifeExpectancy - data.retirementAge;
    let requiredNestEgg = 0;
    const realReturnRate = ((1 + data.investmentReturn / 100) / (1 + data.inflationRate / 100)) - 1;
    
    if (realReturnRate !== 0) {
        requiredNestEgg = (retirementIncomeNeeded - (data.otherIncome * 12)) * 
                        ((1 - Math.pow(1 + realReturnRate, -yearsInRetirement)) / realReturnRate);
    } else {
        requiredNestEgg = (retirementIncomeNeeded - (data.otherIncome * 12)) * yearsInRetirement;
    }
    
    const shortfall = requiredNestEgg - nestEgg;

    setResults({ projectedNestEgg: nestEgg, requiredNestEgg, shortfall, schedule });
    setFormData(data);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
      if (!results || !formData) return;
      let content = `Retirement Savings Calculation\n\nInputs:\n${Object.entries(formData).map(([k,v]) => `- ${k}: ${v}`).join('\n')}\n\nResults:\n${Object.entries(results).filter(([k]) => k !== 'schedule').map(([k,v]) => `- ${k}: ${formatCurrency(v)}`).join('\n')}`;
      const blob = new Blob([content], { type: `text/${format}` });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `retirement-savings-calculation.${format}`;
      a.click();
      URL.revokeObjectURL(url);
  };

  return (
    <form onSubmit={handleSubmit(calculate)}>
        <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
                <Card><CardHeader><CardTitle>Your Details</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div><Label>Current Age</Label><Controller name="currentAge" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />} /></div>
                            <div><Label>Retirement Age</Label><Controller name="retirementAge" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />} /></div>
                        </div>
                        {errors.retirementAge && <p className="text-destructive text-sm">{errors.retirementAge.message}</p>}
                        <div><Label>Life Expectancy</Label><Controller name="lifeExpectancy" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />} /></div>
                        {errors.lifeExpectancy && <p className="text-destructive text-sm">{errors.lifeExpectancy.message}</p>}
                        <div><Label>Current Pre-Tax Income ($/year)</Label><Controller name="currentIncome" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                    </CardContent>
                </Card>
                <Card><CardHeader><CardTitle>Assumptions</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div><Label>Current Income Increase (%/year)</Label><Controller name="incomeIncrease" control={control} render={({ field }) => <Input type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                        <div><Label>Income Needed After Retirement (%)</Label><Controller name="incomeNeededPercent" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                        <div><Label>Average Investment Return (%/year)</Label><Controller name="investmentReturn" control={control} render={({ field }) => <Input type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                        <div><Label>Inflation Rate (%/year)</Label><Controller name="inflationRate" control={control} render={({ field }) => <Input type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                    </CardContent>
                </Card>
                 <Card><CardHeader><CardTitle>Optional</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div><Label>Other Income After Retirement ($/month)</Label><Controller name="otherIncome" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                        <div><Label>Current Retirement Savings ($)</Label><Controller name="currentSavings" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                        <div><Label>Future Retirement Savings (% of income)</Label><Controller name="futureSavingsPercent" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
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
                <h3 className="text-xl font-semibold">Results</h3>
                {results ? (
                    <div className="space-y-4">
                        <Alert variant={results.shortfall > 0 ? "destructive" : "default"} className={results.shortfall <= 0 ? "border-green-500" : ""}>
                            <Info className="h-4 w-4" />
                            <AlertTitle>{results.shortfall > 0 ? "You have a projected shortfall" : "You are on track for retirement!"}</AlertTitle>
                            <AlertDescription>Your projected savings of <strong>{formatCurrency(results.projectedNestEgg)}</strong> is {results.shortfall > 0 ? "less" : "more"} than your required nest egg of <strong>{formatCurrency(results.requiredNestEgg)}</strong>. The difference is <strong>{formatCurrency(Math.abs(results.shortfall))}</strong>.</AlertDescription>
                        </Alert>
                        <Card><CardContent className="p-4 h-96">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={results.schedule} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="age" name="Age" /><YAxis tickFormatter={(value) => formatCurrency(value)} /><Tooltip formatter={(value: number) => formatCurrency(value)} /><Legend /><Line type="monotone" dataKey="balance" name="Savings Balance" stroke="hsl(var(--primary))" dot={false} /></LineChart>
                            </ResponsiveContainer>
                        </CardContent></Card>
                    </div>
                ) : <div className="flex items-center justify-center h-60 bg-muted/50 rounded-lg border border-dashed"><p className="text-sm text-muted-foreground">Enter details to project retirement</p></div>}
            </div>
        </div>
    </form>
  )
}

// --- Tab 2: How Much to Withdraw ---
const withdrawSchema = z.object({
    retirementSavings: z.number().min(1),
    withdrawalYears: z.number().int().min(1),
    investmentReturn: z.number().min(0),
});
type WithdrawFormData = z.infer<typeof withdrawSchema>;

function HowMuchToWithdraw() {
    const [results, setResults] = useState<any>(null);
    const [formData, setFormData] = useState<WithdrawFormData | null>(null);
    const { control, handleSubmit } = useForm<WithdrawFormData>({
        resolver: zodResolver(withdrawSchema),
        defaultValues: { retirementSavings: 500000, withdrawalYears: 25, investmentReturn: 4 },
    });

    const calculate = (data: WithdrawFormData) => {
        const n = data.withdrawalYears * 12;
        const i = data.investmentReturn / 100 / 12;
        const pv = data.retirementSavings;
        const monthlyWithdrawal = (pv * i) / (1 - Math.pow(1 + i, -n));
        setResults({ monthlyWithdrawal, annualWithdrawal: monthlyWithdrawal * 12 });
        setFormData(data);
    };
    
    const handleExport = (format: 'txt' | 'csv') => {
        if (!results || !formData) return;
        let content = `Withdrawal Calculation\n\nInputs:\n${Object.entries(formData).map(([k,v]) => `- ${k}: ${v}`).join('\n')}\n\nResults:\n- Monthly: ${formatCurrency(results.monthlyWithdrawal)}\n- Annual: ${formatCurrency(results.annualWithdrawal)}`;
        const blob = new Blob([content], { type: `text/${format}` });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `retirement-withdrawal-calculation.${format}`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <form onSubmit={handleSubmit(calculate)} className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
                <Card><CardHeader><CardTitle>Withdrawal Inputs</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div><Label>Total Retirement Savings ($)</Label><Controller name="retirementSavings" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                        <div><Label>Withdrawal Period (Years)</Label><Controller name="withdrawalYears" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />} /></div>
                        <div><Label>Investment Return During Retirement (%)</Label><Controller name="investmentReturn" control={control} render={({ field }) => <Input type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                        <div className="flex gap-2 pt-4">
                            <Button type="submit" className="flex-1">Calculate Withdrawal</Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="outline" disabled={!results}><Download className="mr-2 h-4 w-4" /> Export</Button></DropdownMenuTrigger>
                                <DropdownMenuContent><DropdownMenuItem onClick={() => handleExport('txt')}>Download .txt</DropdownMenuItem><DropdownMenuItem onClick={() => handleExport('csv')}>Download .csv</DropdownMenuItem></DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </CardContent>
                </Card>
            </div>
             <div className="space-y-4">
                <h3 className="text-xl font-semibold">Sustainable Withdrawal</h3>
                {results ? (
                    <Card><CardContent className="p-4 text-center">
                        <p className="text-sm text-muted-foreground">You can withdraw approximately</p>
                        <p className="text-3xl font-bold">{formatCurrency(results.monthlyWithdrawal)}/month</p>
                        <p className="text-muted-foreground">({formatCurrency(results.annualWithdrawal)}/year)</p>
                    </CardContent></Card>
                ) : <div className="flex items-center justify-center h-60 bg-muted/50 rounded-lg border border-dashed"><p className="text-sm text-muted-foreground">Enter details to calculate</p></div>}
            </div>
        </form>
    )
}

// --- Tab 3: How Long Will It Last ---
const lastSchema = z.object({
    retirementSavings: z.number().min(1),
    annualWithdrawal: z.number().min(1),
    investmentReturn: z.number().min(0),
});
type LastFormData = z.infer<typeof lastSchema>;

function HowLongLast() {
    const [results, setResults] = useState<any>(null);
    const [formData, setFormData] = useState<LastFormData | null>(null);
    const { control, handleSubmit } = useForm<LastFormData>({
        resolver: zodResolver(lastSchema),
        defaultValues: { retirementSavings: 500000, annualWithdrawal: 30000, investmentReturn: 4 },
    });

    const calculate = (data: LastFormData) => {
        const i = data.investmentReturn / 100;
        const pmt = data.annualWithdrawal;
        const pv = data.retirementSavings;
        const n = Math.log(pmt / (pmt - pv * i)) / Math.log(1 + i);
        setResults({ years: isFinite(n) ? n.toFixed(1) : "Forever" });
        setFormData(data);
    };
    
    const handleExport = (format: 'txt' | 'csv') => {
        if (!results || !formData) return;
        let content = `Longevity Calculation\n\nInputs:\n${Object.entries(formData).map(([k,v]) => `- ${k}: ${v}`).join('\n')}\n\nResults:\n- Years: ${results.years}`;
        const blob = new Blob([content], { type: `text/${format}` });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `retirement-longevity-calculation.${format}`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <form onSubmit={handleSubmit(calculate)} className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
                 <Card><CardHeader><CardTitle>Longevity Inputs</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div><Label>Total Retirement Savings ($)</Label><Controller name="retirementSavings" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                        <div><Label>Annual Withdrawal Amount ($)</Label><Controller name="annualWithdrawal" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                        <div><Label>Annual Investment Return (%)</Label><Controller name="investmentReturn" control={control} render={({ field }) => <Input type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                        <div className="flex gap-2 pt-4">
                            <Button type="submit" className="flex-1">Calculate Longevity</Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="outline" disabled={!results}><Download className="mr-2 h-4 w-4" /> Export</Button></DropdownMenuTrigger>
                                <DropdownMenuContent><DropdownMenuItem onClick={() => handleExport('txt')}>Download .txt</DropdownMenuItem><DropdownMenuItem onClick={() => handleExport('csv')}>Download .csv</DropdownMenuItem></DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="space-y-4">
                <h3 className="text-xl font-semibold">Savings Longevity</h3>
                {results ? (
                    <Card><CardContent className="p-4 text-center">
                        <p className="text-sm text-muted-foreground">Your savings will last approximately</p>
                        <p className="text-3xl font-bold">{results.years} years</p>
                    </CardContent></Card>
                ) : <div className="flex items-center justify-center h-60 bg-muted/50 rounded-lg border border-dashed"><p className="text-sm text-muted-foreground">Enter details to calculate</p></div>}
            </div>
        </form>
    );
}

// --- Tab 4: 401k Growth ---
const four01kSchema = z.object({
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
type Four01kFormData = z.infer<typeof four01kSchema>;

function Four01kCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<Four01kFormData | null>(null);
  const { control, handleSubmit } = useForm<Four01kFormData>({
    resolver: zodResolver(four01kSchema),
    defaultValues: { currentAge: 30, retirementAge: 67, currentBalance: 50000, annualSalary: 80000, contributionPercent: 10, employerMatchPercent: 50, matchUpToPercent: 6, annualReturn: 7 },
  });

  const calculate401k = (data: Four01kFormData) => {
    const yearsToRetirement = data.retirementAge - data.currentAge;
    const monthlyRate = data.annualReturn / 100 / 12;
    let balance = data.currentBalance;
    const schedule = [{ age: data.currentAge, balance }];
    for (let year = 1; year <= yearsToRetirement; year++) {
      const employeeContributionMonthly = (data.annualSalary * (data.contributionPercent / 100)) / 12;
      const employerMatchableContribution = (data.annualSalary * (data.matchUpToPercent / 100)) / 12;
      const employerMatchMonthly = Math.min(employeeContributionMonthly, employerMatchableContribution) * (data.employerMatchPercent / 100);
      const totalMonthlyContribution = employeeContributionMonthly + employerMatchMonthly;
      for (let month = 1; month <= 12; month++) {
        balance = balance * (1 + monthlyRate) + totalMonthlyContribution;
      }
      schedule.push({ age: data.currentAge + year, balance });
    }
    setResults({ finalBalance: balance, schedule });
    setFormData(data);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
      if (!results || !formData) return;
      let content = `401k Calculation\n\nInputs:\n${Object.entries(formData).map(([k,v]) => `- ${k}: ${v}`).join('\n')}\n\nResults:\n- Final Balance: ${formatCurrency(results.finalBalance)}`;
      const blob = new Blob([content], { type: `text/${format}` });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `401k-calculation.${format}`;
      a.click();
      URL.revokeObjectURL(url);
  };

  return (
    <form onSubmit={handleSubmit(calculate401k)}>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <Card><CardHeader><CardTitle>Your Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                      <div><Label>Current Age</Label><Controller name="currentAge" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />} /></div>
                      <div><Label>Retirement Age</Label><Controller name="retirementAge" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />} /></div>
                  </div>
                  <div><Label>Annual Salary ($)</Label><Controller name="annualSalary" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                  <div><Label>Current 401k Balance ($)</Label><Controller name="currentBalance" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
              </CardContent>
          </Card>
          <Card><CardHeader><CardTitle>Contributions & Growth</CardTitle></CardHeader>
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
          <h3 className="text-xl font-semibold">Projected 401(k) Balance</h3>
          {results ? (
              <div className="space-y-4">
                  <Card><CardContent className="p-4 text-center"><p className="text-sm text-muted-foreground">Balance at Retirement</p><p className="text-3xl font-bold">{formatCurrency(results.finalBalance)}</p></CardContent></Card>
                  <Card><CardContent className="p-4 h-96"><ResponsiveContainer width="100%" height="100%"><LineChart data={results.schedule} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="age" name="Age" /><YAxis tickFormatter={(value) => formatCurrency(value)} /><Tooltip formatter={(value: number) => formatCurrency(value)} /><Legend /><Line type="monotone" dataKey="balance" name="Savings Balance" stroke="hsl(var(--primary))" dot={false} /></LineChart></ResponsiveContainer></CardContent></Card>
              </div>
          ) : <div className="flex items-center justify-center h-60 bg-muted/50 rounded-lg border border-dashed"><p className="text-sm text-muted-foreground">Enter details to project 401k growth</p></div>}
        </div>
      </div>
    </form>
  )
}

export default function RetirementSavingsCalculator() {
  return (
    <Tabs defaultValue="how-much-to-save" className="w-full">
      <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
        <TabsTrigger value="how-much-to-save">How Much to Save</TabsTrigger>
        <TabsTrigger value="how-much-to-withdraw">Withdrawal Amount</TabsTrigger>
        <TabsTrigger value="how-long-will-it-last">How Long It Lasts</TabsTrigger>
        <TabsTrigger value="401k-growth">401(k) Growth</TabsTrigger>
      </TabsList>
      <TabsContent value="how-much-to-save" className="mt-6"><HowMuchToSave /></TabsContent>
      <TabsContent value="how-much-to-withdraw" className="mt-6"><HowMuchToWithdraw /></TabsContent>
      <TabsContent value="how-long-will-it-last" className="mt-6"><HowLongLast /></TabsContent>
      <TabsContent value="401k-growth" className="mt-6"><Four01kCalculator /></TabsContent>
    </Tabs>
  );
}
