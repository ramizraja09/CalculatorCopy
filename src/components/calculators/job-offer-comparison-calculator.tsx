
"use client";

import { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Download, CheckCircle2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from '@/components/ui/separator';

const offerSchema = z.object({
  name: z.string().nonempty("Name is required"),
  salary: z.number().min(0),
  bonus: z.number().min(0),
  benefits: z.number().min(0),
  ptoDays: z.number().min(0),
  perks: z.number().min(0),
  costOfLiving: z.number().min(1),
  hoursPerWeek: z.number().min(1),
});

const formSchema = z.object({
  offers: z.array(offerSchema).length(2),
});
type FormData = z.infer<typeof formSchema>;

const WORKING_DAYS_PER_YEAR = 260;
const STORAGE_KEY = 'job-offer-comparison-data';

export default function JobOfferComparisonCalculator() {
  const [isClient, setIsClient] = useState(false);

  const { control, setValue, watch } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      offers: [
        { name: 'Job A', salary: 90000, bonus: 5000, benefits: 6000, perks: 1000, ptoDays: 20, costOfLiving: 100, hoursPerWeek: 40 },
        { name: 'Job B', salary: 100000, bonus: 2000, benefits: 8000, perks: 500, ptoDays: 15, costOfLiving: 110, hoursPerWeek: 45 },
      ],
    },
  });
  
  const { fields } = useFieldArray({ control, name: "offers" });
  const formData = watch();

  useEffect(() => {
    setIsClient(true);
    try {
      const storedData = localStorage.getItem(STORAGE_KEY);
      if (storedData) {
        const parsedData: FormData = JSON.parse(storedData);
        setValue('offers', parsedData.offers);
      }
    } catch (e) {
      console.error("Could not load data from local storage", e);
    }
  }, [setValue]);

  useEffect(() => {
    if (isClient) {
      const subscription = watch((value) => {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
        } catch (e) {
          console.error("Could not save data to local storage", e);
        }
      });
      return () => subscription.unsubscribe();
    }
  }, [watch, isClient]);

  const calculateOfferValues = (offer: z.infer<typeof offerSchema>) => {
    const ptoValue = (offer.salary / WORKING_DAYS_PER_YEAR) * offer.ptoDays;
    const totalCompensation = offer.salary + offer.bonus + offer.benefits + offer.perks + ptoValue;
    const adjustedSalary = (totalCompensation / offer.costOfLiving) * 100;
    const hourlyRate = totalCompensation / (offer.hoursPerWeek * 52);

    return { ptoValue, totalCompensation, adjustedSalary, hourlyRate };
  };

  const results = formData.offers.map(calculateOfferValues);
  const betterOfferIndex = results[0]?.totalCompensation > results[1]?.totalCompensation ? 0 : 1;
  
  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const handleExport = (format: 'txt' | 'csv') => {
    if (!formData || !formData.offers) return;
    
    let content = '';
    const filename = `job-offer-comparison.${format}`;

    if (format === 'txt') {
      content = `Job Offer Comparison\n\n`;
      formData.offers.forEach((offer, index) => {
        const offerResults = results[index];
        content += `--- Offer: ${offer.name} ---\n`;
        content += `Base Salary: ${formatCurrency(offer.salary)}\n`;
        content += `Bonus/Commission: ${formatCurrency(offer.bonus)}\n`;
        content += `Benefits Value: ${formatCurrency(offer.benefits)}\n`;
        content += `PTO Value: ${formatCurrency(offerResults.ptoValue)}\n`;
        content += `Other Perks: ${formatCurrency(offer.perks)}\n`;
        content += `Total Compensation: ${formatCurrency(offerResults.totalCompensation)}\n`;
        content += `Cost of Living Adjusted Comp: ${formatCurrency(offerResults.adjustedSalary)}\n`;
        content += `Effective Hourly Rate: ${formatCurrency(offerResults.hourlyRate)}\n\n`;
      });
    } else {
      content = 'Metric,Offer A,Offer B\n';
      const offerA = formData.offers[0];
      const offerB = formData.offers[1];
      const resultsA = results[0];
      const resultsB = results[1];
      content += `Job Title,${offerA.name},${offerB.name}\n`;
      content += `Base Salary,${offerA.salary},${offerB.salary}\n`;
      content += `Bonus/Commission,${offerA.bonus},${offerB.bonus}\n`;
      content += `Benefits Value,${offerA.benefits},${offerB.benefits}\n`;
      content += `PTO Value,${resultsA.ptoValue.toFixed(2)},${resultsB.ptoValue.toFixed(2)}\n`;
      content += `Other Perks,${offerA.perks},${offerB.perks}\n`;
      content += `Total Compensation,${resultsA.totalCompensation.toFixed(2)},${resultsB.totalCompensation.toFixed(2)}\n`;
      content += `CoL Adjusted Comp,${resultsA.adjustedSalary.toFixed(2)},${resultsB.adjustedSalary.toFixed(2)}\n`;
      content += `Effective Hourly Rate,${resultsA.hourlyRate.toFixed(2)},${resultsB.hourlyRate.toFixed(2)}\n`;
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
    <div className="space-y-8">
      <div className="grid md:grid-cols-2 gap-8">
        {fields.map((field, index) => (
          <Card key={field.id} className={cn("transition-shadow", index === betterOfferIndex && "shadow-xl border-primary")}>
            <CardHeader className="flex flex-row items-center justify-between">
              <Controller name={`offers.${index}.name`} control={control} render={({ field }) => (
                <Input {...field} className="text-xl font-bold border-0 shadow-none focus-visible:ring-0 p-0" />
              )} />
              {index === betterOfferIndex && <CheckCircle2 className="h-6 w-6 text-primary" />}
            </CardHeader>
            <CardContent className="space-y-4">
              <div><Label className="text-sm">Base Salary ($)</Label><Controller name={`offers.${index}.salary`} control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
              <div><Label className="text-sm">Bonus / Commission ($)</Label><Controller name={`offers.${index}.bonus`} control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
              <div><Label className="text-sm">Benefits Value (annual, $)</Label><Controller name={`offers.${index}.benefits`} control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
              <div><Label className="text-sm">Other Perks Value ($)</Label><Controller name={`offers.${index}.perks`} control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
              <Separator />
              <div><Label className="text-sm">Paid Vacation Days</Label><Controller name={`offers.${index}.ptoDays`} control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
              <div><Label className="text-sm">Working Hours / Week</Label><Controller name={`offers.${index}.hoursPerWeek`} control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
              <div><Label className="text-sm">Cost of Living Index (%)</Label><Controller name={`offers.${index}.costOfLiving`} control={control} render={({ field }) => <Input type="number" placeholder="e.g. 100 for baseline" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
            <CardTitle>Comparison Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4 text-center">
                 <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Compensation</p>
                    <p className="text-xl font-bold">{formatCurrency(results[0].totalCompensation)} vs {formatCurrency(results[1].totalCompensation)}</p>
                </div>
                 <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Adjusted for Cost of Living</p>
                    <p className="text-xl font-bold">{formatCurrency(results[0].adjustedSalary)} vs {formatCurrency(results[1].adjustedSalary)}</p>
                </div>
                 <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Effective Hourly Rate</p>
                    <p className="text-xl font-bold">{formatCurrency(results[0].hourlyRate)} vs {formatCurrency(results[1].hourlyRate)}</p>
                </div>
            </div>
             <div className="flex justify-center">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" /> Export Comparison
                    </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleExport('txt')}>Download as .txt</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('csv')}>Download as .csv</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
