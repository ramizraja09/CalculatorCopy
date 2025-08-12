
"use client";

import { useForm, useFieldArray, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const offerSchema = z.object({
  name: z.string().nonempty(),
  salary: z.number().min(0),
  bonus: z.number().min(0),
  healthcare: z.number().min(0),
  ptoDays: z.number().min(0),
});

const formSchema = z.object({
  offers: z.array(offerSchema).length(2),
});
type FormData = z.infer<typeof formSchema>;

export default function JobOfferComparisonCalculator() {
  const { control } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      offers: [
        { name: 'Job A', salary: 90000, bonus: 5000, healthcare: 400, ptoDays: 20 },
        { name: 'Job B', salary: 95000, bonus: 0, healthcare: 600, ptoDays: 15 },
      ],
    },
  });
  const { fields } = useFieldArray({ control, name: "offers" });
  const formData = useWatch({ control });
  
  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const handleExport = (format: 'txt' | 'csv') => {
    if (!formData || !formData.offers) return;
    
    let content = '';
    const filename = `job-offer-comparison.${format}`;

    if (format === 'txt') {
      content = `Job Offer Comparison\n\n`;
      formData.offers.forEach(offer => {
        content += `Offer: ${offer.name}\n`;
        content += `- Salary: ${formatCurrency(offer.salary)}\n`;
        content += `- Bonus: ${formatCurrency(offer.bonus)}\n`;
        content += `- Monthly Healthcare Cost: ${formatCurrency(offer.healthcare)}\n`;
        content += `- PTO Days: ${offer.ptoDays}\n\n`;
      });
    } else {
      content = 'Offer Name,Salary,Bonus,Monthly Healthcare Cost,PTO Days\n';
      formData.offers.forEach(offer => {
        content += `"${offer.name}",${offer.salary},${offer.bonus},${offer.healthcare},${offer.ptoDays}\n`;
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

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-8">
        {fields.map((field, index) => (
          <Card key={field.id}>
            <CardHeader>
              <Controller name={`offers.${index}.name`} control={control} render={({ field }) => (
                <Input {...field} className="text-xl font-bold border-0 shadow-none focus-visible:ring-0 p-0" />
              )} />
            </CardHeader>
            <CardContent className="space-y-2">
              <div><label className="text-sm text-muted-foreground">Annual Salary</label><Controller name={`offers.${index}.salary`} control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
              <div><label className="text-sm text-muted-foreground">Annual Bonus</label><Controller name={`offers.${index}.bonus`} control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
              <div><label className="text-sm text-muted-foreground">Monthly Healthcare Cost</label><Controller name={`offers.${index}.healthcare`} control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
              <div><label className="text-sm text-muted-foreground">Paid Time Off (Days)</label><Controller name={`offers.${index}.ptoDays`} control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
            </CardContent>
          </Card>
        ))}
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
    </div>
  );
}
