
"use client";

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download } from 'lucide-react';


const formSchema = z.object({
  min: z.number().int(),
  max: z.number().int(),
}).refine(data => data.max > data.min, {
    message: "Max must be greater than Min",
    path: ['max'],
});

type FormData = z.infer<typeof formSchema>;

export default function RandomNumberGenerator() {
  const [result, setResult] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { min: 1, max: 100 },
  });

  const generateRandom = (data: FormData) => {
    const { min, max } = data;
    const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
    setResult(randomNumber);
    setFormData(data);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (result === null || !formData) return;
    
    let content = '';
    const filename = `random-number-result.${format}`;

    if (format === 'txt') {
      content = `Random Number Generation\n\nInputs:\nMin: ${formData.min}\nMax: ${formData.max}\n\nResult:\n${result}`;
    } else {
      content = `Min,Max,Result\n${formData.min},${formData.max},${result}`;
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
    <form onSubmit={handleSubmit(generateRandom)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Range</h3>
        <div>
            <Label>Min</Label>
            <Controller name="min" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))} />} />
        </div>
         <div>
            <Label>Max</Label>
            <Controller name="max" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))} />} />
        </div>
        {errors.max && <p className="text-destructive text-sm mt-1">{errors.max.message}</p>}
        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Generate</Button>
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
        <Card className="flex items-center justify-center h-40">
           <CardContent className="p-6 text-center">
            {isClient && result !== null ? (
                <p className="text-6xl font-bold">{result}</p>
            ) : (
                <p className="text-muted-foreground">Click "Generate"</p>
            )}
            </CardContent>
        </Card>
      </div>
    </form>
  );
}
