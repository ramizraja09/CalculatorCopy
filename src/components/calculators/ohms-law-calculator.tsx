
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Download, Play } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const formSchema = z.object({
  voltage: z.string().optional(),
  current: z.string().optional(),
  resistance: z.string().optional(),
  power: z.string().optional(),
}).refine(data => {
    const fields = [data.voltage, data.current, data.resistance, data.power];
    const filledCount = fields.filter(f => f !== undefined && f !== '' && !isNaN(parseFloat(f))).length;
    return filledCount === 2;
}, {
    message: "Please provide exactly two values.",
});

type FormData = z.infer<typeof formSchema>;

export default function OhmsLawCalculator() {
  const { control, handleSubmit, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      voltage: '110',
      current: '0.2',
      resistance: '',
      power: '',
    },
  });

  const [lastCalculation, setLastCalculation] = useState<any>(null);

  const calculate = (data: FormData) => {
    let v = data.voltage ? parseFloat(data.voltage) : null;
    let i = data.current ? parseFloat(data.current) : null;
    let r = data.resistance ? parseFloat(data.resistance) : null;
    let p = data.power ? parseFloat(data.power) : null;

    if (v !== null && i !== null) {
      r = v / i;
      p = v * i;
    } else if (v !== null && r !== null) {
      i = v / r;
      p = v * i;
    } else if (v !== null && p !== null) {
      i = p / v;
      r = v / i;
    } else if (i !== null && r !== null) {
      v = i * r;
      p = v * i;
    } else if (i !== null && p !== null) {
      v = p / i;
      r = v / i;
    } else if (r !== null && p !== null) {
      v = Math.sqrt(p * r);
      i = v / r;
    }

    const formatValue = (val: number | null) => val !== null && isFinite(val) ? val.toPrecision(4) : '';
    
    setValue('voltage', formatValue(v));
    setValue('current', formatValue(i));
    setValue('resistance', formatValue(r));
    setValue('power', formatValue(p));

    setLastCalculation({ v, i, r, p });
  };
  
  const handleClear = () => {
    reset({
        voltage: '',
        current: '',
        resistance: '',
        power: ''
    });
    setLastCalculation(null);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!lastCalculation) return;

    let content = '';
    const filename = `ohms-law-calculation.${format}`;
    const { v, i, r, p } = lastCalculation;

    if (format === 'txt') {
      content = `Ohm's Law Calculation\n\n- Voltage: ${v?.toPrecision(4)} V\n- Current: ${i?.toPrecision(4)} A\n- Resistance: ${r?.toPrecision(4)} Ω\n- Power: ${p?.toPrecision(4)} W`;
    } else {
       content = `Voltage (V),Current (A),Resistance (Ω),Power (W)\n${v?.toPrecision(4)},${i?.toPrecision(4)},${r?.toPrecision(4)},${p?.toPrecision(4)}`;
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
    <div className="space-y-4">
        <Alert>
            <AlertTitle>Ohm's Law Calculator</AlertTitle>
            <AlertDescription>
                Please provide any 2 values and click "Calculate" to get the other values. Formulas: V = I × R and P = V × I.
            </AlertDescription>
        </Alert>
        <div className="grid md:grid-cols-2 gap-8 items-start">
            <Card>
                <CardContent className="p-4">
                    <form onSubmit={handleSubmit(calculate)} className="space-y-4">
                        <div className="grid grid-cols-[auto,1fr] items-center gap-4">
                            <Label htmlFor="voltage">Voltage (V):</Label>
                            <Controller name="voltage" control={control} render={({ field }) => <Input id="voltage" type="text" {...field} />} />
                            
                            <Label htmlFor="current">Current (I):</Label>
                            <Controller name="current" control={control} render={({ field }) => <Input id="current" type="text" {...field} />} />
                            
                            <Label htmlFor="resistance">Resistance (R):</Label>
                            <Controller name="resistance" control={control} render={({ field }) => <Input id="resistance" type="text" {...field} />} />
                            
                            <Label htmlFor="power">Power (P):</Label>
                            <Controller name="power" control={control} render={({ field }) => <Input id="power" type="text" {...field} />} />
                        </div>
                        {errors.root && (
                            <p className="text-destructive text-sm text-center">{errors.root.message}</p>
                        )}
                        <div className="flex gap-2 pt-2">
                            <Button type="submit" className="flex-1">
                                <Play className="mr-2 h-4 w-4 fill-current" /> Calculate
                            </Button>
                            <Button type="button" variant="outline" onClick={handleClear} className="flex-1">Clear</Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" disabled={!lastCalculation}>
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
            <div className="flex items-center justify-center p-4 bg-muted rounded-lg">
                <svg width="200" height="150" viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M40 120V30H160V120" stroke="hsl(var(--foreground))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M160 75H180" stroke="hsl(var(--foreground))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M110 30L120 20L130 30L140 20L150 30" stroke="hsl(var(--foreground))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="25" cy="75" r="15" stroke="hsl(var(--foreground))" strokeWidth="2"/>
                    <path d="M25 65V70" stroke="hsl(var(--foreground))" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M25 80V85" stroke="hsl(var(--foreground))" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M18 75H23" stroke="hsl(var(--foreground))" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M27 75H32" stroke="hsl(var(--foreground))" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M10 75H40" stroke="hsl(var(--foreground))" strokeWidth="2" strokeLinecap="round"/>
                    <text x="20" y="55" className="text-lg font-sans fill-foreground font-bold">V</text>
                    <text x="120" y="15" className="text-lg font-sans fill-foreground font-bold">R</text>
                    <path d="M100 120L100 140" stroke="hsl(var(--foreground))" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M95 135L100 140L105 135" stroke="hsl(var(--foreground))" strokeWidth="2" strokeLinecap="round"/>
                    <text x="105" y="130" className="text-lg font-sans fill-foreground font-bold">I</text>
                </svg>
            </div>
        </div>
    </div>
  );
}
