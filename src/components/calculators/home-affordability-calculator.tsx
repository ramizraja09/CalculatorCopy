
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info, Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


const formSchema = z.object({
  annualIncome: z.number().min(1, 'Annual income must be positive'),
  monthlyDebts: z.number().min(0, 'Monthly debts must be non-negative'),
  downPayment: z.number().min(0, 'Down payment must be non-negative'),
  interestRate: z.number().min(0.01, 'Interest rate must be positive'),
  loanTerm: z.number().int().min(1, 'Loan term must be at least 1 year'),
  propertyTaxRate: z.number().min(0, 'Property tax rate must be non-negative'),
  homeInsuranceRate: z.number().min(0, 'Home insurance rate must be non-negative'),
});

type FormData = z.infer<typeof formSchema>;

export default function HomeAffordabilityCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      annualIncome: 80000,
      monthlyDebts: 500,
      downPayment: 20000,
      interestRate: 6.5,
      loanTerm: 30,
      propertyTaxRate: 1.2,
      homeInsuranceRate: 0.5,
    },
  });

  const calculateAffordability = (data: FormData) => {
    const { 
        annualIncome, 
        monthlyDebts, 
        downPayment, 
        interestRate, 
        loanTerm,
        propertyTaxRate,
        homeInsuranceRate
    } = data;
    
    const grossMonthlyIncome = annualIncome / 12;
    
    const maxHousingPayment28 = grossMonthlyIncome * 0.28;
    const maxTotalDebtPayment36 = grossMonthlyIncome * 0.36;
    const maxHousingPayment36 = maxTotalDebtPayment36 - monthlyDebts;

    const maxPITI = Math.min(maxHousingPayment28, maxHousingPayment36);
    const monthlyInterestRate = interestRate / 100 / 12;
    const numberOfPayments = loanTerm * 12;
    
    const monthlyRate = interestRate / 100 / 12;
    const monthlyTaxesAndInsuranceFactor = (propertyTaxRate / 100 / 12) + (homeInsuranceRate / 100 / 12);
    
    const loanPaymentFactor = (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    const totalDivisor = loanPaymentFactor + monthlyTaxesAndInsuranceFactor;

    const maxLoanAmount = maxPITI / totalDivisor;

    if (!isFinite(maxLoanAmount) || maxLoanAmount <= 0) {
        setResults({ error: "Could not calculate an affordable amount. This may be due to high monthly debts or a low income for the given rates." });
        return;
    }
    
    const affordableHomePrice = maxLoanAmount + downPayment;
    const estimatedMonthlyPayment = maxLoanAmount * loanPaymentFactor + (affordableHomePrice * monthlyTaxesAndInsuranceFactor);

    setResults({
        affordableHomePrice,
        maxLoanAmount,
        estimatedMonthlyPayment,
        downPayment,
        maxPITI,
        error: null,
    });
    setFormData(data);
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `home-affordability-calculation.${format}`;
    const { annualIncome, monthlyDebts, downPayment, interestRate, loanTerm, propertyTaxRate, homeInsuranceRate } = formData;

    if (format === 'txt') {
      content = `Home Affordability Calculation\n\nInputs:\n`;
      content += `- Annual Income: ${formatCurrency(annualIncome)}\n- Monthly Debts: ${formatCurrency(monthlyDebts)}\n- Down Payment: ${formatCurrency(downPayment)}\n`;
      content += `- Interest Rate: ${interestRate}%\n- Loan Term: ${loanTerm} years\n- Property Tax Rate: ${propertyTaxRate}%\n- Home Insurance Rate: ${homeInsuranceRate}%\n\n`;
      content += `Results:\n- Affordable Home Price: ${formatCurrency(results.affordableHomePrice)}\n- Max Loan Amount: ${formatCurrency(results.maxLoanAmount)}\n- Estimated Monthly Payment: ${formatCurrency(results.estimatedMonthlyPayment)}\n`;
    } else {
      content = 'Category,Value\n';
      content += `Annual Income,${annualIncome}\nMonthly Debts,${monthlyDebts}\nDown Payment,${downPayment}\n`;
      content += `Interest Rate (%),${interestRate}\nLoan Term (years),${loanTerm}\nProperty Tax Rate (%),${propertyTaxRate}\nHome Insurance Rate (%),${homeInsuranceRate}\n\n`;
      content += 'Result Category,Value\n';
      content += `Affordable Home Price,${results.affordableHomePrice.toFixed(2)}\nMax Loan Amount,${results.maxLoanAmount.toFixed(2)}\nEstimated Monthly Payment,${results.estimatedMonthlyPayment.toFixed(2)}\n`;
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
    <form onSubmit={handleSubmit(calculateAffordability)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs Column */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Financial Details</h3>
        
        <div>
          <Label htmlFor="annualIncome">Gross Annual Income ($)</Label>
          <Controller name="annualIncome" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
          {errors.annualIncome && <p className="text-destructive text-sm mt-1">{errors.annualIncome.message}</p>}
        </div>

        <div>
          <Label htmlFor="monthlyDebts">Total Monthly Debts ($)</Label>
          <Controller name="monthlyDebts" control={control} render={({ field }) => <Input type="number" placeholder="Car payments, student loans, etc." {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
          {errors.monthlyDebts && <p className="text-destructive text-sm mt-1">{errors.monthlyDebts.message}</p>}
        </div>

        <div>
          <Label htmlFor="downPayment">Down Payment ($)</Label>
          <Controller name="downPayment" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
          {errors.downPayment && <p className="text-destructive text-sm mt-1">{errors.downPayment.message}</p>}
        </div>
        
        <h3 className="text-xl font-semibold pt-4">Loan Assumptions</h3>
        
        <div>
          <Label htmlFor="interestRate">Estimated Interest Rate (%)</Label>
          <Controller name="interestRate" control={control} render={({ field }) => <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
          {errors.interestRate && <p className="text-destructive text-sm mt-1">{errors.interestRate.message}</p>}
        </div>

        <div>
          <Label htmlFor="loanTerm">Loan Term (years)</Label>
          <Controller name="loanTerm" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} />
          {errors.loanTerm && <p className="text-destructive text-sm mt-1">{errors.loanTerm.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="propertyTaxRate">Annual Property Tax Rate (%)</Label>
          <Controller name="propertyTaxRate" control={control} render={({ field }) => <Input type="number" step="0.01" placeholder="e.g., 1.2" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
          {errors.propertyTaxRate && <p className="text-destructive text-sm mt-1">{errors.propertyTaxRate.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="homeInsuranceRate">Annual Home Insurance Rate (%)</Label>
          <Controller name="homeInsuranceRate" control={control} render={({ field }) => <Input type="number" step="0.01" placeholder="e.g., 0.5" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
          {errors.homeInsuranceRate && <p className="text-destructive text-sm mt-1">{errors.homeInsuranceRate.message}</p>}
        </div>

        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Calculate Affordability</Button>
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
                    <p className="text-destructive text-center p-4">{results.error}</p>
                </Card>
            ) : (
                <div className="space-y-4">
                    <Card>
                        <CardContent className="p-4 text-center">
                            <p className="text-sm text-muted-foreground">You Can Afford a Home Priced At</p>
                            <p className="text-3xl font-bold">{formatCurrency(results.affordableHomePrice)}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 grid grid-cols-2 gap-4 text-sm">
                             <div><p className="text-muted-foreground">Estimated Loan Amount</p><p className="font-semibold">{formatCurrency(results.maxLoanAmount)}</p></div>
                             <div><p className="text-muted-foreground">Down Payment</p><p className="font-semibold">{formatCurrency(results.downPayment)}</p></div>
                             <div><p className="text-muted-foreground">Estimated Monthly Payment</p><p className="font-semibold">{formatCurrency(results.estimatedMonthlyPayment)}</p></div>
                             <div><p className="text-muted-foreground">Max Housing Payment</p><p className="font-semibold">{formatCurrency(results.maxPITI)} / mo</p></div>
                        </CardContent>
                    </Card>
                     <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>How It's Calculated</AlertTitle>
                        <AlertDescription className="text-xs">
                          This estimate is based on the 28/36 rule, which suggests your monthly housing costs shouldn't exceed 28% of your gross monthly income, and your total debt payments shouldn't exceed 36%. This is a guideline; a lender will make the final determination.
                        </AlertDescription>
                    </Alert>
                </div>
            )
        ) : (
             <div className="flex items-center justify-center h-60 bg-muted/50 rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">Enter your financial details to estimate affordability</p>
            </div>
        )}
      </div>
    </form>
  );
}
