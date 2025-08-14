
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from 'recharts';

const formSchema = z.object({
  priceBefore: z.string().optional(),
  discountValue: z.string().optional(),
  priceAfter: z.string().optional(),
  discountType: z.enum(['percent', 'fixed']),
  solveFor: z.enum(['priceAfter', 'priceBefore', 'discountValue']),
}).refine(data => {
    const values = [data.priceBefore, data.discountValue, data.priceAfter];
    const emptyCount = values.filter(v => v === undefined || v === '').length;
    return emptyCount === 1;
}, {
    message: "Please provide exactly two values to solve for the third.",
    path: ['priceBefore'], 
});


type FormData = z.infer<typeof formSchema>;
const PIE_COLORS = ['hsl(var(--chart-2))', 'hsl(var(--chart-1))'];

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

export default function DiscountCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
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
    let { priceBefore, discountValue, priceAfter, discountType, solveFor } = data;
    
    let pb = parseFloat(priceBefore || '0');
    let dv = parseFloat(discountValue || '0');
    let pa = parseFloat(priceAfter || '0');
    
    let savedAmount = 0;
    let finalPrice = 0;
    let originalPrice = 0;
    let finalDiscountValue = 0;

    if (solveFor === 'priceAfter') {
        savedAmount = discountType === 'percent' ? pb * (dv / 100) : dv;
        finalPrice = pb - savedAmount;
        originalPrice = pb;
        finalDiscountValue = dv;
    } else if (solveFor === 'priceBefore') {
        if (discountType === 'percent') {
            originalPrice = pa / (1 - dv / 100);
            savedAmount = originalPrice - pa;
        } else {
            originalPrice = pa + dv;
            savedAmount = dv;
        }
        finalPrice = pa;
        finalDiscountValue = dv;
    } else { // solve for discountValue
        savedAmount = pb - pa;
        if (discountType === 'percent') {
            finalDiscountValue = (savedAmount / pb) * 100;
        } else {
            finalDiscountValue = savedAmount;
        }
        finalPrice = pa;
        originalPrice = pb;
    }
    
    setResults({
        finalPrice: finalPrice,
        originalPrice: originalPrice,
        savedAmount: savedAmount,
        discountValue: finalDiscountValue,
        discountType: discountType,
        pieData: [
            { name: 'Amount Paid', value: finalPrice },
            { name: 'Amount Saved', value: savedAmount },
        ]
    });
    setFormData(data);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `discount-calculation.${format}`;

    if (format === 'txt') {
      content = `Discount Calculation\n\nInputs:\n- Solve For: ${formData.solveFor}\n- Original Price: ${formData.priceBefore}\n- Discount: ${formData.discountValue} ${formData.discountType}\n- Final Price: ${formData.priceAfter}\n\nResult:\n- Original Price: ${formatCurrency(results.originalPrice)}\n- Final Price: ${formatCurrency(results.finalPrice)}\n- You Saved: ${formatCurrency(results.savedAmount)}`;
    } else {
       content = `Original Price,Discount,Discount Type,Final Price,Amount Saved\n${results.originalPrice},${results.discountValue},${results.discountType},${results.finalPrice},${results.savedAmount}`;
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
    setResults(null);
    setFormData(null);
  }

  const isInputDisabled = (field: 'priceBefore' | 'priceAfter' | 'discountValue') => solveFor === field;

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Discount Details</CardTitle>
            <CardContent className="text-sm text-muted-foreground p-0 pt-2">
                Select which value to solve for, then enter the other two.
            </CardContent>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <form onSubmit={handleSubmit(handleCalculate)} className="space-y-4">
              <div>
                  <Label htmlFor="priceBefore">Original Price ($)</Label>
                  <div className="flex items-center gap-2">
                    <Controller name="solveFor" control={control} render={({ field }) => ( <RadioGroup onValueChange={field.onChange} value={field.value}><RadioGroupItem value="priceBefore" id="solveForPriceBefore" /></RadioGroup> )}/>
                    <Controller name="priceBefore" control={control} render={({ field }) => <Input type="text" {...field} disabled={isInputDisabled('priceBefore')} />} />
                  </div>
              </div>

              <div>
                  <Label htmlFor="discountValue">Discount</Label>
                  <div className="flex items-center gap-2">
                    <Controller name="solveFor" control={control} render={({ field }) => ( <RadioGroup onValueChange={field.onChange} value={field.value}><RadioGroupItem value="discountValue" id="solveForDiscountValue" /></RadioGroup> )}/>
                    <Controller name="discountValue" control={control} render={({ field }) => <Input type="text" {...field} disabled={isInputDisabled('discountValue')} />} />
                     <Controller name="discountType" control={control} render={({ field }) => (
                      <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-2">
                        <Label className="p-2 border rounded-md text-sm peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><RadioGroupItem value="percent" id="percent" className="sr-only"/>%</Label>
                        <Label className="p-2 border rounded-md text-sm peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><RadioGroupItem value="fixed" id="fixed" className="sr-only"/>$</Label>
                      </RadioGroup>
                     )}/>
                  </div>
              </div>

               <div>
                  <Label htmlFor="priceAfter">Final Price ($)</Label>
                  <div className="flex items-center gap-2">
                     <Controller name="solveFor" control={control} render={({ field }) => ( <RadioGroup onValueChange={field.onChange} value={field.value}><RadioGroupItem value="priceAfter" id="solveForPriceAfter" /></RadioGroup> )}/>
                     <Controller name="priceAfter" control={control} render={({ field }) => <Input type="text" {...field} disabled={isInputDisabled('priceAfter')} />} />
                  </div>
              </div>
               {errors.priceBefore && <p className="text-destructive text-sm mt-1">{errors.priceBefore.message}</p>}
              
              <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">Calculate</Button>
                  <Button type="button" onClick={handleClear} variant="outline" className="flex-1">Clear</Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button type="button" variant="outline" disabled={!results} className="flex-1"><Download className="mr-2 h-4 w-4" /> Export</Button></DropdownMenuTrigger>
                    <DropdownMenuContent><DropdownMenuItem onClick={() => handleExport('txt')}>Download .txt</DropdownMenuItem><DropdownMenuItem onClick={() => handleExport('csv')}>Download .csv</DropdownMenuItem></DropdownMenuContent>
                  </DropdownMenu>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Results</h3>
        {results ? (
             <div className="space-y-4">
                <Card>
                    <CardContent className="p-4 grid grid-cols-2 gap-4 text-center">
                        <div>
                            <p className="text-sm text-muted-foreground">Final Price</p>
                            <p className="text-2xl font-bold">{formatCurrency(results.finalPrice)}</p>
                        </div>
                         <div>
                            <p className="text-sm text-muted-foreground">You Saved</p>
                            <p className="text-2xl font-bold text-green-600">{formatCurrency(results.savedAmount)}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base text-center">Breakdown of Original Price</CardTitle>
                    </CardHeader>
                    <CardContent className="h-64">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={results.pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} label={({ percent }) => `${(percent * 100).toFixed(0)}%`}>
                                    {results.pieData.map((_entry: any, index: number) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                                </Pie>
                                <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                                <Legend iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
             </div>
        ) : (
            <div className="flex items-center justify-center h-full bg-muted/50 rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground p-8 text-center">Enter any two values to calculate the third.</p>
            </div>
        )}
      </div>
    </div>
  );
}
