
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const formSchema = z.object({
  hourlyRate: z.number().min(0, "Hourly rate must be non-negative"),
  regularHours: z.number().min(0, "Regular hours must be non-negative"),
  overtimeHours: z.number().min(0, "Overtime hours must be non-negative"),
  overtimeMultiplier: z.number().min(1, "Multiplier must be at least 1"),
});

type FormData = z.infer<typeof formSchema>;

export default function OvertimePayCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      hourlyRate: 20,
      regularHours: 40,
      overtimeHours: 10,
      overtimeMultiplier: 1.5,
    },
  });

  const calculatePay = (data: FormData) => {
    const { hourlyRate, regularHours, overtimeHours, overtimeMultiplier } = data;
    const regularPay = hourlyRate * regularHours;
    const overtimePay = hourlyRate * overtimeMultiplier * overtimeHours;
    const totalPay = regularPay + overtimePay;

    setResults({
      regularPay,
      overtimePay,
      totalPay,
    });
    setFormData(data);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `overtime-pay-calculation.${format}`;
    const { hourlyRate, regularHours, overtimeHours, overtimeMultiplier } = formData;

    if (format === 'txt') {
      content = `Overtime Pay Calculation\n\nInputs:\n- Hourly Rate: ${formatCurrency(hourlyRate)}\n- Regular Hours: ${regularHours}\n- Overtime Hours: ${overtimeHours}\n- Overtime Multiplier: ${overtimeMultiplier}x\n\nResults:\n- Regular Pay: ${formatCurrency(results.regularPay)}\n- Overtime Pay: ${formatCurrency(results.overtimePay)}\n- Total Pay: ${formatCurrency(results.totalPay)}`;
    } else {
       content = `Category,Value\nHourly Rate,${hourlyRate}\nRegular Hours,${regularHours}\nOvertime Hours,${overtimeHours}\nOvertime Multiplier,${overtimeMultiplier}\nRegular Pay,${results.regularPay.toFixed(2)}\nOvertime Pay,${results.overtimePay.toFixed(2)}\nTotal Pay,${results.totalPay.toFixed(2)}`;
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


  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  return (
    <form onSubmit={handleSubmit(calculatePay)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs Column */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Pay & Hours</h3>
        <div>
          <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
          <Controller name="hourlyRate" control={control} render={({ field }) => <Input id="hourlyRate" type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="regularHours">Regular Hours</Label>
            <Controller name="regularHours" control={control} render={({ field }) => <Input id="regularHours" type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
          </div>
          <div>
            <Label htmlFor="overtimeHours">Overtime Hours</Label>
            <Controller name="overtimeHours" control={control} render={({ field }) => <Input id="overtimeHours" type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
          </div>
        </div>
        <div>
          <Label htmlFor="overtimeMultiplier">Overtime Multiplier (e.g., 1.5 for time-and-a-half)</Label>
          <Controller name="overtimeMultiplier" control={control} render={({ field }) => <Input id="overtimeMultiplier" type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
        </div>
        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Calculate Pay</Button>
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

      {/* Results Column */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Pay Summary</h3>
        {results ? (
            <div className="space-y-4">
                <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-sm text-muted-foreground">Total Pay</p>
                        <p className="text-3xl font-bold">{formatCurrency(results.totalPay)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 grid grid-cols-2 gap-2 text-sm text-center">
                         <div><p className="text-muted-foreground">Regular Pay</p><p className="font-semibold">{formatCurrency(results.regularPay)}</p></div>
                         <div><p className="text-muted-foreground">Overtime Pay</p><p className="font-semibold">{formatCurrency(results.overtimePay)}</p></div>
                    </CardContent>
                </Card>
            </div>
        ) : (
             <div className="flex items-center justify-center h-60 bg-muted/50 rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">Enter your pay details</p>
            </div>
        )}
      </div>
    </form>
  );
}
