
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
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

// --- Lump Sum vs Monthly ---
const lumpSumSchema = z.object({
  retirementAge: z.number().int().min(18),
  lifeExpectancy: z.number().int().min(19),
  lumpSumAmount: z.number().min(0),
  investmentReturn: z.number().min(0),
  monthlyPension: z.number().min(0),
  cola: z.number().min(0),
}).refine(data => data.lifeExpectancy > data.retirementAge, {
  message: "Life expectancy must be after retirement age.",
  path: ["lifeExpectancy"],
});
type LumpSumFormData = z.infer<typeof lumpSumSchema>;

function LumpSumCalculator() {
    const [results, setResults] = useState<any>(null);
    const [formData, setFormData] = useState<LumpSumFormData | null>(null);
    const { control, handleSubmit, formState: { errors } } = useForm<LumpSumFormData>({
        resolver: zodResolver(lumpSumSchema),
        defaultValues: { retirementAge: 65, lifeExpectancy: 90, lumpSumAmount: 500000, investmentReturn: 5, monthlyPension: 2500, cola: 2 },
    });

    const calculateComparison = (data: LumpSumFormData) => {
        const n = (data.lifeExpectancy - data.retirementAge) * 12;
        const i = data.investmentReturn / 100 / 12;
        const g = data.cola / 100 / 12;
        let presentValue = 0;
        if (i === g) {
            presentValue = data.monthlyPension * n / (1 + i);
        } else {
            presentValue = data.monthlyPension * (1 - Math.pow((1 + g) / (1 + i), n)) / (i - g);
        }
        setResults({ lumpSumAmount: data.lumpSumAmount, presentValueOfPension: presentValue, difference: presentValue - data.lumpSumAmount });
        setFormData(data);
    };
    
    const handleExport = (format: 'txt' | 'csv') => {
        if (!results || !formData) return;
        let content = '';
        const filename = `pension-lump-sum-comparison.${format}`;
        if (format === 'txt') {
            content = `Pension Comparison\n\nInputs:\n${Object.entries(formData).map(([k,v]) => `- ${k}: ${v}`).join('\n')}\n\nResults:\n- Lump Sum Value: ${formatCurrency(results.lumpSumAmount)}\n- PV of Pension: ${formatCurrency(results.presentValueOfPension)}\n- Difference: ${formatCurrency(results.difference)}`;
        } else {
            content = `Category,Value\n${Object.entries(formData).map(([k,v]) => `${k},${v}`).join('\n')}\nResult Category,Value\nLump Sum Value,${results.lumpSumAmount}\nPV of Pension,${results.presentValueOfPension}\nDifference,${results.difference}`;
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
        <form onSubmit={handleSubmit(calculateComparison)} className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
                <Card><CardHeader><CardTitle>Pension Payout Comparison</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div><Label>Retirement Age</Label><Controller name="retirementAge" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />} /></div>
                            <div><Label>Life Expectancy</Label><Controller name="lifeExpectancy" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />} /></div>
                        </div>
                        {errors.lifeExpectancy && <p className="text-destructive text-sm mt-1">{errors.lifeExpectancy.message}</p>}
                        <h4 className="font-semibold text-lg pt-4">Option 1: Lump Sum</h4>
                        <div><Label>Lump Sum Payout ($)</Label><Controller name="lumpSumAmount" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                        <div><Label>Expected Investment Return (%)</Label><Controller name="investmentReturn" control={control} render={({ field }) => <Input type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                        <h4 className="font-semibold text-lg pt-4">Option 2: Monthly Pension</h4>
                        <div><Label>Monthly Pension ($)</Label><Controller name="monthlyPension" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                        <div><Label>Cost-of-Living Adjustment (%)</Label><Controller name="cola" control={control} render={({ field }) => <Input type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                        <div className="flex gap-2 pt-4">
                            <Button type="submit" className="flex-1">Compare</Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="outline" disabled={!results}><Download className="mr-2 h-4 w-4" /> Export</Button></DropdownMenuTrigger>
                                <DropdownMenuContent><DropdownMenuItem onClick={() => handleExport('txt')}>Download .txt</DropdownMenuItem><DropdownMenuItem onClick={() => handleExport('csv')}>Download .csv</DropdownMenuItem></DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="space-y-4">
                <h3 className="text-xl font-semibold">Comparison Result</h3>
                {results ? (
                    <div className="space-y-4">
                        <Alert variant={results.difference > 0 ? "default" : "destructive"} className={results.difference > 0 ? "border-green-500" : ""}>
                            <Info className="h-4 w-4" />
                            <AlertTitle>{results.difference > 0 ? "Monthly Pension Appears More Valuable" : "Lump Sum Appears More Valuable"}</AlertTitle>
                            <AlertDescription>The present value of the monthly pension is {formatCurrency(Math.abs(results.difference))} {results.difference > 0 ? 'more' : 'less'} than the lump sum.</AlertDescription>
                        </Alert>
                        <Card><CardContent className="p-4 grid grid-cols-2 gap-4 text-center">
                            <div><p className="text-muted-foreground">Lump Sum Value</p><p className="font-semibold text-xl">{formatCurrency(results.lumpSumAmount)}</p></div>
                            <div><p className="text-muted-foreground">Pension Present Value</p><p className="font-semibold text-xl">{formatCurrency(results.presentValueOfPension)}</p></div>
                        </CardContent></Card>
                    </div>
                ) : ( <div className="flex items-center justify-center h-60 bg-muted/50 rounded-lg border border-dashed"><p className="text-sm text-muted-foreground">Enter details to compare pension options</p></div> )}
            </div>
        </form>
    );
}

// --- Single vs Joint Life ---
function SingleVsJointCalculator() {
    return <Card className="p-8 text-center"><p className="text-muted-foreground">This feature is coming soon.</p></Card>;
}

// --- Work Longer ---
function WorkLongerCalculator() {
    return <Card className="p-8 text-center"><p className="text-muted-foreground">This feature is coming soon.</p></Card>;
}

export default function PensionCalculator() {
  return (
    <Tabs defaultValue="lump-sum-vs-monthly" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="lump-sum-vs-monthly">Lump Sum vs. Monthly</TabsTrigger>
        <TabsTrigger value="single-vs-joint">Single vs. Joint Life</TabsTrigger>
        <TabsTrigger value="work-longer">Work Longer</TabsTrigger>
      </TabsList>
      <TabsContent value="lump-sum-vs-monthly" className="mt-6">
        <LumpSumCalculator />
      </TabsContent>
      <TabsContent value="single-vs-joint" className="mt-6">
        <SingleVsJointCalculator />
      </TabsContent>
      <TabsContent value="work-longer" className="mt-6">
        <WorkLongerCalculator />
      </TabsContent>
    </Tabs>
  );
}
