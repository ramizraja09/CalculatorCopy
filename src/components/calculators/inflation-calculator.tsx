
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


// Simplified Consumer Price Index (CPI) data for demonstration.
const cpiData: { [year: number]: number } = {
  2023: 304.702, 2022: 292.655, 2021: 270.970, 2020: 258.811,
  2019: 255.657, 2018: 251.107, 2017: 245.120, 2016: 240.007,
  2015: 237.017, 2010: 218.056, 2000: 172.2,   1990: 130.7,
  1980: 82.4,
};
const availableYears = Object.keys(cpiData).map(Number).sort((a,b) => b - a);

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

// --- CPI Calculator ---
const cpiSchema = z.object({
  initialAmount: z.number().min(0.01, 'Amount must be positive'),
  startYear: z.number(),
  endYear: z.number(),
}).refine(data => data.endYear !== data.startYear, {
    message: "Start and end years must be different.",
    path: ["endYear"],
});
type CpiFormData = z.infer<typeof cpiSchema>;

function CpiCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<CpiFormData | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<CpiFormData>({
    resolver: zodResolver(cpiSchema),
    defaultValues: { initialAmount: 100, startYear: 2000, endYear: 2023 },
  });

  const calculateInflation = (data: CpiFormData) => {
    const startCpi = cpiData[data.startYear];
    const endCpi = cpiData[data.endYear];
    if (!startCpi || !endCpi) {
        setResults({ error: "Could not find CPI data for the selected years." });
        return;
    }
    const finalAmount = data.initialAmount * (endCpi / startCpi);
    const totalInflation = ((endCpi - startCpi) / startCpi) * 100;
    setResults({ finalAmount, totalInflation, error: null });
    setFormData(data);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    let content = '';
    const filename = `cpi-inflation-calculation.${format}`;
    if (format === 'txt') {
      content = `CPI Inflation Calculation\n\nInputs:\n- Amount: ${formatCurrency(formData.initialAmount)}\n- From Year: ${formData.startYear}\n- To Year: ${formData.endYear}\n\nResult:\n- Equivalent Amount: ${formatCurrency(results.finalAmount)}\n- Total Inflation: ${results.totalInflation.toFixed(2)}%`;
    } else {
       content = `Initial Amount,Start Year,End Year,Final Amount,Total Inflation (%)\n${formData.initialAmount},${formData.startYear},${formData.endYear},${results.finalAmount.toFixed(2)},${results.totalInflation.toFixed(2)}`;
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
    <Card>
      <CardHeader><CardTitle>Inflation Calculator with U.S. CPI Data</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(calculateInflation)} className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div><Label>Amount ($)</Label><Controller name="initialAmount" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Start Year</Label><Controller name="startYear" control={control} render={({ field }) => (<Select onValueChange={v => field.onChange(Number(v))} defaultValue={String(field.value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{availableYears.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent></Select>)} /></div>
              <div><Label>End Year</Label><Controller name="endYear" control={control} render={({ field }) => (<Select onValueChange={v => field.onChange(Number(v))} defaultValue={String(field.value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{availableYears.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent></Select>)} /></div>
            </div>
            {errors.endYear && <p className="text-destructive text-sm mt-1">{errors.endYear.message}</p>}
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
            {results && !results.error ? (
                <Card><CardContent className="p-4 space-y-4 text-center">
                    <div><p className="text-sm text-muted-foreground">{formatCurrency(formData?.initialAmount || 0)} in {formData?.startYear} has the same buying power as</p><p className="text-3xl font-bold my-2">{formatCurrency(results.finalAmount)}</p><p className="text-sm text-muted-foreground">in {formData?.endYear}.</p></div>
                    <div className="border-t pt-4"><p className="text-muted-foreground">Total Inflation</p><p className="font-semibold text-lg">{results.totalInflation.toFixed(2)}%</p></div>
                </CardContent></Card>
            ) : <div className="flex items-center justify-center h-full bg-muted/50 rounded-lg border border-dashed"><p className="text-sm text-muted-foreground">{results?.error || "Enter data to see results"}</p></div>}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// --- Forward Rate Calculator ---
const forwardSchema = z.object({
  amount: z.number().min(0.01),
  rate: z.number().min(0),
  years: z.number().int().min(1),
});
type ForwardFormData = z.infer<typeof forwardSchema>;

function ForwardCalculator() {
  const [result, setResult] = useState<number | null>(null);
  const [formData, setFormData] = useState<ForwardFormData | null>(null);
  const { control, handleSubmit } = useForm<ForwardFormData>({ resolver: zodResolver(forwardSchema), defaultValues: { amount: 100, rate: 3, years: 10 } });

  const calculate = (data: ForwardFormData) => {
    setResult(data.amount * Math.pow(1 + data.rate / 100, data.years));
    setFormData(data);
  };

  const handleExport = (format: 'txt' | 'csv') => {
    if (!result || !formData) return;
    let content = `Forward Inflation Calculation\n\nInputs:\n- Amount: ${formatCurrency(formData.amount)}\n- Rate: ${formData.rate}%\n- Years: ${formData.years}\n\nResult:\n- Future Value: ${formatCurrency(result)}`;
    const blob = new Blob([content], { type: `text/${format}` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `forward-inflation.${format}`; a.click(); URL.revokeObjectURL(url);
  }
  
  return (
    <Card>
      <CardHeader><CardTitle>Forward Flat Rate Inflation Calculator</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(calculate)} className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div><Label>Amount ($)</Label><Controller name="amount" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
            <div><Label>Inflation Rate (%)</Label><Controller name="rate" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
            <div><Label>Years</Label><Controller name="years" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />} /></div>
            <div className="flex gap-2"><Button type="submit" className="flex-1">Calculate</Button>
              <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" disabled={!result}><Download className="mr-2 h-4 w-4" /> Export</Button></DropdownMenuTrigger>
                <DropdownMenuContent><DropdownMenuItem onClick={() => handleExport('txt')}>Download .txt</DropdownMenuItem><DropdownMenuItem onClick={() => handleExport('csv')}>Download .csv</DropdownMenuItem></DropdownMenuContent>
              </DropdownMenu></div>
          </div>
          <div><h3 className="text-xl font-semibold">Future Value</h3>{result ? <Card><CardContent className="p-6 text-center"><p className="text-3xl font-bold">{formatCurrency(result)}</p></CardContent></Card> : <div className="flex items-center justify-center h-full bg-muted/50 rounded-lg border border-dashed"><p className="text-sm text-muted-foreground">Enter data to see results</p></div>}</div>
        </form>
      </CardContent>
    </Card>
  );
}

// --- Backward Rate Calculator ---
function BackwardCalculator() {
  const [result, setResult] = useState<number | null>(null);
  const [formData, setFormData] = useState<ForwardFormData | null>(null);
  const { control, handleSubmit } = useForm<ForwardFormData>({ resolver: zodResolver(forwardSchema), defaultValues: { amount: 100, rate: 3, years: 10 } });

  const calculate = (data: ForwardFormData) => {
    setResult(data.amount / Math.pow(1 + data.rate / 100, data.years));
    setFormData(data);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!result || !formData) return;
    let content = `Backward Inflation Calculation\n\nInputs:\n- Amount: ${formatCurrency(formData.amount)}\n- Rate: ${formData.rate}%\n- Years Ago: ${formData.years}\n\nResult:\n- Past Value: ${formatCurrency(result)}`;
    const blob = new Blob([content], { type: `text/${format}` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `backward-inflation.${format}`; a.click(); URL.revokeObjectURL(url);
  }

  return (
    <Card>
      <CardHeader><CardTitle>Backward Flat Rate Inflation Calculator</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(calculate)} className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div><Label>Amount ($)</Label><Controller name="amount" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
            <div><Label>Inflation Rate (%)</Label><Controller name="rate" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
            <div><Label>Years Ago</Label><Controller name="years" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />} /></div>
            <div className="flex gap-2"><Button type="submit" className="flex-1">Calculate</Button>
              <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" disabled={!result}><Download className="mr-2 h-4 w-4" /> Export</Button></DropdownMenuTrigger>
                <DropdownMenuContent><DropdownMenuItem onClick={() => handleExport('txt')}>Download .txt</DropdownMenuItem><DropdownMenuItem onClick={() => handleExport('csv')}>Download .csv</DropdownMenuItem></DropdownMenuContent>
              </DropdownMenu></div>
          </div>
          <div><h3 className="text-xl font-semibold">Past Value</h3>{result ? <Card><CardContent className="p-6 text-center"><p className="text-3xl font-bold">{formatCurrency(result)}</p></CardContent></Card> : <div className="flex items-center justify-center h-full bg-muted/50 rounded-lg border border-dashed"><p className="text-sm text-muted-foreground">Enter data to see results</p></div>}</div>
        </form>
      </CardContent>
    </Card>
  );
}

export default function InflationCalculator() {
  return (
    <Tabs defaultValue="cpi" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="cpi">CPI Calculator</TabsTrigger>
        <TabsTrigger value="forward">Forward Rate</TabsTrigger>
        <TabsTrigger value="backward">Backward Rate</TabsTrigger>
      </TabsList>
      <TabsContent value="cpi" className="mt-6">
        <CpiCalculator />
      </TabsContent>
      <TabsContent value="forward" className="mt-6">
        <ForwardCalculator />
      </TabsContent>
      <TabsContent value="backward" className="mt-6">
        <BackwardCalculator />
      </TabsContent>
    </Tabs>
  );
}
