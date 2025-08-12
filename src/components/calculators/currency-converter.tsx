
"use client";

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRightLeft, Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Mock exchange rates. In a real app, this would be fetched from an API.
const exchangeRates: { [key: string]: number } = {
  USD: 1.0,
  EUR: 0.93,
  GBP: 0.79,
  JPY: 157.0,
  CAD: 1.37,
  AUD: 1.50,
  CHF: 0.90,
  CNY: 7.25,
};

const currencies = Object.keys(exchangeRates);

const formSchema = z.object({
  amount: z.number().min(0, "Amount must be non-negative"),
  fromCurrency: z.string().nonempty(),
  toCurrency: z.string().nonempty(),
});

type FormData = z.infer<typeof formSchema>;

export default function CurrencyConverter() {
  const [result, setResult] = useState<string | null>(null);
  const [isCalculated, setIsCalculated] = useState(false);


  const { control, handleSubmit, watch, setValue } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 100,
      fromCurrency: 'USD',
      toCurrency: 'EUR',
    },
  });

  const formData = watch();

  useEffect(() => {
    convertCurrency(formData);
  }, [formData]);
  
  const convertCurrency = (data: FormData) => {
    const { amount, fromCurrency, toCurrency } = data;
    if (amount >= 0 && fromCurrency && toCurrency) {
      const rateFrom = exchangeRates[fromCurrency];
      const rateTo = exchangeRates[toCurrency];
      const convertedAmount = (amount / rateFrom) * rateTo;
      setResult(convertedAmount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }));
       setIsCalculated(true);
    }
  }

  const swapCurrencies = () => {
    const from = formData.fromCurrency;
    const to = formData.toCurrency;
    setValue('fromCurrency', to);
    setValue('toCurrency', from);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!result || !formData) return;
    
    let content = '';
    const filename = `currency-conversion.${format}`;
    const { amount, fromCurrency, toCurrency } = formData;

    if (format === 'txt') {
      content = `Currency Conversion\n\n- Amount: ${amount} ${fromCurrency}\n- From: ${fromCurrency}\n- To: ${toCurrency}\n\nResult: ${result} ${toCurrency}`;
    } else {
      content = `Amount,From,To,Result\n${amount},${fromCurrency},${toCurrency},${result}`;
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
    <form onSubmit={(e) => { e.preventDefault(); convertCurrency(formData) }} className="space-y-4">
        <Card>
            <CardHeader><CardTitle>Currency Conversion</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label htmlFor="amount">Amount</Label>
                    <Controller name="amount" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <Label>From</Label>
                        <Controller name="fromCurrency" control={control} render={({ field }) => (
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>{currencies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                            </Select>
                        )} />
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="mt-6" onClick={swapCurrencies}><ArrowRightLeft/></Button>
                    <div className="flex-1">
                        <Label>To</Label>
                        <Controller name="toCurrency" control={control} render={({ field }) => (
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>{currencies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                            </Select>
                        )} />
                    </div>
                </div>
                 <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" disabled={!isCalculated}>
                      <Download className="mr-2 h-4 w-4" /> Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleExport('txt')}>Download as .txt</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('csv')}>Download as .csv</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
            </CardContent>
        </Card>

        {result !== null && (
            <Card>
                <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">{formData.amount.toLocaleString()} {formData.fromCurrency} =</p>
                    <p className="text-3xl font-bold">{result} {formData.toCurrency}</p>
                    <p className="text-xs text-muted-foreground mt-2">*Rates are for demonstration purposes only.</p>
                </CardContent>
            </Card>
        )}
    </form>
  );
}
