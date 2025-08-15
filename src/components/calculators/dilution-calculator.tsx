"use client";

import { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Info, FlaskConical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';


const formatNumber = (num: number) => {
    if (Math.abs(num) < 1e-4 && num !== 0) {
        return num.toExponential(2);
    }
    return num.toLocaleString(undefined, { maximumFractionDigits: 4 });
}
const PIE_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))'];

// --- UNIT CONVERSION LOGIC ---
const volumeFactors: { [key: string]: number } = { L: 1, mL: 1e-3, uL: 1e-6 };
const concentrationFactors: { [key: string]: number } = { M: 1, mM: 1e-3, uM: 1e-6 };

const convertToBaseUnits = (value: number, unit: string) => {
    return value * (volumeFactors[unit] || concentrationFactors[unit] || 1);
};
const convertFromBaseUnits = (value: number, unit: string) => {
    return value / (volumeFactors[unit] || concentrationFactors[unit] || 1);
};

// --- SINGLE DILUTION CALCULATOR ---
const singleDilutionSchema = z.object({
  c1: z.number().min(0),
  c1Unit: z.string(),
  v2: z.number().min(0),
  v2Unit: z.string(),
  c2: z.number().min(0),
  c2Unit: z.string(),
}).refine(data => convertToBaseUnits(data.c1, data.c1Unit) > convertToBaseUnits(data.c2, data.c2Unit), {
    message: "Stock concentration must be greater than final concentration.",
    path: ['c1'],
});
type SingleDilutionFormData = z.infer<typeof singleDilutionSchema>;

function SingleDilutionCalculator() {
    const [results, setResults] = useState<any>(null);
    const { control, handleSubmit, formState: { errors } } = useForm<SingleDilutionFormData>({
        resolver: zodResolver(singleDilutionSchema),
        defaultValues: { c1: 10, c1Unit: 'mM', v2: 100, v2Unit: 'mL', c2: 500, c2Unit: 'uM' },
    });

    const calculate = (data: SingleDilutionFormData) => {
        const c1_base = convertToBaseUnits(data.c1, data.c1Unit);
        const c2_base = convertToBaseUnits(data.c2, data.c2Unit);
        const v2_base = convertToBaseUnits(data.v2, data.v2Unit);

        const v1_base = (c2_base * v2_base) / c1_base;
        const solvent_base = v2_base - v1_base;

        setResults({
            v1: convertFromBaseUnits(v1_base, data.v2Unit),
            solvent: convertFromBaseUnits(solvent_base, data.v2Unit),
            pieData: [{ name: 'Stock Solution', value: v1_base }, { name: 'Solvent', value: solvent_base }]
        });
    };

    return (
        <form onSubmit={handleSubmit(calculate)} className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
                <Card>
                    <CardHeader><CardTitle>Dilution Parameters</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <h4 className="font-semibold">Stock Solution (C1)</h4>
                        <div className="flex gap-2 items-end"><Controller name="c1" control={control} render={({ field }) => <Input type="number" step="any" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /><Controller name="c1Unit" control={control} render={({ field }) => ( <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.keys(concentrationFactors).map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent></Select> )} /></div>
                         {errors.c1 && <p className="text-destructive text-sm">{errors.c1.message}</p>}
                        
                        <h4 className="font-semibold pt-4">Final Solution (C2, V2)</h4>
                        <div className="flex gap-2 items-end"><Controller name="c2" control={control} render={({ field }) => <Input type="number" step="any" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /><Controller name="c2Unit" control={control} render={({ field }) => ( <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.keys(concentrationFactors).map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent></Select> )} /></div>
                        <div className="flex gap-2 items-end"><Controller name="v2" control={control} render={({ field }) => <Input type="number" step="any" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /><Controller name="v2Unit" control={control} render={({ field }) => ( <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.keys(volumeFactors).map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent></Select> )} /></div>
                        <Button type="submit" className="w-full !mt-6">Calculate</Button>
                    </CardContent>
                </Card>
            </div>
            <div className="space-y-4">
                <h3 className="text-xl font-semibold">Results</h3>
                {results ? (
                    <div className="space-y-4">
                         <Alert><Info className="h-4 w-4" /><AlertDescription>To make <strong>{control._getWatch('v2')} {control._getWatch('v2Unit')}</strong> of your final solution, combine <strong>{formatNumber(results.v1)} {control._getWatch('v2Unit')}</strong> of the stock solution with <strong>{formatNumber(results.solvent)} {control._getWatch('v2Unit')}</strong> of solvent.</AlertDescription></Alert>
                         <Card><CardHeader><CardTitle className="text-base text-center">Volume Breakdown</CardTitle></CardHeader>
                            <CardContent className="h-48">
                                <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={results.pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5}>{results.pieData.map((_entry: any, index: number) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}</Pie><Tooltip formatter={(value: number) => `${convertFromBaseUnits(value, control._getWatch('v2Unit')).toFixed(3)} ${control._getWatch('v2Unit')}`} /><Legend iconType="circle" /></PieChart></ResponsiveContainer>
                            </CardContent>
                          </Card>
                    </div>
                ) : (<div className="flex items-center justify-center h-full bg-muted/50 rounded-lg border border-dashed"><p className="text-sm text-muted-foreground p-4 text-center">Enter concentrations and final volume to calculate.</p></div>)}
            </div>
        </form>
    );
}

// --- SERIAL DILUTION CALCULATOR ---
const serialDilutionSchema = z.object({
  startConcentration: z.number().min(0),
  startConcentrationUnit: z.string(),
  dilutionFactor: z.number().gt(1, 'Factor must be > 1'),
  numSteps: z.number().int().min(1).max(20),
  finalVolume: z.number().gt(0),
  finalVolumeUnit: z.string(),
});
type SerialDilutionFormData = z.infer<typeof serialDilutionSchema>;

function SerialDilutionCalculator() {
    const [results, setResults] = useState<any>(null);
    const { control, handleSubmit } = useForm<SerialDilutionFormData>({
        resolver: zodResolver(serialDilutionSchema),
        defaultValues: { startConcentration: 10, startConcentrationUnit: 'M', dilutionFactor: 10, numSteps: 8, finalVolume: 100, finalVolumeUnit: 'uL' },
    });

    const calculate = (data: SerialDilutionFormData) => {
        const { startConcentration, dilutionFactor, numSteps, finalVolume, finalVolumeUnit } = data;
        
        const transferVolume = finalVolume / dilutionFactor;
        const solventVolume = finalVolume - transferVolume;

        const tableData = [];
        let currentConcentration = startConcentration;

        for (let i = 1; i <= numSteps; i++) {
            currentConcentration /= dilutionFactor;
            tableData.push({
                step: i,
                concentration: currentConcentration,
            });
        }
        
        setResults({ transferVolume, solventVolume, tableData, finalVolumeUnit });
    };

    return (
        <form onSubmit={handleSubmit(calculate)} className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
                <Card>
                    <CardHeader><CardTitle>Serial Dilution Parameters</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div><Label>Starting Concentration</Label><div className="flex gap-2 items-end"><Controller name="startConcentration" control={control} render={({ field }) => <Input type="number" step="any" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /><Controller name="startConcentrationUnit" control={control} render={({ field }) => ( <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.keys(concentrationFactors).map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent></Select> )} /></div></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><Label>Dilution Factor (e.g., 10)</Label><Controller name="dilutionFactor" control={control} render={({ field }) => <Input type="number" step="any" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                            <div><Label>Number of Steps</Label><Controller name="numSteps" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />} /></div>
                        </div>
                        <div><Label>Final Volume per Step</Label><div className="flex gap-2 items-end"><Controller name="finalVolume" control={control} render={({ field }) => <Input type="number" step="any" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /><Controller name="finalVolumeUnit" control={control} render={({ field }) => ( <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.keys(volumeFactors).map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent></Select> )} /></div></div>
                        <Button type="submit" className="w-full !mt-6">Calculate</Button>
                    </CardContent>
                </Card>
            </div>
             <div className="space-y-4">
                <h3 className="text-xl font-semibold">Results</h3>
                {results ? (
                    <div className="space-y-4">
                         <Alert><FlaskConical className="h-4 w-4" /><AlertDescription>For each step, add <strong>{formatNumber(results.solventVolume)} {results.finalVolumeUnit}</strong> of solvent, then transfer <strong>{formatNumber(results.transferVolume)} {results.finalVolumeUnit}</strong> from the previous tube.</AlertDescription></Alert>
                        <Card><CardHeader><CardTitle className="text-base text-center">Concentration Curve</CardTitle></CardHeader>
                        <CardContent className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={results.tableData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="step" label={{ value: "Dilution Step", position: "insideBottom", offset: -5 }} />
                                    <YAxis type="number" domain={['auto', 'auto']} scale="log" tickFormatter={(tick) => tick.toExponential(0)} />
                                    <Tooltip formatter={(value: number) => formatNumber(value)} />
                                    <Line type="monotone" dataKey="concentration" name="Concentration" stroke="hsl(var(--primary))" dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    </div>
                ) : (<div className="flex items-center justify-center h-full bg-muted/50 rounded-lg border border-dashed"><p className="text-sm text-muted-foreground p-4 text-center">Enter dilution parameters to generate a schedule.</p></div>)}
            </div>
             {results && (
                <div className="md:col-span-2 mt-4">
                    <h3 className="text-xl font-semibold mb-4">Dilution Table</h3>
                    <Card><CardContent className="p-0">
                        <ScrollArea className="h-64">
                            <Table><TableHeader className="sticky top-0 bg-muted"><TableRow><TableHead>Step</TableHead><TableHead className="text-right">Concentration ({control._getWatch('startConcentrationUnit')})</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {results.tableData.map((row: any) => (
                                        <TableRow key={row.step}><TableCell>{row.step}</TableCell><TableCell className="text-right">{formatNumber(row.concentration)}</TableCell></TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </CardContent></Card>
                </div>
            )}
        </form>
    )
}


// --- MAIN COMPONENT ---
export default function DilutionCalculator() {
  return (
    <Tabs defaultValue="single" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="single">Single Dilution</TabsTrigger>
        <TabsTrigger value="serial">Serial Dilution</TabsTrigger>
      </TabsList>
      <TabsContent value="single" className="mt-6">
        <SingleDilutionCalculator />
      </TabsContent>
      <TabsContent value="serial" className="mt-6">
        <SerialDilutionCalculator />
      </TabsContent>
    </Tabs>
  );
}
