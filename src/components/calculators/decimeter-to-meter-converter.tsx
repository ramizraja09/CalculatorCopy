
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const formSchema = z.object({
  value: z.number().min(0),
  unit: z.enum(['decimeters', 'meters']),
});

type FormData = z.infer<typeof formSchema>;

export default function DecimeterToMeterConverter() {
  const [result, setResult] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, watch } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { value: 10, unit: 'decimeters' },
  });

  const formValues = watch();

  const calculateConversion = (data: FormData) => {
    if (data.value >= 0) {
      let convertedValue;
      if (data.unit === 'decimeters') {
        convertedValue = data.value / 10;
      } else {
        convertedValue = data.value * 10;
      }
      setResult(convertedValue.toLocaleString(undefined, { maximumFractionDigits: 5 }));
      setFormData(data);
    }
  }
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!result || !formData) return;
    
    let content = '';
    const filename = `dm-m-conversion.${format}`;
    const { value, unit } = formData;
    const toUnit = unit === 'decimeters' ? 'meters' : 'decimeters';

    if (format === 'txt') {
      content = `DM/M Conversion\n\nInputs:\n- Value: ${value}\n- From: ${unit}\n- To: ${toUnit}\n\nResult:\n- Converted Value: ${result}`;
    } else {
       content = `Value,From Unit,To Unit,Result\n${value},${unit},${toUnit},${result}`;
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
    <form onSubmit={handleSubmit(calculateConversion)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
        <div>
          <Label>From</Label>
          <div className="flex gap-2">
            <Controller name="value" control={control} render={({ field }) => <Input type="number" step="any" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
            <Controller name="unit" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="decimeters">Decimeters</SelectItem>
                  <SelectItem value="meters">Meters</SelectItem>
                </SelectContent>
              </Select>
            )} />
          </div>
        </div>
        <div>
          <Label>To ({formValues.unit === 'decimeters' ? 'Meters' : 'Decimeters'})</Label>
          <Card className="flex-1"><CardContent className="p-2 h-10 flex items-center justify-center font-semibold text-lg">{result ?? '...'}</CardContent></Card>
        </div>
      </div>
       <div className="flex gap-2">
          <Button type="submit" className="flex-1">Calculate</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={!result}>
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
  );
}
