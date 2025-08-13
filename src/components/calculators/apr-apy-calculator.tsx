
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const compoundFrequencies: { [key: string]: number } = {
  annually: 1,
  semiannually: 2,
  quarterly: 4,
  monthly: 12,
  daily: 365,
};

const aprToApySchema = z.object({
  apr: z.number().min(0, "APR must be non-negative"),
  compounding: z.string(),
});
type AprFormData = z.infer<typeof aprToApySchema>;

const apyToAprSchema = z.object({
  apy: z.number().min(0, "APY must be non-negative"),
  compounding: z.string(),
});
type ApyFormData = z.infer<typeof apyToAprSchema>;

export default function AprApyCalculator() {
  const [apyResult, setApyResult] = useState<number | null>(null);
  const [aprResult, setAprResult] = useState<number | null>(null);
  const [aprFormData, setAprFormData] = useState<AprFormData | null>(null);
  const [apyFormData, setApyFormData] = useState<ApyFormData | null>(null);


  const { control: aprControl, handleSubmit: handleAprSubmit } = useForm({
    resolver: zodResolver(aprToApySchema),
    defaultValues: { apr: 5, compounding: 'monthly' },
  });

  const { control: apyControl, handleSubmit: handleApySubmit } = useForm({
    resolver: zodResolver(apyToAprSchema),
    defaultValues: { apy: 5.116, compounding: 'monthly' },
  });

  const calculateApy = (data: AprFormData) => {
    const n = compoundFrequencies[data.compounding];
    const apr = data.apr / 100;
    const apy = (Math.pow(1 + apr / n, n) - 1) * 100;
    setApyResult(apy);
    setAprFormData(data);
  };

  const calculateApr = (data: ApyFormData) => {
    const n = compoundFrequencies[data.compounding];
    const apy = data.apy / 100;
    const apr = n * (Math.pow(1 + apy, 1 / n) - 1) * 100;
    setAprResult(apr);
    setApyFormData(data);
  };
  
  const handleExport = (type: 'apr' | 'apy') => {
    const isApr = type === 'apr';
    const data = isApr ? aprFormData : apyFormData;
    const result = isApr ? apyResult : aprResult;

    if (!data || result === null) return;
    
    let content = '';
    const filename = `apr-apy-conversion.${isApr ? 'txt' : 'csv'}`;
    const initialKey = isApr ? 'APR' : 'APY';
    const resultKey = isApr ? 'APY' : 'APR';
    const initialValue = isApr ? (data as AprFormData).apr : (data as ApyFormData).apy;

    if (isApr) { // Just making simple txt for both for now
      content = `APR to APY Calculation\n\nInputs:\n- ${initialKey}: ${initialValue}%\n- Compounding: ${data.compounding}\n\nResult:\n- Calculated ${resultKey}: ${result.toFixed(4)}%`;
    } else {
       content = `APY to APR Calculation\n\nInputs:\n- ${initialKey}: ${initialValue}%\n- Compounding: ${data.compounding}\n\nResult:\n- Calculated ${resultKey}: ${result.toFixed(4)}%`;
    }

    const blob = new Blob([content], { type: `text/plain` });
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
    <Tabs defaultValue="apr-to-apy" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="apr-to-apy">APR to APY</TabsTrigger>
        <TabsTrigger value="apy-to-apr">APY to APR</TabsTrigger>
      </TabsList>
      <TabsContent value="apr-to-apy">
        <Card>
          <CardHeader>
            <CardTitle>Calculate APY from APR</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAprSubmit(calculateApy)} className="space-y-4">
              <div>
                <Label>APR (%)</Label>
                <Controller name="apr" control={aprControl} render={({ field }) => <Input type="number" step="0.01" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
              </div>
              <div>
                <Label>Compounding Frequency</Label>
                <Controller name="compounding" control={aprControl} render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.keys(compoundFrequencies).map(freq => (
                        <SelectItem key={freq} value={freq} className="capitalize">{freq}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )} />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">Calculate APY</Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" disabled={apyResult === null}>
                      <Download className="mr-2 h-4 w-4" /> Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleExport('apr')}>Download as .txt</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {apyResult !== null && (
                <div className="mt-4 text-center">
                  <p className="text-muted-foreground">Calculated APY</p>
                  <p className="text-2xl font-bold">{apyResult.toFixed(4)}%</p>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="apy-to-apr">
        <Card>
          <CardHeader>
            <CardTitle>Calculate APR from APY</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleApySubmit(calculateApr)} className="space-y-4">
              <div>
                <Label>APY (%)</Label>
                <Controller name="apy" control={apyControl} render={({ field }) => <Input type="number" step="0.01" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
              </div>
              <div>
                <Label>Compounding Frequency</Label>
                 <Controller name="compounding" control={apyControl} render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.keys(compoundFrequencies).map(freq => (
                        <SelectItem key={freq} value={freq} className="capitalize">{freq}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )} />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">Calculate APR</Button>
                 <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" disabled={aprResult === null}>
                      <Download className="mr-2 h-4 w-4" /> Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleExport('apy')}>Download as .txt</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {aprResult !== null && (
                <div className="mt-4 text-center">
                  <p className="text-muted-foreground">Calculated APR</p>
                  <p className="text-2xl font-bold">{aprResult.toFixed(4)}%</p>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
