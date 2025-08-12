
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const formSchema = z.object({
    solveFor: z.enum(['pv', 'fv', 'pmt', 'nper', 'rate']),
    pv: z.number().optional(),
    fv: z.number().optional(),
    pmt: z.number().optional(),
    nper: z.number().optional(),
    rate: z.number().optional(),
});

type FormData = z.infer<typeof formSchema>;

// Financial functions
const calcPV = (rate: number, nper: number, pmt: number, fv: number) => {
    rate = rate / 100 / 12;
    if (rate === 0) return -(fv + pmt * nper);
    return -( (pmt * (Math.pow(1 + rate, nper) - 1) / rate + fv) / Math.pow(1 + rate, nper) );
};
const calcFV = (rate: number, nper: number, pmt: number, pv: number) => {
    rate = rate / 100 / 12;
    if (rate === 0) return -(pv + pmt * nper);
    return -(pv * Math.pow(1 + rate, nper) + pmt * (Math.pow(1 + rate, nper) - 1) / rate);
};
const calcPMT = (rate: number, nper: number, pv: number, fv: number) => {
    rate = rate / 100 / 12;
    if (rate === 0) return -(pv + fv) / nper;
    return -(fv + pv * Math.pow(1 + rate, nper)) * rate / (Math.pow(1 + rate, nper) - 1);
};
const calcNPER = (rate: number, pmt: number, pv: number, fv: number) => {
    rate = rate / 100 / 12;
    if (rate === 0) return -(pv + fv) / pmt;
    return Math.log((pmt - fv * rate) / (pmt + pv * rate)) / Math.log(1 + rate);
};

export default function TvmCalculator() {
  const [result, setResult] = useState<string | null>(null);

  const { control, handleSubmit, watch } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        solveFor: 'fv',
        pv: 1000,
        pmt: 100,
        nper: 120, // 10 years
        rate: 7,
    },
  });

  const solveFor = watch('solveFor');

  const calculateTvm = (data: FormData) => {
    let res = 0;
    const { pv = 0, fv = 0, pmt = 0, nper = 0, rate = 0 } = data;
    switch(data.solveFor) {
        case 'pv': res = calcPV(rate, nper, pmt, fv); break;
        case 'fv': res = calcFV(rate, nper, pmt, pv); break;
        case 'pmt': res = calcPMT(rate, nper, pv, fv); break;
        case 'nper': res = calcNPER(rate, pmt, pv, fv); break;
        case 'rate': 
          setResult('Rate calculation is complex and not supported in this version.');
          return;
    }
    const unit = data.solveFor === 'nper' ? 'months' : data.solveFor === 'rate' ? '%' : '$';
    const formattedResult = unit === '$' 
        ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(res)
        : `${res.toFixed(2)} ${unit}`;

    setResult(`${data.solveFor.toUpperCase()} = ${formattedResult}`);
  };

  const isInputDisabled = (field: keyof FormData) => solveFor === field;

  return (
    <div data-results-container>
      <form onSubmit={handleSubmit(calculateTvm)} className="space-y-4">
        <Card>
          <CardContent className="p-4">
            <Label>What do you want to solve for?</Label>
            <Controller name="solveFor" control={control} render={({ field }) => (
              <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-2">
                <Label className={`p-3 border rounded-md text-center ${field.value === 'pv' ? 'border-primary' : ''}`}><RadioGroupItem value="pv" className="sr-only"/>PV</Label>
                <Label className={`p-3 border rounded-md text-center ${field.value === 'fv' ? 'border-primary' : ''}`}><RadioGroupItem value="fv" className="sr-only"/>FV</Label>
                <Label className={`p-3 border rounded-md text-center ${field.value === 'pmt' ? 'border-primary' : ''}`}><RadioGroupItem value="pmt" className="sr-only"/>Payment</Label>
                <Label className={`p-3 border rounded-md text-center ${field.value === 'nper' ? 'border-primary' : ''}`}><RadioGroupItem value="nper" className="sr-only"/>Periods</Label>
                <Label className={`p-3 border rounded-md text-center ${field.value === 'rate' ? 'border-primary' : ''}`}><RadioGroupItem value="rate" className="sr-only"/>Rate</Label>
              </RadioGroup>
            )} />
          </CardContent>
        </Card>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div><Label htmlFor="pv">Present Value (PV)</Label><Controller name="pv" control={control} render={({ field }) => <Input id="pv" type="number" {...field} disabled={isInputDisabled('pv')} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
          <div><Label htmlFor="fv">Future Value (FV)</Label><Controller name="fv" control={control} render={({ field }) => <Input id="fv" type="number" {...field} disabled={isInputDisabled('fv')} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
          <div><Label htmlFor="pmt">Payment (PMT)</Label><Controller name="pmt" control={control} render={({ field }) => <Input id="pmt" type="number" {...field} disabled={isInputDisabled('pmt')} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
          <div><Label htmlFor="nper">Number of Periods (Months)</Label><Controller name="nper" control={control} render={({ field }) => <Input id="nper" type="number" {...field} disabled={isInputDisabled('nper')} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
          <div><Label htmlFor="rate">Annual Rate (%)</Label><Controller name="rate" control={control} render={({ field }) => <Input id="rate" type="number" step="0.01" {...field} disabled={isInputDisabled('rate')} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
        </div>
        
        <Button type="submit" className="w-full">Calculate</Button>

        {result && (
          <Card className="mt-4">
            <CardContent className="p-6 text-center">
              <p className="text-2xl font-bold">{result}</p>
            </CardContent>
          </Card>
        )}
      </form>
    </div>
  );
}
