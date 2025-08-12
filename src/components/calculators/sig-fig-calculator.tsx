
"use client";

import { useState } from 'react';
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
  number: z.string().refine(val => !isNaN(parseFloat(val)) && isFinite(Number(val)), { message: "Please enter a valid number."}),
  sigFigs: z.number().int().min(1, "Must round to at least 1 significant figure."),
});

type FormData = z.infer<typeof formSchema>;

export default function SigFigCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { number: '12345.678', sigFigs: 4 },
  });

  const countSigFigs = (numStr: string) => {
    if (numStr.includes('e')) {
        const parts = numStr.split('e');
        return countSigFigs(parts[0].replace('.', ''));
    }
    
    // Remove negative sign
    if (numStr.startsWith('-')) {
        numStr = numStr.substring(1);
    }

    if (numStr.includes('.')) {
        // Remove leading zeros before the decimal
        numStr = numStr.replace(/^0+/, '');
        // Then remove the decimal point
        numStr = numStr.replace('.', '');
        // Again remove leading zeros that were after the decimal (e.g., 0.00123)
        numStr = numStr.replace(/^0+/, '');
        return numStr.length;
    }
    
    // For integers
    // Remove leading zeros
    numStr = numStr.replace(/^0+/, '');
    // Trailing zeros are not significant unless a decimal is present
    numStr = numStr.replace(/0+$/, '');
    return numStr.length;
  }

  const roundToSigFigs = (data: FormData) => {
    try {
        const num = parseFloat(data.number);
        if (isNaN(num)) {
            setResults({ error: "Invalid input number." });
            return;
        }

        const roundedNumber = Number(num.toPrecision(data.sigFigs));
        const originalSigFigs = countSigFigs(data.number);

        setResults({
            roundedNumber: roundedNumber.toString(),
            originalSigFigs,
            error: null
        });
        setFormData(data);
    } catch(e) {
         setResults({ error: "Could not process the number." });
    }
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `sig-fig-result.${format}`;

    if (format === 'txt') {
      content = `Significant Figures Calculation\n\nInput Number: ${formData.number}\nRound to: ${formData.sigFigs} sig figs\n\nResults:\nRounded Number: ${results.roundedNumber}\nOriginal Sig Figs: ${results.originalSigFigs}`;
    } else {
      content = `Input Number,Round To,Rounded Number,Original Sig Figs\n${formData.number},${formData.sigFigs},${results.roundedNumber},${results.originalSigFigs}`;
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
    <form onSubmit={handleSubmit(roundToSigFigs)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Input</h3>
        <div>
          <Label htmlFor="number">Number</Label>
          <Controller name="number" control={control} render={({ field }) => <Input {...field} />} />
          {errors.number && <p className="text-destructive text-sm mt-1">{errors.number.message}</p>}
        </div>
        <div>
          <Label htmlFor="sigFigs">Round to Significant Figures</Label>
          <Controller name="sigFigs" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} />
          {errors.sigFigs && <p className="text-destructive text-sm mt-1">{errors.sigFigs.message}</p>}
        </div>
        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Calculate</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={!results}>
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
        {results ? (
            results.error ? (
                 <Card className="flex items-center justify-center h-40 bg-muted/50 border-dashed"><p className="text-destructive">{results.error}</p></Card>
            ) : (
            <Card>
                <CardContent className="p-6 text-center space-y-4">
                    <div>
                        <p className="text-sm text-muted-foreground">Rounded Number</p>
                        <p className="text-2xl font-bold my-2">{results.roundedNumber}</p>
                    </div>
                     <div>
                        <p className="text-sm text-muted-foreground">Original Significant Figures</p>
                        <p className="text-lg font-bold">{results.originalSigFigs}</p>
                    </div>
                </CardContent>
            </Card>
            )
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter a number to round</p></div>
        )}
      </div>
    </form>
  );
}
