
"use client";

import { useState } from 'react';
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
  const [youSaved, setYouSaved] = useState<number | null>(null);

  const { control, handleSubmit, watch, setValue, getValues } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      priceBefore: '59.99',
      discountValue: '15',
      priceAfter: '',
      discountType: 'percent',
      solveFor: 'priceAfter',
    },
  });

  const solveFor = watch('solveFor');

  const handleCalculate = (data: FormData) => {
    const pb = parseFloat(data.priceBefore || '0');
    const dv = parseFloat(data.discountValue || '0');
    const pa = parseFloat(data.priceAfter || '0');

    let calculatedValue = '';
    let savedAmount = 0;

    if (data.solveFor === 'priceAfter') {
        if (pb > 0 && dv >= 0) {
            savedAmount = data.discountType === 'percent' ? pb * (dv / 100) : dv;
            calculatedValue = (pb - savedAmount).toFixed(2);
            setValue('priceAfter', calculatedValue);
        }
    } else if (data.solveFor === 'priceBefore') {
        if (pa > 0 && dv >= 0) {
            if (data.discountType === 'percent' && dv < 100) {
                const newPriceBefore = pa / (1 - dv / 100);
                savedAmount = newPriceBefore - pa;
                calculatedValue = newPriceBefore.toFixed(2);
            } else if (data.discountType === 'fixed') {
                savedAmount = dv;
                calculatedValue = (pa + dv).toFixed(2);
            }
            setValue('priceBefore', calculatedValue);
        }
    } else if (data.solveFor === 'discountValue') {
        if (pb > 0 && pa >= 0 && pb > pa) {
            savedAmount = pb - pa;
            if (data.discountType === 'percent') {
                calculatedValue = ((savedAmount / pb) * 100).toFixed(2);
            } else {
                calculatedValue = savedAmount.toFixed(2);
            }
            setValue('discountValue', calculatedValue);
        }
    }
    setYouSaved(savedAmount);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    const currentValues = getValues();
    if (youSaved === null || !currentValues) return;
    
    let content = '';
    const filename = `discount-calculation.${format}`;
    const { priceBefore, discountValue, priceAfter, discountType } = currentValues;
    const finalPrice = priceAfter;
    const finalDiscount = discountValue;
    const finalOriginal = priceBefore;
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
    setYouSaved(null);
  }

  const isInputDisabled = (field: 'priceBefore' | 'priceAfter' | 'discountValue') => solveFor === field;

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <Card>
        <CardContent className="p-6 space-y-4">
          <form onSubmit={handleSubmit(handleCalculate)}>
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
                    <Controller name="priceBefore" control={control} render={({ field }) => <Input type="text" {...field} onChange={field.onChange} disabled={isInputDisabled('priceBefore')} />} />
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
                    <Controller name="discountValue" control={control} render={({ field }) => <Input type="text" {...field} onChange={field.onChange} disabled={isInputDisabled('discountValue')} />} />
                     <span className="font-semibold">{getValues('discountType') === 'percent' ? '%' : '$'}</span>
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
                     <Controller name="priceAfter" control={control} render={({ field }) => <Input type="text" {...field} onChange={field.onChange} disabled={isInputDisabled('priceAfter')} />} />
                  </div>
              </div>

              <div>
                <Label>You Saved</Label>
                <Input value={youSaved !== null ? formatCurrency(youSaved) : ''} readOnly className="font-bold border-dashed" />
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
                  <Button type="submit" className="flex-1">Calculate</Button>
                  <Button type="button" onClick={handleClear} variant="outline" className="flex-1">Clear</Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button type="button" variant="outline" disabled={youSaved === null} className="flex-1"><Download className="mr-2 h-4 w-4" /> Export</Button></DropdownMenuTrigger>
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
