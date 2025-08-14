
"use client";

import { useState, useEffect } from 'react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const formSchema = z.object({
  priceBefore: z.string(),
  discountValue: z.string(),
  priceAfter: z.string(),
  discountType: z.enum(['percent', 'fixed']),
  solveFor: z.enum(['priceAfter', 'priceBefore', 'discountValue']),
});

type FormData = z.infer<typeof formSchema>;

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

export default function DiscountCalculator() {
  const [youSaved, setYouSaved] = useState<string>('');
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      priceBefore: '59.99',
      discountValue: '15',
      priceAfter: '',
      discountType: 'percent',
      solveFor: 'priceAfter',
    },
  });

  const formValues = watch();

  const calculate = () => {
      const { priceBefore, discountValue, priceAfter, discountType, solveFor } = getValues();
      const pb = parseFloat(priceBefore);
      const dv = parseFloat(discountValue);
      const pa = parseFloat(priceAfter);

      let saved = 0;

      try {
        if (solveFor === 'priceAfter' && !isNaN(pb) && !isNaN(dv)) {
          if (discountType === 'percent') {
            saved = pb * (dv / 100);
            setValue('priceAfter', (pb - saved).toFixed(2));
          } else { // fixed
            saved = dv;
            setValue('priceAfter', (pb - saved).toFixed(2));
          }
        } else if (solveFor === 'priceBefore' && !isNaN(pa) && !isNaN(dv)) {
          if (discountType === 'percent') {
            const newPriceBefore = pa / (1 - dv / 100);
            saved = newPriceBefore - pa;
            setValue('priceBefore', newPriceBefore.toFixed(2));
          } else { // fixed
            saved = dv;
            setValue('priceBefore', (pa + saved).toFixed(2));
          }
        } else if (solveFor === 'discountValue' && !isNaN(pb) && !isNaN(pa)) {
           saved = pb - pa;
           if (discountType === 'percent') {
              const newDiscountValue = (saved / pb) * 100;
              setValue('discountValue', newDiscountValue.toFixed(2));
           } else { // fixed
              setValue('discountValue', saved.toFixed(2));
           }
        }
        
        if (!isNaN(saved) && saved > 0) {
            setYouSaved(formatCurrency(saved));
        } else {
            setYouSaved('');
        }
        setFormData(getValues());

      } catch (e) {
        setYouSaved('');
      }
    };
  
  const { getValues } = useForm();


  const handleExport = (format: 'txt' | 'csv') => {
    if (!formValues) return;
    
    let content = '';
    const filename = `discount-calculation.${format}`;
    const { priceBefore, discountValue, priceAfter, discountType } = formValues;

    if (format === 'txt') {
      content = `Discount Calculation\n\nInputs:\n- Price Before Discount: ${priceBefore}\n- Discount: ${discountValue} ${discountType === 'percent' ? '%' : '$'}\n- Price After Discount: ${priceAfter}\n\nResult:\n- You Saved: ${youSaved}`;
    } else {
       content = `Price Before,Discount,Discount Type,Price After,Amount Saved\n${priceBefore},${discountValue},${discountType},${priceAfter},${youSaved.replace('$', '')}`;
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
  
  const handleClear = () => {
    setValue('priceBefore', '');
    setValue('priceAfter', '');
    setValue('discountValue', '');
    setYouSaved('');
  }

  const isInputDisabled = (field: 'priceBefore' | 'priceAfter' | 'discountValue') => formValues.solveFor === field;

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <Card>
        <CardContent className="p-6 space-y-4">
          <form onSubmit={(e) => { e.preventDefault(); calculate(); }}>
            <p className="text-sm text-muted-foreground mb-4">Please provide any 2 values to calculate the third.</p>
            
            <div className="space-y-4">
              <div>
                  <Label htmlFor="priceBefore">Price before discount</Label>
                  <div className="flex items-center gap-2">
                    <RadioGroup value={formValues.solveFor} onValueChange={(val) => setValue('solveFor', val as any)}>
                      <RadioGroupItem value="priceBefore" id="solveForPriceBefore" />
                    </RadioGroup>
                    <Controller name="priceBefore" control={control} render={({ field }) => <Input type="text" {...field} disabled={isInputDisabled('priceBefore')} />} />
                  </div>
              </div>

              <div>
                  <Label htmlFor="discountValue">Discount</Label>
                  <div className="flex items-center gap-2">
                    <RadioGroup value={formValues.solveFor} onValueChange={(val) => setValue('solveFor', val as any)}>
                      <RadioGroupItem value="discountValue" id="solveForDiscountValue" />
                    </RadioGroup>
                    <Controller name="discountValue" control={control} render={({ field }) => <Input type="text" {...field} disabled={isInputDisabled('discountValue')} />} />
                     <span className="font-semibold">{formValues.discountType === 'percent' ? '%' : '$'}</span>
                  </div>
              </div>

               <div>
                  <Label htmlFor="priceAfter">Price after discount</Label>
                  <div className="flex items-center gap-2">
                     <RadioGroup value={formValues.solveFor} onValueChange={(val) => setValue('solveFor', val as any)}>
                      <RadioGroupItem value="priceAfter" id="solveForPriceAfter" />
                     </RadioGroup>
                     <Controller name="priceAfter" control={control} render={({ field }) => <Input type="text" {...field} disabled={isInputDisabled('priceAfter')} />} />
                  </div>
              </div>

              <div>
                  <Label>You saved</Label>
                  <Input value={youSaved} readOnly className="font-bold border-dashed" />
              </div>

              <div>
                <Label>Discount type</Label>
                <Controller name="discountType" control={control} render={({ field }) => (
                  <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4 pt-2">
                    <div className="flex items-center space-x-2"><RadioGroupItem value="percent" id="percent" /><Label htmlFor="percent">Percent off</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="fixed" id="fixed" /><Label htmlFor="fixed">Fixed amount off</Label></div>
                  </RadioGroup>
                )} />
              </div>

              <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">Calculate</Button>
                  <Button type="button" onClick={handleClear} variant="outline" className="flex-1">Clear</Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="outline" disabled={!youSaved}><Download className="mr-2 h-4 w-4" /> Export</Button></DropdownMenuTrigger>
                    <DropdownMenuContent><DropdownMenuItem onClick={() => handleExport('txt')}>Download .txt</DropdownMenuItem><DropdownMenuItem onClick={() => handleExport('csv')}>Download .csv</DropdownMenuItem></DropdownMenuContent>
                  </DropdownMenu>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      
      <div className="flex items-center justify-center">
        {/* Placeholder for a potential graphic or ad space */}
        <div className="w-full h-64 bg-muted/50 rounded-lg border border-dashed flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Ad Placeholder</p>
        </div>
      </div>
    </div>
  );
}
