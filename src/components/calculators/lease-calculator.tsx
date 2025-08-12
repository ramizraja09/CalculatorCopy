
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
  msrp: z.number().min(1, 'MSRP is required'),
  negotiatedPrice: z.number().min(1, 'Negotiated price is required'),
  leaseTerm: z.number().int().min(1, 'Lease term is required'),
  residualValuePercent: z.number().min(0).max(100, 'Residual value must be between 0-100'),
  moneyFactor: z.number().min(0, 'Money factor must be non-negative'),
  downPayment: z.number().min(0, 'Down payment must be non-negative'),
  salesTaxRate: z.number().min(0, 'Sales tax must be non-negative'),
});

type FormData = z.infer<typeof formSchema>;

export default function LeaseCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      msrp: 30000,
      negotiatedPrice: 28000,
      leaseTerm: 36,
      residualValuePercent: 60,
      moneyFactor: 0.0025, // Equivalent to 6% APR
      downPayment: 2000,
      salesTaxRate: 7,
    },
  });

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const calculateLease = (data: FormData) => {
    const { 
        negotiatedPrice, 
        leaseTerm, 
        residualValuePercent, 
        moneyFactor,
        downPayment,
        salesTaxRate,
        msrp
    } = data;

    const capCost = negotiatedPrice - downPayment;
    const residualValue = msrp * (residualValuePercent / 100);
    
    const depreciationFee = (capCost - residualValue) / leaseTerm;
    const financeFee = (capCost + residualValue) * moneyFactor;
    
    const baseMonthlyPayment = depreciationFee + financeFee;
    const taxOnPayment = baseMonthlyPayment * (salesTaxRate / 100);
    const totalMonthlyPayment = baseMonthlyPayment + taxOnPayment;

    const totalLeaseCost = (totalMonthlyPayment * leaseTerm) + downPayment;

    setResults({
        baseMonthlyPayment,
        taxOnPayment,
        totalMonthlyPayment,
        depreciationFee,
        financeFee,
        totalLeaseCost,
    });
    setFormData(data);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `lease-calculation.${format}`;
    const { msrp, negotiatedPrice, leaseTerm, residualValuePercent, moneyFactor, downPayment, salesTaxRate } = formData;

    if (format === 'txt') {
      content = `Lease Calculation\n\nInputs:\n`;
      content += `- MSRP: ${formatCurrency(msrp)}\n- Negotiated Price: ${formatCurrency(negotiatedPrice)}\n- Lease Term: ${leaseTerm} months\n`;
      content += `- Residual Value: ${residualValuePercent}%\n- Money Factor: ${moneyFactor}\n- Down Payment: ${formatCurrency(downPayment)}\n- Sales Tax Rate: ${salesTaxRate}%\n\n`;
      content += `Results:\n- Estimated Monthly Payment: ${formatCurrency(results.totalMonthlyPayment)}\n- Total Lease Cost: ${formatCurrency(results.totalLeaseCost)}\n`;
    } else {
      content = 'Category,Value\n';
      content += `MSRP,${msrp}\nNegotiated Price,${negotiatedPrice}\nLease Term (months),${leaseTerm}\n`;
      content += `Residual Value (%),${residualValuePercent}\nMoney Factor,${moneyFactor}\nDown Payment,${downPayment}\nSales Tax Rate (%),${salesTaxRate}\n\n`;
      content += 'Result Category,Value\n';
      content += `Estimated Monthly Payment,${results.totalMonthlyPayment.toFixed(2)}\nTotal Lease Cost,${results.totalLeaseCost.toFixed(2)}\n`;
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
    <form onSubmit={handleSubmit(calculateLease)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Vehicle & Lease Terms</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div><Label>MSRP ($)</Label><Controller name="msrp" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                <div><Label>Negotiated Price ($)</Label><Controller name="negotiatedPrice" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                <div><Label>Lease Term (Months)</Label><Controller name="leaseTerm" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
                <div><Label>Residual Value (%)</Label><Controller name="residualValuePercent" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                <div><Label>Money Factor</Label><Controller name="moneyFactor" control={control} render={({ field }) => <Input type="number" step="0.0001" placeholder="e.g. 0.0025" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
            </CardContent>
          </Card>
          <Card>
             <CardHeader><CardTitle>Payments & Taxes</CardTitle></CardHeader>
             <CardContent className="space-y-4">
                <div><Label>Down Payment ($)</Label><Controller name="downPayment" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                <div><Label>Sales Tax Rate (%)</Label><Controller name="salesTaxRate" control={control} render={({ field }) => <Input type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
             </CardContent>
          </Card>
        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Calculate Lease Payment</Button>
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
        <h3 className="text-xl font-semibold">Lease Estimate</h3>
        {results ? (
          <div className="space-y-4">
            <Card>
                <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">Estimated Monthly Payment</p>
                    <p className="text-3xl font-bold">{formatCurrency(results.totalMonthlyPayment)}</p>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="p-4 space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Base Payment</span><span>{formatCurrency(results.baseMonthlyPayment)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Monthly Tax</span><span>{formatCurrency(results.taxOnPayment)}</span></div>
                    <hr className="my-1"/>
                    <div className="flex justify-between"><span className="text-muted-foreground">Depreciation</span><span>{formatCurrency(results.depreciationFee)}/mo</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Finance Charge</span><span>{formatCurrency(results.financeFee)}/mo</span></div>
                    <hr className="my-1"/>
                    <div className="flex justify-between font-bold"><span className="text-foreground">Total Lease Cost</span><span>{formatCurrency(results.totalLeaseCost)}</span></div>
                </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex items-center justify-center h-60 bg-muted/50 rounded-lg border border-dashed">
            <p className="text-sm text-muted-foreground">Enter lease details to see payment</p>
          </div>
        )}
      </div>
    </form>
  );
}
