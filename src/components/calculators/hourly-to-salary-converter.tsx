
"use client";

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const formSchema = z.object({
  conversionType: z.enum(['hourlyToSalary', 'salaryToHourly']),
  hourlyRate: z.number().min(0),
  hoursPerWeek: z.number().min(1),
  annualSalary: z.number().min(0),
});

type FormData = z.infer<typeof formSchema>;

export default function HourlyToSalaryConverter() {
  const [result, setResult] = useState<string | null>(null);
  const [isCalculated, setIsCalculated] = useState(false);
  const { control, watch, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      conversionType: 'hourlyToSalary',
      hourlyRate: 25,
      hoursPerWeek: 40,
      annualSalary: 52000,
    },
  });

  const formData = watch();
  
  const calculateConversion = (data: FormData) => {
    const { conversionType, hourlyRate, hoursPerWeek, annualSalary } = data;
    if (conversionType === 'hourlyToSalary') {
      const calculatedSalary = hourlyRate * hoursPerWeek * 52;
      setResult(`Annual Salary: ${formatCurrency(calculatedSalary)}`);
    } else {
      const calculatedHourlyRate = annualSalary / 52 / hoursPerWeek;
      setResult(`Hourly Rate: ${formatCurrency(calculatedHourlyRate)}`);
    }
    setIsCalculated(true);
  };

  const handleExport = (format: 'txt' | 'csv') => {
    if (!result) return;
    
    let content = '';
    const filename = `hourly-salary-conversion.${format}`;
    const { conversionType, hourlyRate, hoursPerWeek, annualSalary } = formData;

    if (format === 'txt') {
      content = `Hourly/Salary Conversion\n\nInputs:\n- Conversion Type: ${conversionType}\n`;
      if (conversionType === 'hourlyToSalary') {
        content += `- Hourly Rate: ${formatCurrency(hourlyRate)}\n`;
      } else {
        content += `- Annual Salary: ${formatCurrency(annualSalary)}\n`;
      }
      content += `- Hours Per Week: ${hoursPerWeek}\n\nResult:\n- ${result}`;

    } else {
      content = `Conversion Type,Input Rate/Salary,Hours Per Week,Result\n`;
      if(conversionType === 'hourlyToSalary') {
        content += `Hourly to Salary,${hourlyRate},${hoursPerWeek},"${result}"`;
      } else {
        content += `Salary to Hourly,${annualSalary},${hoursPerWeek},"${result}"`;
      }
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
    <form onSubmit={handleSubmit(calculateConversion)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs Column */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Conversion Type</h3>
        <Controller name="conversionType" control={control} render={({ field }) => (
            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 gap-4">
                <Label className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><RadioGroupItem value="hourlyToSalary" className="mr-2"/>Hourly to Salary</Label>
                <Label className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><RadioGroupItem value="salaryToHourly" className="mr-2"/>Salary to Hourly</Label>
            </RadioGroup>
        )}/>

        {formData.conversionType === 'hourlyToSalary' ? (
            <div className="space-y-4">
                <div><Label>Hourly Rate ($)</Label><Controller name="hourlyRate" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
                <div><Label>Hours Per Week</Label><Controller name="hoursPerWeek" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
            </div>
        ) : (
             <div className="space-y-4">
                <div><Label>Annual Salary ($)</Label><Controller name="annualSalary" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
                 <div><Label>Hours Per Week</Label><Controller name="hoursPerWeek" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
            </div>
        )}

        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Calculate</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={!isCalculated}>
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
        <h3 className="text-xl font-semibold">Equivalent Rate</h3>
        {isCalculated && result ? (
            <Card>
                <CardContent className="p-6 text-center">
                    <p className="text-2xl font-bold">{result}</p>
                </CardContent>
            </Card>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter details to convert</p></div>
        )}
      </div>
    </form>
  );
}
