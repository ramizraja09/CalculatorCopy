
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { differenceInYears, differenceInMonths, differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds, addYears, addMonths } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download } from 'lucide-react';

const formSchema = z.object({
  birthDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" }),
  ageAtDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" }),
}).refine(data => new Date(data.ageAtDate) >= new Date(data.birthDate), {
    message: "Target date must be after birth date.",
    path: ["ageAtDate"],
});

type FormData = z.infer<typeof formSchema>;

export default function AgeCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { 
      birthDate: '1990-01-01',
      ageAtDate: new Date().toISOString().split('T')[0]
    },
  });

  const calculateAge = (data: FormData) => {
    const targetDate = new Date(data.ageAtDate);
    const birthDate = new Date(data.birthDate);
    
    // Exact age calculation
    const years = differenceInYears(targetDate, birthDate);
    const months = differenceInMonths(targetDate, addYears(birthDate, years));
    const days = differenceInDays(targetDate, addMonths(addYears(birthDate, years), months));

    // Total duration calculations
    const totalDays = differenceInDays(targetDate, birthDate);
    const totalHours = differenceInHours(targetDate, birthDate);
    const totalMinutes = differenceInMinutes(targetDate, birthDate);
    const totalSeconds = differenceInSeconds(targetDate, birthDate);

    setResults({ years, months, days, totalDays, totalHours, totalMinutes, totalSeconds });
    setFormData(data);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    const { birthDate, ageAtDate } = formData;
    const { years, months, days, totalDays } = results;
    
    let content = '';
    const filename = `age-calculation-result.${format}`;
    const ageString = `${years}y ${months}m ${days}d`;

    if (format === 'txt') {
      content = `Age Calculation Result\n\nInputs:\n- Birth Date: ${birthDate}\n- Age at Date: ${ageAtDate}\n\nResult:\n- Age: ${ageString}\n- Total Days: ${totalDays.toLocaleString()}`;
    } else {
      content = `Birth Date,Age at Date,Result (Age),Result (Total Days)\n${birthDate},${ageAtDate},"${ageString}",${totalDays}`;
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
    <form onSubmit={handleSubmit(calculateAge)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Input</h3>
        <div>
          <Label htmlFor="birthDate">Date of Birth</Label>
          <Controller name="birthDate" control={control} render={({ field }) => <Input type="date" {...field} />} />
          {errors.birthDate && <p className="text-destructive text-sm mt-1">{errors.birthDate.message}</p>}
        </div>
        <div>
          <Label htmlFor="ageAtDate">Age at the Date of</Label>
          <Controller name="ageAtDate" control={control} render={({ field }) => <Input type="date" {...field} />} />
          {errors.ageAtDate && <p className="text-destructive text-sm mt-1">{errors.ageAtDate.message}</p>}
        </div>
        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Calculate Age</Button>
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
                <CardContent className="p-6 space-y-4">
                    <div>
                        <p className="text-sm text-muted-foreground">Age</p>
                        <p className="text-2xl font-bold">{results.years} Years, {results.months} Months, {results.days} Days</p>
                    </div>
                     <div className="text-sm space-y-1 text-muted-foreground pt-4 border-t">
                        <p>or {results.totalDays.toLocaleString()} days</p>
                        <p>or {results.totalHours.toLocaleString()} hours</p>
                        <p>or {results.totalMinutes.toLocaleString()} minutes</p>
                        <p>or {results.totalSeconds.toLocaleString()} seconds</p>
                    </div>
                </CardContent>
            </Card>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter dates to calculate age</p></div>
        )}
      </div>
    </form>
  );
}
