
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
import { Download, ArrowRight } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const compoundPeriods: { [key: string]: number } = {
  annually: 1,
  semiannually: 2,
  quarterly: 4,
  monthly: 12,
  semimonthly: 24,
  biweekly: 26,
  weekly: 52,
  daily: 365,
  continuously: Infinity,
};

const formSchema = z.object({
  inputInterest: z.number().min(0, 'Interest rate cannot be negative'),
  inputCompound: z.string(),
  outputCompound: z.string(),
});

type FormData = z.infer<typeof formSchema>;

export default function CompoundInterestCalculator() {
  const [result, setResult] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      inputInterest: 6,
      inputCompound: 'monthly',
      outputCompound: 'annually',
    },
  });

  const convertInterest = (data: FormData) => {
    const { inputInterest, inputCompound, outputCompound } = data;
    const rate = inputInterest / 100;
    const n_in = compoundPeriods[inputCompound];
    const n_out = compoundPeriods[outputCompound];

    // First, convert the input rate to an effective annual rate (APY)
    let apy;
    if (n_in === Infinity) { // Continuously compounded
      apy = Math.exp(rate) - 1;
    } else { // Discretely compounded
      apy = Math.pow(1 + rate / n_in, n_in) - 1;
    }

    // Then, convert the APY to the desired output rate
    let outputRate;
    if (n_out === Infinity) { // To continuously compounded
      outputRate = Math.log(1 + apy);
    } else { // To discretely compounded
      outputRate = n_out * (Math.pow(1 + apy, 1 / n_out) - 1);
    }

    setResult(outputRate * 100);
    setFormData(data);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (result === null || !formData) return;
    
    let content = '';
    const filename = `interest-conversion.${format}`;
    const { inputInterest, inputCompound, outputCompound } = formData;

    if (format === 'txt') {
      content = `Interest Rate Conversion\n\nInputs:\n- Input Interest: ${inputInterest}%\n- Input Compounding: ${inputCompound}\n- Output Compounding: ${outputCompound}\n\nResult:\n- Converted Rate: ${result.toFixed(5)}%`;
    } else {
      content = 'Input Interest (%),Input Compound,Output Compound,Converted Rate (%)\n';
      content += `${inputInterest},${inputCompound},${outputCompound},${result.toFixed(5)}`;
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
      <CardHeader>
        <CardTitle>Interest Rate Converter</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(convertInterest)} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4 items-end">
            <div>
              <Label>Input Interest</Label>
              <div className="flex items-center gap-2">
                 <Controller name="inputInterest" control={control} render={({ field }) => <Input type="number" step="0.01" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
                 <span className="font-semibold">%</span>
              </div>
            </div>
            <div>
              <Label>Compound</Label>
               <Controller name="inputCompound" control={control} render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.keys(compoundPeriods).map(freq => (
                        <SelectItem key={freq} value={freq} className="capitalize">{freq}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )} />
            </div>
          </div>
          
          <div className="flex justify-center">
            <ArrowRight className="h-6 w-6 text-muted-foreground" />
          </div>

          <div className="grid md:grid-cols-2 gap-4 items-end">
             <div>
              <Label>Output Interest</Label>
              <Card className="h-10 px-3 py-2 text-primary font-bold">
                {result !== null ? `${result.toFixed(5)}%` : '...'}
              </Card>
            </div>
            <div>
              <Label>Compound</Label>
               <Controller name="outputCompound" control={control} render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.keys(compoundPeriods).map(freq => (
                        <SelectItem key={freq} value={freq} className="capitalize">{freq}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )} />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">Calculate</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={result === null}>
                  <Download className="mr-2 h-4 w-4" /> Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleExport('txt')}>Download as .txt</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('csv')}>Download as .csv</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
