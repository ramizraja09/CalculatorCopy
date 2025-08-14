
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
  priceBefore: z.string().optional(),
  discountValue: z.string().optional(),
  priceAfter: z.string().optional(),
  discountType: z.enum(['percent', 'fixed']),
  solveFor: z.enum(['priceAfter', 'priceBefore', 'discountValue']),
});

type FormData = z.infer<typeof formSchema>;

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

export default function DiscountCalculator() {
  
  const { control, watch, setValue, getValues } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      priceBefore: '59.99',
      discountValue: '15',
      priceAfter: '',
      discountType: 'percent',
      solveFor: 'priceAfter',
    },
    mode: 'onChange',
  });

  const formValues = watch();
  
  const { priceBefore, discountValue, priceAfter, discountType, solveFor } = formValues;
  const pb = parseFloat(priceBefore || '0');
  const dv = parseFloat(discountValue || '0');
  const pa = parseFloat(priceAfter || '0');

  let calculatedValue = '';
  let youSaved = 0;

  if (solveFor === 'priceAfter' && pb > 0 && dv >= 0) {
      if (discountType === 'percent') {
          youSaved = pb * (dv / 100);
          calculatedValue = (pb - youSaved).toFixed(2);
      } else { // fixed
          youSaved = dv;
          calculatedValue = (pb - saved).toFixed(2);
      }
  } else if (solveFor === 'priceBefore' && pa > 0 && dv >= 0) {
      if (discountType === 'percent' && dv < 100) {
          const newPriceBefore = pa / (1 - dv / 100);
          youSaved = newPriceBefore - pa;
          calculatedValue = newPriceBefore.toFixed(2);
      } else if (discountType === 'fixed') {
          youSaved = dv;
          calculatedValue = (pa + saved).toFixed(2);
      }
  } else if (solveFor === 'discountValue' && pb > 0 && pa >= 0 && pb > pa) {
        youSaved = pb - pa;
        if (discountType === 'percent') {
          calculatedValue = ((youSaved / pb) * 100).toFixed(2);
        } else { // fixed
          calculatedValue = youSaved.toFixed(2);
        }
  } else if (pb > 0 && pa > 0) {
      youSaved = pb - pa;
  }

  const handleExport = (format: 'txt' | 'csv') => {
    const currentValues = getValues();
    if (!currentValues) return;
    
    let content = '';
    const filename = `discount-calculation.${format}`;
    const { priceBefore, discountValue, priceAfter, discountType, solveFor } = currentValues;
    const finalPrice = solveFor === 'priceAfter' ? calculatedValue : priceAfter;
    const finalDiscount = solveFor === 'discountValue' ? calculatedValue : discountValue;
    const finalOriginal = solveFor === 'priceBefore' ? calculatedValue : priceBefore;
    const savedAmount = formatCurrency(parseFloat(finalOriginal || '0') - parseFloat(finalPrice || '0'));


    if (format === 'txt') {
      content = `Discount Calculation\n\nInputs:\n- Price Before Discount: ${finalOriginal}\n- Discount: ${finalDiscount} ${discountType === 'percent' ? '%' : '$'}\n- Price After Discount: ${finalPrice}\n\nResult:\n- You Saved: ${savedAmount}`;
    } else {
       content = `Price Before,Discount,Discount Type,Price After,Amount Saved\n${finalOriginal},${finalDiscount},${discountType},${finalPrice},${savedAmount.replace('$', '')}`;
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
  }

  const isInputDisabled = (field: 'priceBefore' | 'priceAfter' | 'discountValue') => formValues.solveFor === field;

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <Card>
        <CardContent className="p-6 space-y-4">
          <form onSubmit={(e) => e.preventDefault()}>
            <p className="text-sm text-muted-foreground mb-4">Select which value to solve for, then enter the other two.</p>
            
            <div className="space-y-4">
              <div>
                  <Label htmlFor="priceBefore">Original Price</Label>
                  <div className="flex items-center gap-2">
                    <Controller name="solveFor" control={control} render={({ field }) => (
                      <RadioGroup onValueChange={field.onChange} value={field.value}>
                        <RadioGroupItem value="priceBefore" id="solveForPriceBefore" />
                      </RadioGroup>
                    )}/>
                    <Controller name="priceBefore" control={control} render={({ field }) => <Input type="text" {...field} value={isInputDisabled('priceBefore') ? calculatedValue : field.value || ''} onChange={field.onChange} disabled={isInputDisabled('priceBefore')} />} />
                  </div>
              </div>

              <div>
                  <Label htmlFor="discountValue">Discount</Label>
                  <div className="flex items-center gap-2">
                    <Controller name="solveFor" control={control} render={({ field }) => (
                      <RadioGroup onValueChange={field.onChange} value={field.value}>
                        <RadioGroupItem value="discountValue" id="solveForDiscountValue" />
                      </RadioGroup>
                    )}/>
                    <Controller name="discountValue" control={control} render={({ field }) => <Input type="text" {...field} value={isInputDisabled('discountValue') ? calculatedValue : field.value || ''} onChange={field.onChange} disabled={isInputDisabled('discountValue')} />} />
                     <span className="font-semibold">{formValues.discountType === 'percent' ? '%' : '$'}</span>
                  </div>
              </div>

               <div>
                  <Label htmlFor="priceAfter">Final Price</Label>
                  <div className="flex items-center gap-2">
                     <Controller name="solveFor" control={control} render={({ field }) => (
                      <RadioGroup onValueChange={field.onChange} value={field.value}>
                        <RadioGroupItem value="priceAfter" id="solveForPriceAfter" />
                      </RadioGroup>
                     )}/>
                     <Controller name="priceAfter" control={control} render={({ field }) => <Input type="text" {...field} value={isInputDisabled('priceAfter') ? calculatedValue : field.value || ''} onChange={field.onChange} disabled={isInputDisabled('priceAfter')} />} />
                  </div>
              </div>

              <div>
                <Label>You Saved</Label>
                <Input value={formatCurrency(youSaved)} readOnly className="font-bold border-dashed" />
              </div>

              <div>
                <Label>Discount type</Label>
                <Controller name="discountType" control={control} render={({ field }) => (
                  <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4 pt-2">
                    <div className="flex items-center space-x-2"><RadioGroupItem value="percent" id="percent" /><Label htmlFor="percent">Percent off (%)</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="fixed" id="fixed" /><Label htmlFor="fixed">Fixed amount off ($)</Label></div>
                  </RadioGroup>
                )} />
              </div>

              <div className="flex gap-2 pt-4">
                  <Button type="button" onClick={handleClear} variant="outline" className="flex-1">Clear</Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button type="button" variant="outline" disabled={!youSaved} className="flex-1"><Download className="mr-2 h-4 w-4" /> Export</Button></DropdownMenuTrigger>
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
