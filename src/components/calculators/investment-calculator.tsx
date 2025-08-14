
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Download } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { FinanceResultBox } from '@/components/finance-result-box';

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

// Financial formulas
const calcFV = (rate: number, nper: number, pmt: number, pv: number) => {
    if (rate === 0) return -(pv + pmt * nper);
    return pv * Math.pow(1 + rate, nper) + pmt * ((Math.pow(1 + rate, nper) - 1) / rate);
};
const calcPMT = (rate: number, nper: number, pv: number, fv: number) => {
    if (rate === 0) return -(pv + fv) / nper;
    return (fv - pv * Math.pow(1 + rate, nper)) * rate / (Math.pow(1 + rate, nper) - 1);
};
const calcPV = (rate: number, nper: number, pmt: number, fv: number) => {
    if (rate === 0) return -(fv + pmt * nper);
    return (pmt * (1 - Math.pow(1 + rate, -nper)) / rate - fv) / Math.pow(1 + rate, -nper);
};
const calcNPER = (rate: number, pmt: number, pv: number, fv: number) => {
    if (rate === 0) {
        if (pmt === 0) return NaN;
        return -(pv + fv) / pmt;
    }
    const logVal = (pmt - fv * rate) / (pmt + pv * rate);
    if (logVal <= 0 || (pmt + pv * rate) === 0) return NaN;
    return Math.log(logVal) / Math.log(1 + rate);
};
const calcRATE = (nper: number, pmt: number, pv: number, fv: number, guess = 0.005, max_iter = 100, tol = 1e-7) => {
    let rate = guess;
    for (let i = 0; i < max_iter; i++) {
        const fv_at_rate = pv * Math.pow(1 + rate, nper) + pmt * (Math.pow(1 + rate, nper) - 1) / rate - fv;
        const fv_deriv = nper * pv * Math.pow(1 + rate, nper - 1) + pmt * ((nper * rate * Math.pow(1 + rate, nper - 1) - (Math.pow(1 + rate, nper) - 1)) / (rate * rate));
        const new_rate = rate - fv_at_rate / fv_deriv;
        if (Math.abs(new_rate - rate) < tol) return new_rate * 12 * 100;
        rate = new_rate;
    }
    return NaN;
};

// --- Schemas ---
const baseSchema = {
    pv: z.number().min(0, "Cannot be negative"),
    fv: z.number().min(0, "Cannot be negative"),
    pmt: z.number().min(0, "Cannot be negative"),
    nper: z.number().int().min(1, "Must be at least 1 month"),
    rate: z.number().min(0, "Cannot be negative"),
};

const fvSchema = z.object({ ...baseSchema, pv: baseSchema.pv.optional(), pmt: baseSchema.pmt.optional(), nper: baseSchema.nper, rate: baseSchema.rate, fv: z.number().optional() });
const pmtSchema = z.object({ ...baseSchema, pv: baseSchema.pv.optional(), fv: baseSchema.fv, nper: baseSchema.nper, rate: baseSchema.rate, pmt: z.number().optional() });
const pvSchema = z.object({ ...baseSchema, fv: baseSchema.fv, pmt: baseSchema.pmt.optional(), nper: baseSchema.nper, rate: baseSchema.rate, pv: z.number().optional() });
const nperSchema = z.object({ ...baseSchema, pv: baseSchema.pv.optional(), pmt: baseSchema.pmt, fv: baseSchema.fv, rate: baseSchema.rate, nper: z.number().optional() });
const rateSchema = z.object({ ...baseSchema, pv: baseSchema.pv.optional(), pmt: baseSchema.pmt.optional(), fv: baseSchema.fv, nper: baseSchema.nper, rate: z.number().optional() });

type FormData = z.infer<typeof fvSchema>;

// --- Calculator Tab Component ---
function CalculatorTab({ solveFor }: { solveFor: 'fv' | 'pmt' | 'pv' | 'nper' | 'rate' }) {
    const [results, setResults] = useState<any>(null);
    const schemaMap = { fv: fvSchema, pmt: pmtSchema, pv: pvSchema, nper: nperSchema, rate: rateSchema };
    
    const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schemaMap[solveFor]),
        defaultValues: { pv: 10000, fv: 198290.40, pmt: 500, nper: 120, rate: 7 },
    });

    const calculate = (data: FormData) => {
        let res: number | string = 0;
        const { pv = 0, fv = 0, pmt = 0, nper = 0, rate = 0 } = data;
        const monthlyRate = rate / 100 / 12;

        try {
            switch (solveFor) {
                case 'fv': res = calcFV(monthlyRate, nper, pmt, pv); break;
                case 'pmt': res = calcPMT(monthlyRate, nper, pv, -fv); break;
                case 'pv': res = calcPV(monthlyRate, nper, pmt, -fv); break;
                case 'nper': res = calcNPER(monthlyRate, -pmt, pv, -fv); break;
                case 'rate': res = calcRATE(nper, pmt, pv, -fv); break;
            }
            if (typeof res === 'number' && isNaN(res)) throw new Error("Could not calculate. Check inputs for a valid scenario.");

            const startingAmount = solveFor === 'pv' ? Math.abs(res) : pv;
            const endBalance = solveFor === 'fv' ? Math.abs(res) : fv;
            const totalContributions = (solveFor === 'pmt' ? Math.abs(res) : pmt) * nper;
            const totalInterest = endBalance - startingAmount - totalContributions;

            setResults({
                ...data,
                solvedValue: res,
                endBalance,
                startingAmount,
                totalContributions,
                totalInterest,
                pieData: [
                  { name: 'Starting Amount', value: startingAmount },
                  { name: 'Total Contributions', value: totalContributions },
                  { name: 'Total Interest', value: totalInterest },
                ].filter(item => item.value > 0),
                error: null,
            });
        } catch (error: any) {
            setResults({ error: error.message });
        }
    };
    
    const handleExport = (format: 'txt' | 'csv') => {
        if (!results || results.error) return;
        let content = '';
        const filename = `investment-calc-${solveFor}.${format}`;
        if(format === 'txt') {
            content = `Investment Calculation (Solved for ${solveFor.toUpperCase()})\n\nInputs:\n${Object.entries(results).filter(([k]) => ['pv','fv','pmt','nper','rate'].includes(k)).map(([k,v]) => `- ${k.toUpperCase()}: ${v}`).join('\n')}\n\nResults:\n${Object.entries(results).filter(([k]) => !['pv','fv','pmt','nper','rate','error','pieData','solvedValue'].includes(k)).map(([k,v]) => `- ${k}: ${formatCurrency(v)}`).join('\n')}`
        } else {
             content = `Category,Value\n${Object.entries(results).filter(([k]) => ['pv','fv','pmt','nper','rate'].includes(k)).map(([k,v]) => `${k.toUpperCase()},${v}`).join('\n')}\n\nResult,Value\n${Object.entries(results).filter(([k]) => !['pv','fv','pmt','nper','rate','error','pieData','solvedValue'].includes(k)).map(([k,v]) => `${k},${v}`).join('\n')}`
        }
        const blob = new Blob([content], { type: `text/${format}` });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
    };

    return (
        <form onSubmit={handleSubmit(calculate)}>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <Card><CardContent className="p-4 space-y-4">
                <div><Label>Starting Amount ($)</Label><Controller name="pv" control={control} render={({ field }) => <Input type="number" {...field} disabled={solveFor === 'pv'} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                <div><Label>Additional Monthly Contribution ($)</Label><Controller name="pmt" control={control} render={({ field }) => <Input type="number" {...field} disabled={solveFor === 'pmt'} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                <div><Label>Investment Length (months)</Label><Controller name="nper" control={control} render={({ field }) => <Input type="number" {...field} disabled={solveFor === 'nper'} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />} /></div>
                <div><Label>Annual Return Rate (%)</Label><Controller name="rate" control={control} render={({ field }) => <Input type="number" step="any" {...field} disabled={solveFor === 'rate'} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                <div><Label>Target End Amount ($)</Label><Controller name="fv" control={control} render={({ field }) => <Input type="number" {...field} disabled={solveFor === 'fv'} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
              </CardContent></Card>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">Calculate</Button>
                <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" disabled={!results || results.error}><Download className="mr-2 h-4 w-4" /> Export</Button></DropdownMenuTrigger>
                    <DropdownMenuContent><DropdownMenuItem onClick={() => handleExport('txt')}>Download .txt</DropdownMenuItem><DropdownMenuItem onClick={() => handleExport('csv')}>Download .csv</DropdownMenuItem></DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="space-y-4">
                <h3 className="text-xl font-semibold">Results</h3>
                <FinanceResultBox results={results} solveFor={solveFor} />
            </div>
          </div>
        </form>
    );
}

// --- Main Component ---
export default function InvestmentCalculator() {
  return (
    <Tabs defaultValue="fv" className="w-full">
      <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
        <TabsTrigger value="fv">End Amount</TabsTrigger>
        <TabsTrigger value="pmt">Contribution</TabsTrigger>
        <TabsTrigger value="rate">Return Rate</TabsTrigger>
        <TabsTrigger value="pv">Starting Amount</TabsTrigger>
        <TabsTrigger value="nper">Investment Length</TabsTrigger>
      </TabsList>
      <TabsContent value="fv" className="mt-6"><CalculatorTab solveFor="fv" /></TabsContent>
      <TabsContent value="pmt" className="mt-6"><CalculatorTab solveFor="pmt" /></TabsContent>
      <TabsContent value="rate" className="mt-6"><CalculatorTab solveFor="rate" /></TabsContent>
      <TabsContent value="pv" className="mt-6"><CalculatorTab solveFor="pv" /></TabsContent>
      <TabsContent value="nper" className="mt-6"><CalculatorTab solveFor="nper" /></TabsContent>
    </Tabs>
  );
}
