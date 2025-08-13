
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  propertyValue: z.number().min(1, "Property value must be positive"),
  firstMortgage: z.number().min(1, "First mortgage balance is required"),
  secondLien: z.number().min(0, "Must be non-negative").optional(),
  otherLiens: z.number().min(0, "Must be non-negative").optional(),
}).refine(data => data.firstMortgage <= data.propertyValue, {
  message: "First mortgage balance cannot be greater than property value.",
  path: ["firstMortgage"],
});

type FormData = z.infer<typeof formSchema>;

export default function LtvCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      propertyValue: 350000,
      firstMortgage: 100000,
      secondLien: 50000,
      otherLiens: 15000,
    },
  });

  const calculateLtv = (data: FormData) => {
    const { propertyValue, firstMortgage, secondLien = 0, otherLiens = 0 } = data;
    
    const firstMortgageLtv = (firstMortgage / propertyValue) * 100;
    const totalLiens = firstMortgage + secondLien + otherLiens;
    const cumulativeLtv = (totalLiens / propertyValue) * 100;
    
    setResults({
      firstMortgageLtv: firstMortgageLtv.toFixed(2),
      cumulativeLtv: cumulativeLtv.toFixed(2),
    });
    setFormData(data);
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `ltv-calculation.${format}`;
    const { propertyValue, firstMortgage, secondLien, otherLiens } = formData;

    if (format === 'txt') {
      content = `Loan-to-Value (LTV) Calculation\n\nInputs:\n- Property Value: ${formatCurrency(propertyValue)}\n- First Mortgage: ${formatCurrency(firstMortgage)}\n- Second Lien: ${formatCurrency(secondLien || 0)}\n- Other Liens: ${formatCurrency(otherLiens || 0)}\n\nResult:\n- First Mortgage LTV: ${results.firstMortgageLtv}%\n- Cumulative LTV: ${results.cumulativeLtv}%`;
    } else {
       content = `Property Value,First Mortgage,Second Lien,Other Liens,First Mortgage LTV (%),Cumulative LTV (%)\n${propertyValue},${firstMortgage},${secondLien || 0},${otherLiens || 0},${results.firstMortgageLtv},${results.cumulativeLtv}`;
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
    <form onSubmit={handleSubmit(calculateLtv)} className="space-y-4">
      <Card>
          <CardHeader>
              <CardTitle>To find out your loan-to-value ratio, enter the amounts below.</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 items-center gap-4">
                  <Label htmlFor="propertyValue">Current appraised value or market value of home</Label>
                  <Controller name="propertyValue" control={control} render={({ field }) => <Input id="propertyValue" type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
                  {errors.propertyValue && <p className="text-destructive text-sm col-span-2">{errors.propertyValue.message}</p>}
              </div>
              <div className="grid md:grid-cols-2 items-center gap-4">
                  <Label htmlFor="firstMortgage">Outstanding balance on first mortgage</Label>
                  <Controller name="firstMortgage" control={control} render={({ field }) => <Input id="firstMortgage" type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
                  {errors.firstMortgage && <p className="text-destructive text-sm col-span-2">{errors.firstMortgage.message}</p>}
              </div>

              <div className="space-y-6 pt-4 border-t">
                  <h4 className="font-semibold text-lg">Have a second mortgage or other lien on the property?</h4>
                  <div className="grid md:grid-cols-2 items-center gap-4">
                      <Label htmlFor="secondLien">Current balance on home equity line or home equity loan</Label>
                      <Controller name="secondLien" control={control} render={({ field }) => <Input id="secondLien" type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
                  </div>
                  <div className="grid md:grid-cols-2 items-center gap-4">
                      <Label htmlFor="otherLiens">Any other liens on the property (tax liens, mechanics liens, etc)</Label>
                      <Controller name="otherLiens" control={control} render={({ field }) => <Input id="otherLiens" type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
                  </div>
              </div>

              <div className="flex justify-center pt-4">
                <Button type="submit" className="w-full max-w-xs">Calculate</Button>
              </div>

          </CardContent>
      </Card>

      {results && (
        <Card className="mt-6">
            <CardContent className="p-0">
                <div className="flex justify-between p-4">
                    <p className="font-semibold">First mortgage loan-to-value</p>
                    <p>{results.firstMortgageLtv}%</p>
                </div>
                <div className="flex justify-between p-4 border-t bg-muted/50">
                    <p className="font-semibold">Cumulative loan-to-value</p>
                    <p className="font-bold">{results.cumulativeLtv}%</p>
                </div>
            </CardContent>
        </Card>
      )}
    </form>
  );
}
