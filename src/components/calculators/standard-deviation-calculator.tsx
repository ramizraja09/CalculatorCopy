
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
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
  numbers: z.string().refine(val => val.split(/[\s,]+/).filter(Boolean).length > 1, "Enter at least two numbers."),
  type: z.enum(['sample', 'population']),
});

type FormData = z.infer<typeof formSchema>;

export default function StandardDeviationCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { numbers: "600, 470, 170, 430, 300", type: 'sample' },
  });

  const calculate = (data: FormData) => {
    const nums = data.numbers.split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
    if (nums.length < 2) return;

    const n = nums.length;
    const mean = nums.reduce((a, b) => a + b) / n;
    const variance = nums.reduce((acc, val) => acc + (val - mean) ** 2, 0) / (data.type === 'sample' ? n - 1 : n);
    const stdDev = Math.sqrt(variance);
    
    setResults({ stdDev: stdDev.toFixed(4), mean: mean.toFixed(2), variance: variance.toFixed(2), count: n });
    setFormData(data);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    const { numbers, type } = formData;
    
    let content = '';
    const filename = `std-dev-result.${format}`;

    if (format === 'txt') {
      content = `Standard Deviation Calculation\n\n`;
      content += `Data Set: ${numbers}\n`;
      content += `Type: ${type}\n\n`;
      content += `Results:\n`;
      content += `Standard Deviation: ${results.stdDev}\n`;
      content += `Mean: ${results.mean}\n`;
      content += `Variance: ${results.variance}\n`;
      content += `Count: ${results.count}`;
    } else {
      content = `Data Set,Type,Standard Deviation,Mean,Variance,Count\n`;
      content += `"${numbers}",${type},${results.stdDev},${results.mean},${results.variance},${results.count}`;
    }

    const blob = new Blob([content], { type: `text/${format}` });
    const url = URL.createObjectURL(blob);
    const aEl = document.createElement('a');
    aEl.href = url;
    aEl.download = filename;
    document.body.appendChild(aEl);
    aEl.click();
    document.body.removeChild(aEl);
    URL.revokeObjectURL(url);
  };


  return (
    <form onSubmit={handleSubmit(calculate)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Inputs</h3>
        <div>
          <Label>Numbers (comma or space separated)</Label>
          <Controller name="numbers" control={control} render={({ field }) => <Textarea {...field} rows={5} />} />
        </div>
        <Controller name="type" control={control} render={({ field }) => (
            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 gap-4">
                <Label className="p-4 border rounded-md text-center peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><RadioGroupItem value="sample" className="mr-2"/>Sample</Label>
                <Label className="p-4 border rounded-md text-center peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><RadioGroupItem value="population" className="mr-2"/>Population</Label>
            </RadioGroup>
        )}/>
        <Button type="submit" className="w-full">Calculate</Button>
      </div>

      {/* Results */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Result</h3>
             {results && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Download className="h-4 w-4" />
                            <span className="sr-only">Export</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleExport('txt')}>Download as .txt</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExport('csv')}>Download as .csv</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
        {results ? (
            <Card>
                <CardContent className="p-4 grid grid-cols-2 gap-4 text-center">
                    <div><p className="font-semibold">Std. Deviation</p><p className="text-2xl">{results.stdDev}</p></div>
                    <div><p className="font-semibold">Mean</p><p>{results.mean}</p></div>
                    <div><p className="font-semibold">Variance</p><p>{results.variance}</p></div>
                    <div><p className="font-semibold">Count</p><p>{results.count}</p></div>
                </CardContent>
            </Card>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter numbers to calculate</p></div>
        )}
      </div>
    </form>
  );
}
