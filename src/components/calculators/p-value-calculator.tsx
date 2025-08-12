
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download } from 'lucide-react';

const formSchema = z.object({
  zScore: z.number(),
  tail: z.enum(['one-tailed', 'two-tailed']),
});

type FormData = z.infer<typeof formSchema>;

// Standard normal distribution cumulative distribution function (approximation)
function standardNormalCdf(x: number) {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    let prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    if (x > 0) prob = 1 - prob;
    return prob;
}

export default function PValueCalculator() {
  const [result, setResult] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData | null>(null);


  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { zScore: 1.96, tail: 'two-tailed' },
  });

  const calculatePValue = (data: FormData) => {
    const pValueOneTail = 1 - standardNormalCdf(Math.abs(data.zScore));
    if (data.tail === 'one-tailed') {
        setResult(pValueOneTail);
    } else {
        setResult(pValueOneTail * 2);
    }
    setFormData(data);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (result === null || !formData) return;
    const { zScore, tail } = formData;
    
    let content = '';
    const filename = `p-value-result.${format}`;

    if (format === 'txt') {
      content = `P-Value Calculation\n\nInputs:\nZ-Score: ${zScore}\nTail: ${tail}\n\nResult:\nP-Value: ${result.toFixed(4)}`;
    } else {
      content = `Z-Score,Tail,P-Value\n${zScore},${tail},${result.toFixed(4)}`;
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
    <form onSubmit={handleSubmit(calculatePValue)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Inputs</h3>
        <div>
          <Label htmlFor="zScore">Z-score</Label>
          <Controller name="zScore" control={control} render={({ field }) => <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
        </div>
        <Controller name="tail" control={control} render={({ field }) => (
            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 gap-4">
                <Label className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><RadioGroupItem value="one-tailed" className="mr-2"/>One-tailed</Label>
                <Label className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><RadioGroupItem value="two-tailed" className="mr-2"/>Two-tailed</Label>
            </RadioGroup>
        )}/>
        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Calculate P-value</Button>
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
      </div>
      {/* Results */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Result</h3>
        {result !== null ? (
            <Card>
                <CardContent className="p-6 text-center">
                    <p className="text-sm text-muted-foreground">P-value</p>
                    <p className="text-4xl font-bold my-2">{result.toFixed(4)}</p>
                </CardContent>
            </Card>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter a Z-score to calculate</p></div>
        )}
      </div>
    </form>
  );
}
