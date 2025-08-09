
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

const apyToAprSchema = z.object({
  apy: z.number().min(0, "APY must be non-negative"),
  compounding: z.string(),
});

export default function AprApyCalculator() {
  const [apyResult, setApyResult] = useState<number | null>(null);
  const [aprResult, setAprResult] = useState<number | null>(null);

  const { control: aprControl, handleSubmit: handleAprSubmit } = useForm({
    resolver: zodResolver(aprToApySchema),
    defaultValues: { apr: 5, compounding: 'monthly' },
  });

  const { control: apyControl, handleSubmit: handleApySubmit } = useForm({
    resolver: zodResolver(apyToAprSchema),
    defaultValues: { apy: 5.116, compounding: 'monthly' },
  });

  const calculateApy = (data: z.infer<typeof aprToApySchema>) => {
    const n = compoundFrequencies[data.compounding];
    const apr = data.apr / 100;
    const apy = (Math.pow(1 + apr / n, n) - 1) * 100;
    setApyResult(apy);
  };

  const calculateApr = (data: z.infer<typeof apyToAprSchema>) => {
    const n = compoundFrequencies[data.compounding];
    const apy = data.apy / 100;
    const apr = n * (Math.pow(1 + apy, 1 / n) - 1) * 100;
    setAprResult(apr);
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
                <Controller name="apr" control={aprControl} render={({ field }) => <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
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
              <Button type="submit" className="w-full">Calculate APY</Button>
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
                <Controller name="apy" control={apyControl} render={({ field }) => <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
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
              <Button type="submit" className="w-full">Calculate APR</Button>
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
