
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Info, Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const formSchema = z.object({
  propertyPrice: z.number().min(1, 'Property price must be greater than 0'),
  deposit: z.number().min(0, 'Deposit must be non-negative'),
  loanTerm: z.number().int().min(1, 'Loan term must be at least 1 year'),
  interestRate: z.number().min(0.01, 'Interest rate must be positive'),
});

type FormData = z.infer<typeof formSchema>;

// Simplified 2024 UK Stamp Duty Land Tax (SDLT) calculation for England & NI
// This is a simplified model and does not account for all circumstances (e.g., first-time buyers, additional properties).
const calculateStampDuty = (price: number) => {
    let tax = 0;
    if (price > 250000) {
      const band1 = Math.min(price, 925000) - 250000;
      tax += band1 * 0.05;
    }
    if (price > 925000) {
      const band2 = Math.min(price, 1500000) - 925000;
      tax += band2 * 0.10;
    }
    if (price > 1500000) {
      const band3 = price - 1500000;
      tax += band3 * 0.12;
    }
    return tax;
}


export default function MortgageCalculatorUK() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      propertyPrice: 275000,
      deposit: 55000,
      loanTerm: 25,
      interestRate: 5.5,
    },
  });

  const calculateMortgage = (data: FormData) => {
    const {
      propertyPrice,
      deposit,
      loanTerm,
      interestRate,
    } = data;

    if (deposit >= propertyPrice) {
        setResults({ error: 'Deposit must be less than the property price.' });
        return;
    }

    const principal = propertyPrice - deposit;
    const monthlyInterestRate = interestRate / 100 / 12;
    const numberOfPayments = loanTerm * 12;

    const monthlyPayment = principal * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) / (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);

    const totalPaid = monthlyPayment * numberOfPayments;
    const totalInterestPaid = totalPaid - principal;
    const stampDuty = calculateStampDuty(propertyPrice);

    setResults({
      monthlyPayment,
      totalInterestPaid,
      totalPaid,
      principal,
      stampDuty,
      error: null,
    });
    setFormData(data);
  };
  
  const formatCurrency = (value: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value);
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `uk-mortgage-calculation.${format}`;
    const { propertyPrice, deposit, loanTerm, interestRate } = formData;

    if (format === 'txt') {
      content = `UK Mortgage Calculation\n\nInputs:\n- Property Price: ${formatCurrency(propertyPrice)}\n- Deposit: ${formatCurrency(deposit)}\n- Loan Term: ${loanTerm} years\n- Interest Rate: ${interestRate}%\n\n`;
      content += `Results:\n- Monthly Payment: ${formatCurrency(results.monthlyPayment)}\n- Loan Amount: ${formatCurrency(results.principal)}\n- Total Interest Paid: ${formatCurrency(results.totalInterestPaid)}\n- Stamp Duty (Est.): ${formatCurrency(results.stampDuty)}\n`;
    } else {
      content = 'Category,Value\n';
      content += `Property Price,${propertyPrice}\nDeposit,${deposit}\nLoan Term (years),${loanTerm}\nInterest Rate (%),${interestRate}\n\n`;
      content += 'Result Category,Value\n';
      content += `Monthly Payment,${results.monthlyPayment.toFixed(2)}\nLoan Amount,${results.principal.toFixed(2)}\nTotal Interest Paid,${results.totalInterestPaid.toFixed(2)}\nStamp Duty (Est.),${results.stampDuty.toFixed(2)}\n`;
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
    <form onSubmit={handleSubmit(calculateMortgage)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs Column */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Mortgage Details</h3>
        
        <div>
          <Label>Property Price (£)</Label>
          <Controller name="propertyPrice" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
          {errors.propertyPrice && <p className="text-destructive text-sm mt-1">{errors.propertyPrice.message}</p>}
        </div>

        <div>
          <Label>Deposit (£)</Label>
          <Controller name="deposit" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
          {errors.deposit && <p className="text-destructive text-sm mt-1">{errors.deposit.message}</p>}
        </div>

        <div>
          <Label>Loan Term (years)</Label>
          <Controller name="loanTerm" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} />
          {errors.loanTerm && <p className="text-destructive text-sm mt-1">{errors.loanTerm.message}</p>}
        </div>

        <div>
          <Label>Interest Rate (%)</Label>
          <Controller name="interestRate" control={control} render={({ field }) => <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
          {errors.interestRate && <p className="text-destructive text-sm mt-1">{errors.interestRate.message}</p>}
        </div>
        
        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Calculate</Button>
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

      {/* Results Column */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Results</h3>
        {results ? (
            results.error ? (
                <Card className="flex items-center justify-center h-60 bg-muted/50 border-dashed">
                    <p className="text-destructive">{results.error}</p>
                </Card>
            ) : (
                <div className="space-y-4">
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-sm text-muted-foreground">Monthly Payment</p>
                            <p className="text-3xl font-bold">{formatCurrency(results.monthlyPayment)}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4 grid grid-cols-2 gap-2 text-sm">
                            <div><p className="text-muted-foreground">Loan Amount</p><p className="font-semibold">{formatCurrency(results.principal)}</p></div>
                            <div><p className="text-muted-foreground">Total Interest Paid</p><p className="font-semibold">{formatCurrency(results.totalInterestPaid)}</p></div>
                            <div><p className="text-muted-foreground">Total Paid</p><p className="font-semibold">{formatCurrency(results.totalPaid + (formData?.deposit || 0))}</p></div>
                            <div><p className="text-muted-foreground">Stamp Duty (Est.)</p><p className="font-semibold">{formatCurrency(results.stampDuty)}</p></div>
                        </CardContent>
                    </Card>
                     <Alert variant="default">
                        <Info className="h-4 w-4" />
                        <AlertTitle>Disclaimer</AlertTitle>
                        <AlertDescription className="text-xs">
                          Stamp Duty calculation is an estimate for England/NI and doesn't account for first-time buyer relief or additional property rates. Always consult a professional.
                        </AlertDescription>
                    </Alert>
                </div>
            )
        ) : (
             <div className="flex items-center justify-center h-60 bg-muted/50 rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">Enter your details and click calculate</p>
            </div>
        )}
      </div>
    </form>
  );
}
