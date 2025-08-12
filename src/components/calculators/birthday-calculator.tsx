
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { differenceInDays, format, addYears } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download } from 'lucide-react';

const formSchema = z.object({
  birthDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" }),
});

type FormData = z.infer<typeof formSchema>;

export default function BirthdayCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { birthDate: '1990-01-01' },
  });

  const calculateBirthday = (data: FormData) => {
    const birthDate = new Date(data.birthDate);
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const dayOfWeek = format(birthDate, 'EEEE');
    
    let nextBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
    if (nextBirthday < today) {
        nextBirthday = addYears(nextBirthday, 1);
    }
    
    const daysUntil = differenceInDays(nextBirthday, today);

    setResults({ dayOfWeek, daysUntil });
    setFormData(data);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `birthday-calculation.${format}`;
    const { birthDate } = formData;
    const { dayOfWeek, daysUntil } = results;

    if (format === 'txt') {
      content = `Birthday Calculation\n\nInputs:\n- Birth Date: ${birthDate}\n\nResult:\n- Born on: ${dayOfWeek}\n- Days until next birthday: ${daysUntil}`;
    } else {
       content = `Birth Date,Born On,Days Until Next Birthday\n${birthDate},${dayOfWeek},${daysUntil}`;
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
    <form onSubmit={handleSubmit(calculateBirthday)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Input</h3>
        <div>
          <Label htmlFor="birthDate">Date of Birth</Label>
          <Controller name="birthDate" control={control} render={({ field }) => <Input type="date" {...field} />} />
          {errors.birthDate && <p className="text-destructive text-sm mt-1">{errors.birthDate.message}</p>}
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
            <Card>
                <CardContent className="p-6 text-center space-y-4">
                    <div>
                        <p className="text-sm text-muted-foreground">You were born on a</p>
                        <p className="text-2xl font-bold">{results.dayOfWeek}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Days until next birthday</p>
                        <p className="text-2xl font-bold">{results.daysUntil}</p>
                    </div>
                </CardContent>
            </Card>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter your date of birth</p></div>
        )}
      </div>
    </form>
  );
}
