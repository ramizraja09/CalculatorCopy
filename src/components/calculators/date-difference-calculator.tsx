
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { differenceInYears, differenceInMonths, differenceInDays, subYears, subMonths } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download } from 'lucide-react';

const formSchema = z.object({
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" }),
}).refine(data => new Date(data.endDate) > new Date(data.startDate), {
    message: "End date must be after start date",
    path: ['endDate'],
});

type FormData = z.infer<typeof formSchema>;

export default function DateDifferenceCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { startDate: new Date().toISOString().split('T')[0], endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
  });

  const calculateDifference = (data: FormData) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    
    const totalDays = differenceInDays(end, start);
    const years = differenceInYears(end, start);
    const months = differenceInMonths(end, subYears(start, years));
    const days = differenceInDays(end, subMonths(subYears(start, years), months));

    setResults({ years, months, days, totalDays });
    setFormData(data);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    const { startDate, endDate } = formData;
    const { years, months, days, totalDays } = results;
    
    let content = '';
    const filename = `date-difference-result.${format}`;
    const differenceString = `${years}y ${months}m ${days}d`;

    if (format === 'txt') {
      content = `Date Difference Result\n\nInputs:\n- Start Date: ${startDate}\n- End Date: ${endDate}\n\nResult:\n- Difference: ${differenceString}\n- Total Days: ${totalDays.toLocaleString()}`;
    } else {
      content = `Start Date,End Date,Result (Difference),Result (Total Days)\n${startDate},${endDate},"${differenceString}",${totalDays}`;
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
    <form onSubmit={handleSubmit(calculateDifference)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Input</h3>
        <div>
          <Label htmlFor="startDate">Start Date</Label>
          <Controller name="startDate" control={control} render={({ field }) => <Input type="date" {...field} />} />
        </div>
        <div>
          <Label htmlFor="endDate">End Date</Label>
          <Controller name="endDate" control={control} render={({ field }) => <Input type="date" {...field} />} />
          {errors.endDate && <p className="text-destructive text-sm mt-1">{errors.endDate.message}</p>}
        </div>
        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Calculate Difference</Button>
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
                        <p className="text-sm text-muted-foreground">Difference</p>
                        <p className="text-2xl font-bold">{results.years} years, {results.months} months, {results.days} days</p>
                    </div>
                     <div>
                        <p className="text-sm text-muted-foreground">Total Days</p>
                        <p className="text-2xl font-bold">{results.totalDays}</p>
                    </div>
                </CardContent>
            </Card>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter two dates</p></div>
        )}
      </div>
    </form>
  );
}
