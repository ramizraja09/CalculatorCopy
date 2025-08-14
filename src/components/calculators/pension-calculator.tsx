
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

// --- Tab 1: Lump Sum vs Monthly ---
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

// --- Tab 2: Single vs Joint Life ---
const jointLifeSchema = z.object({
  retirementAge: z.number().int().min(18),
  lifeExpectancy: z.number().int().min(19),
  spouseAge: z.number().int().min(18),
  spouseLifeExpectancy: z.number().int().min(19),
  singleLifePension: z.number().min(1),
  jointSurvivorPension: z.number().min(1),
  investmentReturn: z.number().min(0),
  cola: z.number().min(0),
}).refine(data => data.lifeExpectancy > data.retirementAge, {
  message: "Life expectancy must be after retirement age.",
  path: ["lifeExpectancy"],
}).refine(data => data.spouseLifeExpectancy > data.spouseAge, {
    message: "Spouse life expectancy must be after their age.",
    path: ["spouseLifeExpectancy"],
});
type JointLifeFormData = z.infer<typeof jointLifeSchema>;

function SingleVsJointCalculator() {
    const [results, setResults] = useState<any>(null);
    const [formData, setFormData] = useState<JointLifeFormData | null>(null);

    const { control, handleSubmit, formState: { errors } } = useForm<JointLifeFormData>({
        resolver: zodResolver(jointLifeSchema),
        defaultValues: {
            retirementAge: 65,
            lifeExpectancy: 77,
            spouseAge: 62,
            spouseLifeExpectancy: 82,
            singleLifePension: 5000,
            jointSurvivorPension: 3000,
            investmentReturn: 5,
            cola: 3.5,
        },
    });

    const calculatePV = (monthlyPayment: number, years: number, monthlyRate: number, monthlyCola: number) => {
        const n = years * 12;
        if (monthlyRate === monthlyCola) {
            return monthlyPayment * n / (1 + monthlyRate);
        }
        return monthlyPayment * (1 - Math.pow((1 + monthlyCola) / (1 + monthlyRate), n)) / (monthlyRate - monthlyCola);
    };

    const calculateComparison = (data: JointLifeFormData) => {
        const i = data.investmentReturn / 100 / 12;
        const g = data.cola / 100 / 12;

        const singleLifeYears = data.lifeExpectancy - data.retirementAge;
        const pvSingle = calculatePV(data.singleLifePension, singleLifeYears, i, g);

        const jointYears = data.spouseLifeExpectancy - data.retirementAge;
        const pvJoint = calculatePV(data.jointSurvivorPension, jointYears, i, g);

        setResults({
            pvSingle,
            pvJoint,
            difference: pvJoint - pvSingle,
        });
        setFormData(data);
    };
    
    const handleExport = (format: 'txt' | 'csv') => {
        if (!results || !formData) return;
        let content = '';
        const filename = `pension-joint-life-comparison.${format}`;
        if (format === 'txt') {
            content = `Pension Comparison\n\nInputs:\n${Object.entries(formData).map(([k,v]) => `- ${k}: ${v}`).join('\n')}\n\nResults:\n- PV of Single Life Pension: ${formatCurrency(results.pvSingle)}\n- PV of Joint Pension: ${formatCurrency(results.pvJoint)}\n- Difference: ${formatCurrency(results.difference)}`;
        } else {
            content = `Category,Value\n${Object.entries(formData).map(([k,v]) => `${k},${v}`).join('\n')}\nResult Category,Value\nPV of Single Life Pension,${results.pvSingle}\nPV of Joint Pension,${results.pvJoint}\nDifference,${results.difference}`;
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
                 <Card><CardHeader><CardTitle>Single-life or Joint-and-survivor Payout?</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div><Label>Your retirement age</Label><Controller name="retirementAge" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />} /></div>
                            <div><Label>Your life expectancy</Label><Controller name="lifeExpectancy" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />} /></div>
                        </div>
                        {errors.lifeExpectancy && <p className="text-destructive text-sm mt-1">{errors.lifeExpectancy.message}</p>}
                        <div className="grid grid-cols-2 gap-4">
                             <div><Label>Spouse's age when you retire</Label><Controller name="spouseAge" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />} /></div>
                            <div><Label>Spouse's life expectancy</Label><Controller name="spouseLifeExpectancy" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />} /></div>
                        </div>
                        {errors.spouseLifeExpectancy && <p className="text-destructive text-sm mt-1">{errors.spouseLifeExpectancy.message}</p>}
                        <div className="grid grid-cols-2 gap-4 items-center">
                            <Label>Single life pension</Label>
                            <div className="flex items-center gap-2"><Controller name="singleLifePension" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /><span className="text-sm text-muted-foreground">/month</span></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 items-center">
                            <Label>Joint survivor pension</Label>
                             <div className="flex items-center gap-2"><Controller name="jointSurvivorPension" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /><span className="text-sm text-muted-foreground">/month</span></div>
                        </div>
                         <div className="grid grid-cols-2 gap-4 items-center">
                            <Label>Your investment return</Label>
                             <div className="flex items-center gap-2"><Controller name="investmentReturn" control={control} render={({ field }) => <Input type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /><span className="text-sm text-muted-foreground">%/year</span></div>
                        </div>
                         <div className="grid grid-cols-2 gap-4 items-center">
                            <Label>Cost-of-living adjustment</Label>
                            <div className="flex items-center gap-2"><Controller name="cola" control={control} render={({ field }) => <Input type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /><span className="text-sm text-muted-foreground">%/year</span></div>
                        </div>

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
                            <AlertTitle>{results.difference > 0 ? "Joint Pension Appears More Valuable" : "Single Life Pension Appears More Valuable"}</AlertTitle>
                            <AlertDescription>The present value of the joint pension is {formatCurrency(Math.abs(results.difference))} {results.difference > 0 ? 'more' : 'less'} than the single life pension.</AlertDescription>
                        </Alert>
                        <Card><CardContent className="p-4 grid grid-cols-2 gap-4 text-center">
                            <div><p className="text-muted-foreground">PV of Single Life Pension</p><p className="font-semibold text-xl">{formatCurrency(results.pvSingle)}</p></div>
                            <div><p className="text-muted-foreground">PV of Joint Pension</p><p className="font-semibold text-xl">{formatCurrency(results.pvJoint)}</p></div>
                        </CardContent></Card>
                    </div>
                ) : ( <div className="flex items-center justify-center h-60 bg-muted/50 rounded-lg border border-dashed"><p className="text-sm text-muted-foreground">Enter details to compare pension options</p></div> )}
            </div>
        </form>
    );
}

// --- Tab 3: Work Longer ---
const workLongerSchema = z.object({
  lifeExpectancy: z.number().int().min(1),
  retirementAge1: z.number().int().min(18),
  monthlyPension1: z.number().min(1),
  retirementAge2: z.number().int().min(19),
  monthlyPension2: z.number().min(1),
  investmentReturn: z.number().min(0),
  cola: z.number().min(0),
}).refine(data => data.retirementAge2 > data.retirementAge1, {
  message: "Option 2 retirement age must be after Option 1.",
  path: ["retirementAge2"],
});

type WorkLongerFormData = z.infer<typeof workLongerSchema>;

function WorkLongerCalculator() {
    const [results, setResults] = useState<any>(null);
    const [formData, setFormData] = useState<WorkLongerFormData | null>(null);

    const { control, handleSubmit, formState: { errors } } = useForm<WorkLongerFormData>({
        resolver: zodResolver(workLongerSchema),
        defaultValues: {
            lifeExpectancy: 85,
            retirementAge1: 60,
            monthlyPension1: 2500,
            retirementAge2: 65,
            monthlyPension2: 3800,
            investmentReturn: 5,
            cola: 3.5,
        },
    });

    const calculatePV = (monthlyPayment: number, years: number, monthlyRate: number, monthlyCola: number) => {
        const n = years * 12;
        if (monthlyRate === monthlyCola) {
            return monthlyPayment * n / (1 + monthlyRate);
        }
        return monthlyPayment * (1 - Math.pow((1 + monthlyCola) / (1 + monthlyRate), n)) / (monthlyRate - monthlyCola);
    };

    const calculateComparison = (data: WorkLongerFormData) => {
        const i = data.investmentReturn / 100 / 12;
        const g = data.cola / 100 / 12;

        const pv1 = calculatePV(data.monthlyPension1, data.lifeExpectancy - data.retirementAge1, i, g);

        const workingYearsValue = calculatePV(data.monthlyPension1, data.retirementAge2 - data.retirementAge1, i, g);
        
        const pv2_from_retirement2 = calculatePV(data.monthlyPension2, data.lifeExpectancy - data.retirementAge2, i, g);
        
        const pv2 = workingYearsValue + pv2_from_retirement2 / Math.pow(1 + i, (data.retirementAge2 - data.retirementAge1) * 12);

        setResults({
            pv1,
            pv2,
            difference: pv2 - pv1,
        });
        setFormData(data);
    };
    
    const handleExport = (format: 'txt' | 'csv') => {
        if (!results || !formData) return;
        let content = '';
        const filename = `pension-work-longer-comparison.${format}`;
        if (format === 'txt') {
            content = `Pension Comparison\n\nInputs:\n${Object.entries(formData).map(([k,v]) => `- ${k}: ${v}`).join('\n')}\n\nResults:\n- PV of Option 1: ${formatCurrency(results.pv1)}\n- PV of Option 2: ${formatCurrency(results.pv2)}\n- Difference: ${formatCurrency(results.difference)}`;
        } else {
            content = `Category,Value\n${Object.entries(formData).map(([k,v]) => `${k},${v}`).join('\n')}\nResult Category,Value\nPV Option 1,${results.pv1}\nPV Option 2,${results.pv2}\nDifference,${results.difference}`;
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
                <Card>
                    <CardHeader><CardTitle>Should you work longer for a better pension?</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <h4 className="font-semibold text-lg pt-4">Pension option 1</h4>
                        <div><Label>Retirement age</Label><Controller name="retirementAge1" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />} /></div>
                        <div><Label>Monthly pension income ($)</Label><Controller name="monthlyPension1" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                        <h4 className="font-semibold text-lg pt-4">Pension option 2 (work longer)</h4>
                        <div><Label>Retirement age</Label><Controller name="retirementAge2" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />} /></div>
                        {errors.retirementAge2 && <p className="text-destructive text-sm mt-1">{errors.retirementAge2.message}</p>}
                        <div><Label>Monthly pension income ($)</Label><Controller name="monthlyPension2" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                         <h4 className="font-semibold text-lg pt-4">Other information</h4>
                        <div><Label>Your life expectancy</Label><Controller name="lifeExpectancy" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />} /></div>
                        <div><Label>Your investment return (% per year)</Label><Controller name="investmentReturn" control={control} render={({ field }) => <Input type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                        <div><Label>Cost-of-living adjustment (% per year)</Label><Controller name="cola" control={control} render={({ field }) => <Input type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>

                        <div className="flex gap-2 pt-4">
                            <Button type="submit" className="flex-1">Calculate</Button>
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
                            <AlertTitle>{results.difference > 0 ? "Working Longer Appears More Valuable" : "Retiring Earlier Appears More Valuable"}</AlertTitle>
                            <AlertDescription>The present value of working longer is {formatCurrency(Math.abs(results.difference))} {results.difference > 0 ? 'more' : 'less'} than retiring earlier.</AlertDescription>
                        </Alert>
                        <Card><CardContent className="p-4 grid grid-cols-2 gap-4 text-center">
                            <div><p className="text-muted-foreground">PV of Option 1</p><p className="font-semibold text-xl">{formatCurrency(results.pv1)}</p></div>
                            <div><p className="text-muted-foreground">PV of Option 2</p><p className="font-semibold text-xl">{formatCurrency(results.pv2)}</p></div>
                        </CardContent></Card>
                    </div>
                ) : ( <div className="flex items-center justify-center h-60 bg-muted/50 rounded-lg border border-dashed"><p className="text-sm text-muted-foreground">Enter details to compare pension options</p></div> )}
            </div>
        </form>
    );
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
