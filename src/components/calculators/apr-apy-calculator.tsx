
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, PieChart as PieChartIcon, Info } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
const PIE_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))'];

// --- General APR Calculator ---
const generalAprSchema = z.object({
  loanAmount: z.number().min(1, 'Loan amount is required'),
  loanTermYears: z.number().int().min(0).default(0),
  loanTermMonths: z.number().int().min(0).default(0),
  interestRate: z.number().min(0.01, 'Interest rate is required'),
  upfrontFees: z.number().min(0).default(0),
}).refine(data => data.loanTermYears > 0 || data.loanTermMonths > 0, {
    message: "Loan term must be at least 1 month.",
    path: ['loanTermMonths']
});

type GeneralAprFormData = z.infer<typeof generalAprSchema>;

function GeneralAprCalculator() {
    const [results, setResults] = useState<any>(null);
    const [formData, setFormData] = useState<GeneralAprFormData | null>(null);

    const { control, handleSubmit, formState: { errors } } = useForm<GeneralAprFormData>({
        resolver: zodResolver(generalAprSchema),
        defaultValues: { loanAmount: 100000, loanTermYears: 10, loanTermMonths: 0, interestRate: 6, upfrontFees: 2500 },
    });

    // Simplified APR calculation using iteration (Newton-Raphson method could also be used)
    const calculateApr = (data: GeneralAprFormData) => {
        const { loanAmount, loanTermYears, loanTermMonths, interestRate, upfrontFees } = data;
        const netLoanAmount = loanAmount - upfrontFees;
        const totalMonths = loanTermYears * 12 + loanTermMonths;
        const monthlyRate = interestRate / 100 / 12;

        const monthlyPayment = (loanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -totalMonths));
        if (!isFinite(monthlyPayment) || monthlyPayment <= 0) {
            setResults({ error: 'Cannot calculate payment with these inputs.' });
            return;
        }

        // Iterate to find the APR
        let aprRate = monthlyRate;
        let diff = 1;
        for (let i = 0; i < 30; i++) { // Limit iterations
            const f = netLoanAmount - (monthlyPayment * (1 - Math.pow(1 + aprRate, -totalMonths)) / aprRate);
            const f_prime = (monthlyPayment * totalMonths * Math.pow(1 + aprRate, -totalMonths - 1) / aprRate) - (monthlyPayment * (1 - Math.pow(1 + aprRate, -totalMonths)) / (aprRate * aprRate));
            diff = f / f_prime;
            aprRate -= diff;
            if (Math.abs(diff) < 1e-6) break;
        }

        const apr = aprRate * 12 * 100;
        const totalPaid = monthlyPayment * totalMonths;
        const totalFinanceCharge = totalPaid - netLoanAmount;

        setResults({
            apr: apr.toFixed(3),
            monthlyPayment: monthlyPayment,
            totalPaid: totalPaid,
            totalFinanceCharge: totalFinanceCharge,
            pieData: [{ name: 'Net Loan Amount', value: netLoanAmount }, { name: 'Total Finance Charge', value: totalFinanceCharge }],
            error: null
        });
        setFormData(data);
    }
    
    const handleExport = (format: 'txt' | 'csv') => {
        if (!results || !formData) return;
        let content = '';
        const filename = `general-apr-calculation.${format}`;
        if(format === 'txt') {
            content = `General APR Calculation\n\nInputs:\n${Object.entries(formData).map(([k,v]) => `- ${k}: ${v}`).join('\n')}\n\nResults:\n- APR: ${results.apr}%\n- Monthly Payment: ${formatCurrency(results.monthlyPayment)}\n- Total Paid: ${formatCurrency(results.totalPaid)}`;
        } else {
            content = `Category,Value\n${Object.entries(formData).map(([k,v]) => `${k},${v}`).join('\n')}\n\nResult,Value\nAPR (%),${results.apr}\nMonthly Payment,${results.monthlyPayment.toFixed(2)}\nTotal Paid,${results.totalPaid.toFixed(2)}`;
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
        <form onSubmit={handleSubmit(calculateApr)} className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
                <Card><CardHeader><CardTitle>Loan Details</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div><Label>Loan Amount ($)</Label><Controller name="loanAmount" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                        <div><Label>Loan Term</Label><div className="flex gap-2"><Controller name="loanTermYears" control={control} render={({ field }) => <Input type="number" placeholder="Years" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />} /><Controller name="loanTermMonths" control={control} render={({ field }) => <Input type="number" placeholder="Months" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />} /></div>
                        {errors.loanTermMonths && <p className="text-destructive text-sm mt-1">{errors.loanTermMonths.message}</p>}</div>
                        <div><Label>Interest Rate (%)</Label><Controller name="interestRate" control={control} render={({ field }) => <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                        <div><Label>Upfront Fees ($)</Label><Controller name="upfrontFees" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                    </CardContent>
                </Card>
                 <div className="flex gap-2">
                    <Button type="submit" className="flex-1">Calculate APR</Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="outline" disabled={!results}><Download className="mr-2 h-4 w-4" /> Export</Button></DropdownMenuTrigger>
                        <DropdownMenuContent><DropdownMenuItem onClick={() => handleExport('txt')}>Download .txt</DropdownMenuItem><DropdownMenuItem onClick={() => handleExport('csv')}>Download .csv</DropdownMenuItem></DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
             <div className="space-y-4">
                <h3 className="text-xl font-semibold">Results</h3>
                {results && !results.error ? (
                    <div className="space-y-4">
                        <Card><CardContent className="p-4 text-center"><p className="text-sm text-muted-foreground">Annual Percentage Rate (APR)</p><p className="text-3xl font-bold">{results.apr}%</p></CardContent></Card>
                        <Card><CardContent className="p-4 text-center"><p className="text-sm text-muted-foreground">Monthly Payment</p><p className="text-xl font-bold">{formatCurrency(results.monthlyPayment)}</p></CardContent></Card>
                        <Card><CardHeader><CardTitle className="text-base text-center">Cost Breakdown</CardTitle></CardHeader>
                            <CardContent className="h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={results.pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={60}>
                                            {results.pieData.map((_entry: any, index: number) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                        <Legend iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                ) : <div className="flex items-center justify-center h-full bg-muted/50 rounded-lg border border-dashed"><p className="text-sm text-muted-foreground text-center p-4">{results?.error || "Enter details to calculate APR."}</p></div>}
            </div>
        </form>
    )
}

// --- Mortgage APR Calculator ---
const mortgageAprSchema = z.object({
  houseValue: z.number().min(1, 'House value is required'),
  downPayment: z.number().min(0).max(100),
  loanTerm: z.number().int().min(1),
  interestRate: z.number().min(0.01),
  loanFees: z.number().min(0).default(0),
  points: z.number().min(0).default(0),
  pmiInsurance: z.number().min(0).default(0),
});
type MortgageAprFormData = z.infer<typeof mortgageAprSchema>;

function MortgageAprCalculator() {
     const [results, setResults] = useState<any>(null);
    const [formData, setFormData] = useState<MortgageAprFormData | null>(null);

    const { control, handleSubmit } = useForm<MortgageAprFormData>({
        resolver: zodResolver(mortgageAprSchema),
        defaultValues: { houseValue: 350000, downPayment: 20, loanTerm: 30, interestRate: 6.2, loanFees: 3500, points: 0.5, pmiInsurance: 0 },
    });
    
    // This is a simplified calculation and may not match official calculations exactly.
    const calculateApr = (data: MortgageAprFormData) => {
        const { houseValue, downPayment, loanTerm, interestRate, loanFees, points, pmiInsurance } = data;
        
        const loanAmount = houseValue * (1 - downPayment / 100);
        const pointsCost = loanAmount * (points / 100);
        const upfrontFees = loanFees + pointsCost;
        const netLoanAmount = loanAmount - upfrontFees;
        
        const totalMonths = loanTerm * 12;
        const monthlyRate = interestRate / 100 / 12;
        const pmiMonthly = pmiInsurance / 12;

        const principalAndInterest = (loanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -totalMonths));
        const totalMonthlyPayment = principalAndInterest + pmiMonthly;

        if (!isFinite(totalMonthlyPayment) || totalMonthlyPayment <= 0) {
            setResults({ error: 'Cannot calculate payment with these inputs.' });
            return;
        }
        
        // Iterate to find the APR
        let aprRate = monthlyRate;
        for (let i = 0; i < 30; i++) {
             const f = netLoanAmount - (totalMonthlyPayment * (1 - Math.pow(1 + aprRate, -totalMonths)) / aprRate);
             const f_prime = (totalMonthlyPayment * totalMonths * Math.pow(1 + aprRate, -totalMonths - 1) / aprRate) - (totalMonthlyPayment * (1 - Math.pow(1 + aprRate, -totalMonths)) / (aprRate * aprRate));
             const diff = f / f_prime;
             aprRate -= diff;
             if (Math.abs(diff) < 1e-6) break;
        }

        const apr = aprRate * 12 * 100;
        const totalPaid = totalMonthlyPayment * totalMonths;
        const totalFinanceCharge = totalPaid - netLoanAmount;

        setResults({
            apr: apr.toFixed(3),
            monthlyPayment: totalMonthlyPayment,
            totalFinanceCharge: totalFinanceCharge,
            pieData: [{ name: 'Net Loan Amount', value: netLoanAmount }, { name: 'Total Finance Charge', value: totalFinanceCharge }],
            error: null
        });
        setFormData(data);
    };
    
    const handleExport = (format: 'txt' | 'csv') => {
        if (!results || !formData) return;
        let content = '';
        const filename = `mortgage-apr-calculation.${format}`;
        if(format === 'txt') {
            content = `Mortgage APR Calculation\n\nInputs:\n${Object.entries(formData).map(([k,v]) => `- ${k}: ${v}`).join('\n')}\n\nResults:\n- APR: ${results.apr}%\n- Monthly Payment: ${formatCurrency(results.monthlyPayment)}`;
        } else {
            content = `Category,Value\n${Object.entries(formData).map(([k,v]) => `${k},${v}`).join('\n')}\n\nResult,Value\nAPR (%),${results.apr}\nMonthly Payment,${results.monthlyPayment.toFixed(2)}`;
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
        <form onSubmit={handleSubmit(calculateApr)} className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
                <Card><CardHeader><CardTitle>Mortgage Details</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div><Label>House Value ($)</Label><Controller name="houseValue" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                        <div><Label>Down Payment (%)</Label><Controller name="downPayment" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                        <div><Label>Loan Term (years)</Label><Controller name="loanTerm" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />} /></div>
                        <div><Label>Interest Rate (%)</Label><Controller name="interestRate" control={control} render={({ field }) => <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                        <div><Label>Loan Fees ($)</Label><Controller name="loanFees" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                        <div><Label>Points</Label><Controller name="points" control={control} render={({ field }) => <Input type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                        <div><Label>PMI Insurance ($/year)</Label><Controller name="pmiInsurance" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                    </CardContent>
                </Card>
                 <div className="flex gap-2">
                    <Button type="submit" className="flex-1">Calculate APR</Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="outline" disabled={!results}><Download className="mr-2 h-4 w-4" /> Export</Button></DropdownMenuTrigger>
                        <DropdownMenuContent><DropdownMenuItem onClick={() => handleExport('txt')}>Download .txt</DropdownMenuItem><DropdownMenuItem onClick={() => handleExport('csv')}>Download .csv</DropdownMenuItem></DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
             <div className="space-y-4">
                <h3 className="text-xl font-semibold">Results</h3>
                {results && !results.error ? (
                    <div className="space-y-4">
                        <Card><CardContent className="p-4 text-center"><p className="text-sm text-muted-foreground">Annual Percentage Rate (APR)</p><p className="text-3xl font-bold">{results.apr}%</p></CardContent></Card>
                        <Card><CardContent className="p-4 text-center"><p className="text-sm text-muted-foreground">Monthly Payment (incl. PMI)</p><p className="text-xl font-bold">{formatCurrency(results.monthlyPayment)}</p></CardContent></Card>
                        <Card><CardHeader><CardTitle className="text-base text-center">Cost Breakdown</CardTitle></CardHeader>
                            <CardContent className="h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={results.pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={60}>
                                            {results.pieData.map((_entry: any, index: number) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                        <Legend iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                ) : <div className="flex items-center justify-center h-full bg-muted/50 rounded-lg border border-dashed"><p className="text-sm text-muted-foreground text-center p-4">{results?.error || "Enter details to calculate APR."}</p></div>}
            </div>
        </form>
    );
}

export default function AprApyCalculator() {
  return (
    <Tabs defaultValue="general" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="general">General APR</TabsTrigger>
        <TabsTrigger value="mortgage">Mortgage APR</TabsTrigger>
      </TabsList>
      <TabsContent value="general" className="mt-6">
        <GeneralAprCalculator />
      </TabsContent>
      <TabsContent value="mortgage" className="mt-6">
        <MortgageAprCalculator />
      </TabsContent>
    </Tabs>
  );
}
