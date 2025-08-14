
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Download, PieChart as PieChartIcon, Info } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from 'recharts';

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
const PIE_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))'];

// --- Tab 1: Fixed Rate (Solve for Monthly Payment) ---
const fixedRateSchema = z.object({
  assetValue: z.number().min(1, 'Asset value must be positive'),
  residualValue: z.number().min(0, 'Residual value must be non-negative'),
  leaseTermYears: z.number().int().min(0).default(0),
  leaseTermMonths: z.number().int().min(0).default(0),
  interestRate: z.number().min(0, 'Interest rate must be non-negative'),
}).refine(data => data.assetValue > data.residualValue, {
  message: "Asset value must be greater than residual value.",
  path: ['residualValue'],
}).refine(data => data.leaseTermYears > 0 || data.leaseTermMonths > 0, {
  message: "Lease term must be at least 1 month.",
  path: ['leaseTermMonths']
});
type FixedRateFormData = z.infer<typeof fixedRateSchema>;

function FixedRateCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FixedRateFormData | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FixedRateFormData>({
    resolver: zodResolver(fixedRateSchema),
    defaultValues: { assetValue: 20000, residualValue: 8000, leaseTermYears: 3, leaseTermMonths: 0, interestRate: 6 },
  });

  const calculatePayment = (data: FixedRateFormData) => {
    const { assetValue, residualValue, leaseTermYears, leaseTermMonths, interestRate } = data;
    const termInMonths = leaseTermYears * 12 + leaseTermMonths;
    const monthlyRate = interestRate / 100 / 12;

    const depreciation = assetValue - residualValue;
    const depreciationPayment = depreciation / termInMonths;
    
    // Simplified finance charge calculation
    const financeCharge = (assetValue + residualValue) * monthlyRate;
    const monthlyPayment = depreciationPayment + financeCharge;
    
    const totalPaid = monthlyPayment * termInMonths;
    const totalInterest = financeCharge * termInMonths;
    const totalPrincipal = depreciation;

    setResults({
      monthlyPayment,
      totalPaid,
      totalInterest,
      totalPrincipal,
      pieData: [{ name: 'Principal (Depreciation)', value: totalPrincipal }, { name: 'Interest', value: totalInterest }],
    });
    setFormData(data);
  };

  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    let content = '';
    const filename = `lease-fixed-rate-calc.${format}`;
    const { assetValue, residualValue, leaseTermYears, leaseTermMonths, interestRate } = formData;
    const leaseTerm = `${leaseTermYears}y ${leaseTermMonths}m`;
    
    if (format === 'txt') {
      content = `Lease Calculation (Fixed Rate)\n\nInputs:\n- Asset Value: ${formatCurrency(assetValue)}\n- Residual Value: ${formatCurrency(residualValue)}\n- Term: ${leaseTerm}\n- Rate: ${interestRate}%\n\nResult:\n- Monthly Payment: ${formatCurrency(results.monthlyPayment)}`;
    } else {
      content = `Asset Value,Residual Value,Term,Rate (%),Monthly Payment\n${assetValue},${residualValue},${leaseTerm},${interestRate},${results.monthlyPayment.toFixed(2)}`;
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
    <form onSubmit={handleSubmit(calculatePayment)} className="grid md:grid-cols-2 gap-8">
      <div className="space-y-4">
        <Card><CardContent className="p-4 space-y-4">
          <div><Label>Asset Value ($)</Label><Controller name="assetValue" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
          <div><Label>Residual Value ($)</Label><Controller name="residualValue" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
          {errors.residualValue && <p className="text-destructive text-sm mt-1">{errors.residualValue.message}</p>}</div>
          <div><Label>Lease Term</Label><div className="flex gap-2"><Controller name="leaseTermYears" control={control} render={({ field }) => <Input type="number" placeholder="Years" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />} /><Controller name="leaseTermMonths" control={control} render={({ field }) => <Input type="number" placeholder="Months" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />} /></div>
          {errors.leaseTermMonths && <p className="text-destructive text-sm mt-1">{errors.leaseTermMonths.message}</p>}</div>
          <div><Label>Interest Rate (%)</Label><Controller name="interestRate" control={control} render={({ field }) => <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
        </CardContent></Card>
        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Calculate</Button>
            <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" disabled={!results}><Download className="mr-2 h-4 w-4" /> Export</Button></DropdownMenuTrigger>
            <DropdownMenuContent><DropdownMenuItem onClick={() => handleExport('txt')}>Download .txt</DropdownMenuItem><DropdownMenuItem onClick={() => handleExport('csv')}>Download .csv</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
        </div>
      </div>
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Results</h3>
        {results ? (
            <div className="space-y-4">
              <Card><CardContent className="p-4 text-center"><p className="text-sm text-muted-foreground">Monthly Payment</p><p className="text-3xl font-bold">{formatCurrency(results.monthlyPayment)}</p></CardContent></Card>
              <Card><CardHeader><CardTitle className="text-base text-center">Cost Breakdown</CardTitle></CardHeader>
                <CardContent className="h-48"><ResponsiveContainer width="100%" height="100%">
                    <PieChart><Pie data={results.pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5}>
                        {results.pieData.map((_entry: any, index: number) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                    </Pie><RechartsTooltip formatter={(value: number) => formatCurrency(value)} /><Legend iconType="circle" /></PieChart>
                </ResponsiveContainer></CardContent>
              </Card>
            </div>
        ) : <div className="flex items-center justify-center h-full bg-muted/50 rounded-lg border border-dashed"><p className="text-sm text-muted-foreground">Enter details to calculate monthly payment</p></div>}
      </div>
    </form>
  )
}

// --- Tab 2: Fixed Pay (Solve for Interest Rate) ---
const fixedPaySchema = z.object({
  assetValue: z.number().min(1, 'Asset value must be positive'),
  residualValue: z.number().min(0, 'Residual value must be non-negative'),
  leaseTermYears: z.number().int().min(0).default(0),
  leaseTermMonths: z.number().int().min(0).default(0),
  monthlyPayment: z.number().min(1, 'Payment must be positive'),
}).refine(data => data.assetValue > data.residualValue, {
  message: "Asset value must be greater than residual value.",
  path: ['residualValue'],
}).refine(data => data.leaseTermYears > 0 || data.leaseTermMonths > 0, {
  message: "Lease term must be at least 1 month.",
  path: ['leaseTermMonths']
});
type FixedPayFormData = z.infer<typeof fixedPaySchema>;

function FixedPayCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FixedPayFormData | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FixedPayFormData>({
    resolver: zodResolver(fixedPaySchema),
    defaultValues: { assetValue: 20000, residualValue: 8000, leaseTermYears: 3, leaseTermMonths: 0, monthlyPayment: 400 },
  });

  const calculateRate = (data: FixedPayFormData) => {
    const { assetValue, residualValue, leaseTermYears, leaseTermMonths, monthlyPayment } = data;
    const termInMonths = leaseTermYears * 12 + leaseTermMonths;
    const depreciation = assetValue - residualValue;
    const depreciationPayment = depreciation / termInMonths;

    if (monthlyPayment <= depreciationPayment) {
        setResults({ error: "Monthly payment is too low to cover depreciation."});
        return;
    }

    const financeCharge = monthlyPayment - depreciationPayment;
    const rate = (financeCharge / (assetValue + residualValue)) * 12 * 100;
    
    const totalInterest = financeCharge * termInMonths;

    setResults({
        interestRate: rate.toFixed(2),
        totalInterest,
        totalPrincipal: depreciation,
        pieData: [{ name: 'Principal (Depreciation)', value: depreciation }, { name: 'Interest', value: totalInterest }],
        error: null,
    });
    setFormData(data);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || results.error || !formData) return;
    let content = '';
    const filename = `lease-fixed-pay-calc.${format}`;
    const { assetValue, residualValue, leaseTermYears, leaseTermMonths, monthlyPayment } = formData;
    const leaseTerm = `${leaseTermYears}y ${leaseTermMonths}m`;
    
    if (format === 'txt') {
      content = `Lease Calculation (Fixed Pay)\n\nInputs:\n- Asset Value: ${formatCurrency(assetValue)}\n- Residual Value: ${formatCurrency(residualValue)}\n- Term: ${leaseTerm}\n- Monthly Payment: ${formatCurrency(monthlyPayment)}\n\nResult:\n- Effective Interest Rate: ${results.interestRate}%`;
    } else {
      content = `Asset Value,Residual Value,Term,Monthly Payment,Interest Rate (%)\n${assetValue},${residualValue},${leaseTerm},${monthlyPayment},${results.interestRate}`;
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
    <form onSubmit={handleSubmit(calculateRate)} className="grid md:grid-cols-2 gap-8">
      <div className="space-y-4">
        <Card><CardContent className="p-4 space-y-4">
          <div><Label>Asset Value ($)</Label><Controller name="assetValue" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
          <div><Label>Residual Value ($)</Label><Controller name="residualValue" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
          {errors.residualValue && <p className="text-destructive text-sm mt-1">{errors.residualValue.message}</p>}</div>
          <div><Label>Lease Term</Label><div className="flex gap-2"><Controller name="leaseTermYears" control={control} render={({ field }) => <Input type="number" placeholder="Years" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />} /><Controller name="leaseTermMonths" control={control} render={({ field }) => <Input type="number" placeholder="Months" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />} /></div>
          {errors.leaseTermMonths && <p className="text-destructive text-sm mt-1">{errors.leaseTermMonths.message}</p>}</div>
          <div><Label>Monthly Payment ($)</Label><Controller name="monthlyPayment" control={control} render={({ field }) => <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
        </CardContent></Card>
        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Calculate</Button>
            <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" disabled={!results}><Download className="mr-2 h-4 w-4" /> Export</Button></DropdownMenuTrigger>
            <DropdownMenuContent><DropdownMenuItem onClick={() => handleExport('txt')}>Download .txt</DropdownMenuItem><DropdownMenuItem onClick={() => handleExport('csv')}>Download .csv</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
        </div>
      </div>
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Results</h3>
        {results ? (
            results.error ? <div className="flex items-center justify-center h-full bg-muted/50 rounded-lg border border-dashed"><p className="text-sm text-destructive">{results.error}</p></div> :
            <div className="space-y-4">
              <Card><CardContent className="p-4 text-center"><p className="text-sm text-muted-foreground">Effective Interest Rate</p><p className="text-3xl font-bold">{results.interestRate}%</p></CardContent></Card>
              <Card><CardHeader><CardTitle className="text-base text-center">Cost Breakdown</CardTitle></CardHeader>
                <CardContent className="h-48"><ResponsiveContainer width="100%" height="100%">
                    <PieChart><Pie data={results.pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5}>
                        {results.pieData.map((_entry: any, index: number) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                    </Pie><RechartsTooltip formatter={(value: number) => formatCurrency(value)} /><Legend iconType="circle" /></PieChart>
                </ResponsiveContainer></CardContent>
              </Card>
            </div>
        ) : <div className="flex items-center justify-center h-full bg-muted/50 rounded-lg border border-dashed"><p className="text-sm text-muted-foreground">Enter details to calculate interest rate</p></div>}
      </div>
    </form>
  )
}

export default function LeaseCalculator() {
  return (
    <Tabs defaultValue="fixed-rate" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="fixed-rate">Fixed Rate</TabsTrigger>
        <TabsTrigger value="fixed-pay">Fixed Pay</TabsTrigger>
      </TabsList>
      <TabsContent value="fixed-rate" className="mt-6">
        <FixedRateCalculator />
      </TabsContent>
      <TabsContent value="fixed-pay" className="mt-6">
        <FixedPayCalculator />
      </TabsContent>
    </Tabs>
  );
}
