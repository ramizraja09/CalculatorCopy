
"use client";

import { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CheckCircle2, Trash, Download } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


const offerSchema = z.object({
  name: z.string().nonempty("Name is required"),
  salary: z.number().min(0),
  bonus: z.number().min(0),
  benefitsValue: z.number().min(0),
  vacationDays: z.number().min(0),
  otherPerks: z.number().min(0),
  costOfLivingIndex: z.number().min(1).default(100),
  workingHours: z.number().min(1).max(100),
});

const formSchema = z.object({
  offers: z.array(offerSchema).min(1),
});
type FormData = z.infer<typeof formSchema>;

const defaultOffers = [
    { name: 'Job Offer A', salary: 90000, bonus: 5000, benefitsValue: 12000, vacationDays: 20, otherPerks: 1000, costOfLivingIndex: 100, workingHours: 40 },
    { name: 'Job Offer B', salary: 85000, bonus: 10000, benefitsValue: 15000, vacationDays: 25, otherPerks: 500, costOfLivingIndex: 90, workingHours: 38 },
];

export default function JobOfferComparisonCalculator() {
  const [isClient, setIsClient] = useState(false);
  const { control, watch, reset } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      offers: defaultOffers,
    },
  });
  
  const { fields, append, remove } = useFieldArray({ control, name: "offers" });
  const watchedOffers = watch("offers");
  
  useEffect(() => {
    setIsClient(true);
    try {
      const savedData = localStorage.getItem('jobOfferComparisonData');
      if (savedData) {
        reset(JSON.parse(savedData));
      }
    } catch(e) {
      console.error("Failed to load data from local storage", e);
    }
  }, [reset]);

  useEffect(() => {
    if(isClient) {
      localStorage.setItem('jobOfferComparisonData', JSON.stringify(watchedOffers));
    }
  }, [watchedOffers, isClient]);

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const calculatedResults = watchedOffers.map(offer => {
      const workingDaysPerYear = 260; 
      const vacationValue = (offer.salary / workingDaysPerYear) * offer.vacationDays;
      const totalCompensation = offer.salary + offer.bonus + offer.benefitsValue + vacationValue + offer.otherPerks;
      const costAdjustedSalary = totalCompensation * (offer.costOfLivingIndex / 100);
      const annualHours = offer.workingHours * 52;
      const hourlyRate = totalCompensation / annualHours;

      return {
        ...offer,
        vacationValue,
        totalCompensation,
        costAdjustedSalary,
        hourlyRate,
      };
    });

  const betterOfferIndex = calculatedResults.length > 0 ? calculatedResults.reduce((best, current, index) => {
      if (current.costAdjustedSalary > best.value) {
          return { index, value: current.costAdjustedSalary };
      }
      return best;
  }, { index: -1, value: -Infinity }).index : null;


  const handleAddNewOffer = () => {
    append({ name: `Job Offer ${String.fromCharCode(65 + fields.length)}`, salary: 0, bonus: 0, benefitsValue: 0, vacationDays: 15, otherPerks: 0, costOfLivingIndex: 100, workingHours: 40 });
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (calculatedResults.length === 0) return;
    
    let content = '';
    const filename = `job-offer-comparison.${format}`;

    if (format === 'txt') {
      calculatedResults.forEach(offer => {
        content += `Offer: ${offer.name}\n`;
        content += `-------------------------\n`;
        content += `Base Salary: ${formatCurrency(offer.salary)}\n`;
        content += `Bonus: ${formatCurrency(offer.bonus)}\n`;
        content += `Benefits Value: ${formatCurrency(offer.benefitsValue)}\n`;
        content += `Vacation Value: ${formatCurrency(offer.vacationValue)}\n`;
        content += `Total Compensation: ${formatCurrency(offer.totalCompensation)}\n`;
        content += `Adj. Compensation (COL): ${formatCurrency(offer.costAdjustedSalary)}\n`;
        content += `Effective Hourly Rate: ${formatCurrency(offer.hourlyRate)}\n\n`;
      });
    } else {
      const headers = ['Offer Name', 'Base Salary', 'Bonus', 'Benefits Value', 'Vacation Value', 'Total Comp.', 'Adj. Comp.', 'Hourly Rate'];
      content += headers.join(',') + '\n';
      calculatedResults.forEach(offer => {
        const row = [
          `"${offer.name}"`,
          offer.salary,
          offer.bonus,
          offer.benefitsValue,
          offer.vacationValue.toFixed(2),
          offer.totalCompensation.toFixed(2),
          offer.costAdjustedSalary.toFixed(2),
          offer.hourlyRate.toFixed(2)
        ];
        content += row.join(',') + '\n';
      });
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

  if (!isClient) {
    return <div>Loading...</div>; // Or a skeleton loader
  }

  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-2 gap-8">
        {fields.map((field, index) => (
          <Card key={field.id} className={cn("transition-shadow", index === betterOfferIndex && "shadow-xl border-primary")}>
            <CardHeader className="flex flex-row items-center justify-between">
              <Controller name={`offers.${index}.name`} control={control} render={({ field }) => (
                <Input {...field} className="text-xl font-bold border-0 shadow-none focus-visible:ring-0 p-0" />
              )} />
               {fields.length > 1 && <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash className="h-4 w-4" /></Button>}
            </CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Base Salary ($)</Label><Controller name={`offers.${index}.salary`} control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
              <div><Label>Bonus / Commission ($)</Label><Controller name={`offers.${index}.bonus`} control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
              <div><Label>Benefits Value ($)</Label><Controller name={`offers.${index}.benefitsValue`} control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
              <div><Label>Paid Vacation Days</Label><Controller name={`offers.${index}.vacationDays`} control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
              <div><Label>Other Perks ($)</Label><Controller name={`offers.${index}.otherPerks`} control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
              <div><Label>Cost of Living Index (%)</Label><Controller name={`offers.${index}.costOfLivingIndex`} control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
              <div><Label>Working Hours per Week</Label><Controller name={`offers.${index}.workingHours`} control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
            </CardContent>
             {index === betterOfferIndex && (
                 <CardFooter className="bg-primary/10 text-primary-foreground p-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mr-2"/>
                    <p className="text-sm font-semibold text-primary">This looks like the better offer!</p>
                </CardFooter>
             )}
          </Card>
        ))}
      </div>
      
      <div className="flex justify-center gap-4">
        <Button type="button" variant="outline" onClick={handleAddNewOffer}>Add Another Offer</Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" disabled={calculatedResults.length === 0}>
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleExport('txt')}>Download as .txt</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('csv')}>Download as .csv</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {calculatedResults.length > 0 && (
        <Card>
            <CardHeader>
                <CardTitle>Comparison Summary</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Metric</TableHead>
                            {calculatedResults.map((res, index) => <TableHead key={index} className="text-right">{res.name}</TableHead>)}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow><TableCell>Base Salary</TableCell>{calculatedResults.map((r,i) => <TableCell key={i} className="text-right">{formatCurrency(r.salary)}</TableCell>)}</TableRow>
                        <TableRow><TableCell>Bonus</TableCell>{calculatedResults.map((r,i) => <TableCell key={i} className="text-right">{formatCurrency(r.bonus)}</TableCell>)}</TableRow>
                        <TableRow><TableCell>Benefits Value</TableCell>{calculatedResults.map((r,i) => <TableCell key={i} className="text-right">{formatCurrency(r.benefitsValue)}</TableCell>)}</TableRow>
                        <TableRow><TableCell>Vacation Value</TableCell>{calculatedResults.map((r,i) => <TableCell key={i} className="text-right">{formatCurrency(r.vacationValue)}</TableCell>)}</TableRow>
                         <TableRow className="font-semibold"><TableCell>Total Compensation</TableCell>{calculatedResults.map((r,i) => <TableCell key={i} className="text-right">{formatCurrency(r.totalCompensation)}</TableCell>)}</TableRow>
                        <TableRow className="bg-muted/50 font-bold text-primary"><TableCell>Adj. Compensation</TableCell>{calculatedResults.map((r,i) => <TableCell key={i} className={cn("text-right", i === betterOfferIndex && "text-primary")}>{formatCurrency(r.costAdjustedSalary)}</TableCell>)}</TableRow>
                         <TableRow><TableCell>Effective Hourly Rate</TableCell>{calculatedResults.map((r,i) => <TableCell key={i} className="text-right">{formatCurrency(r.hourlyRate)}</TableCell>)}</TableRow>
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
