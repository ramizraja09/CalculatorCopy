
"use client";

import { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash, Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const debtSchema = z.object({
  name: z.string().nonempty('Debt name is required'),
  balance: z.number().min(1, 'Balance must be positive'),
  apr: z.number().min(0, 'APR must be non-negative'),
  minPayment: z.number().min(1, 'Minimum payment must be positive'),
});

const formSchema = z.object({
  debts: z.array(debtSchema).min(1, 'Please add at least one debt.'),
  extraPayment: z.number().min(0, 'Extra payment cannot be negative'),
});

type FormData = z.infer<typeof formSchema>;

export default function DebtSnowballCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      debts: [
        { name: 'Credit Card', balance: 5000, apr: 18, minPayment: 100 },
        { name: 'Student Loan', balance: 20000, apr: 6, minPayment: 250 },
        { name: 'Car Loan', balance: 12000, apr: 4.5, minPayment: 300 },
      ],
      extraPayment: 200,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "debts",
  });

  const calculateSnowball = (data: FormData) => {
    let { debts, extraPayment } = data;
    
    let sortedDebts = [...debts].map(d => ({ ...d, currentBalance: d.balance })).sort((a, b) => a.balance - b.balance);
    
    const schedule = [];
    let months = 0;
    let totalInterestPaid = 0;
    let snowball = extraPayment;
    
    while (sortedDebts.some(d => d.currentBalance > 0)) {
        months++;
        let monthPayments: { [key: string]: number } = {};
        let monthInterest: { [key: string]: number } = {};
        let totalMonthPayment = 0;
        let currentSnowball = snowball;

        sortedDebts.forEach(debt => {
            if (debt.currentBalance > 0) {
                const monthlyRate = debt.apr / 100 / 12;
                const interest = debt.currentBalance * monthlyRate;
                totalInterestPaid += interest;
                monthInterest[debt.name] = interest;
                debt.currentBalance += interest;
            }
        });
        
        sortedDebts.forEach(debt => {
            if (debt.currentBalance > 0) {
                const payment = Math.min(debt.currentBalance, debt.minPayment);
                debt.currentBalance -= payment;
                monthPayments[debt.name] = payment;
                totalMonthPayment += payment;
            }
        });

        for (const debt of sortedDebts) {
            if (debt.currentBalance > 0 && currentSnowball > 0) {
                const payment = Math.min(debt.currentBalance, currentSnowball);
                debt.currentBalance -= payment;
                monthPayments[debt.name] = (monthPayments[debt.name] || 0) + payment;
                totalMonthPayment += payment;
                currentSnowball -= payment;
            }
        }
        
        schedule.push({ month: months, payments: monthPayments, interests: monthInterest, totalPayment: totalMonthPayment, balances: sortedDebts.map(d=> ({name: d.name, balance: d.currentBalance})) });

        snowball = extraPayment;
        sortedDebts.forEach(debt => {
            if(debt.currentBalance <= 0) {
                snowball += debt.minPayment;
            }
        });

        if (months > 480) break; 
    }
    
    setResults({ schedule, totalInterestPaid, totalMonths: months, debts: data.debts });
    setFormData(data);
  };
  
  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `debt-snowball-plan.${format}`;
    const payoffTime = `${Math.floor(results.totalMonths/12)} years, ${results.totalMonths % 12} months`;

    if (format === 'txt') {
      content = `Debt Snowball Payoff Plan\n\nInputs:\n`;
      formData.debts.forEach(debt => {
        content += `- ${debt.name}: ${formatCurrency(debt.balance)} @ ${debt.apr}% (Min: ${formatCurrency(debt.minPayment)})\n`;
      });
      content += `Extra Monthly Payment: ${formatCurrency(formData.extraPayment)}\n\n`;
      content += `Results:\n- Debt-Free In: ${payoffTime}\n- Total Interest Paid: ${formatCurrency(results.totalInterestPaid)}\n`;
    } else {
      content = 'Debt Name,Balance,APR,Min Payment\n';
      formData.debts.forEach(debt => {
        content += `"${debt.name}",${debt.balance},${debt.apr},${debt.minPayment}\n`;
      });
      content += `\nExtra Payment,${formData.extraPayment}\n\n`;
      content += 'Result,Value\n';
      content += `Debt-Free In,"${payoffTime}"\nTotal Interest Paid,${results.totalInterestPaid.toFixed(2)}\n`;
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
    <form onSubmit={handleSubmit(calculateSnowball)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs Column */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Your Debts</h3>
        {fields.map((field, index) => (
          <Card key={field.id} className="p-4 space-y-2 relative">
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Debt Name</Label><Controller name={`debts.${index}.name`} control={control} render={({ field }) => <Input placeholder="e.g., Visa" {...field} />} /></div>
              <div><Label>Balance ($)</Label><Controller name={`debts.${index}.balance`} control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
              <div><Label>APR (%)</Label><Controller name={`debts.${index}.apr`} control={control} render={({ field }) => <Input type="number" step="0.1" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
              <div><Label>Min. Payment ($)</Label><Controller name={`debts.${index}.minPayment`} control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
            </div>
             <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1" onClick={() => remove(index)}><Trash className="h-4 w-4" /></Button>
          </Card>
        ))}
         {errors.debts && <p className="text-destructive text-sm">{errors.debts.root?.message}</p>}
        <Button type="button" variant="outline" onClick={() => append({ name: '', balance: 0, apr: 0, minPayment: 0 })}>Add Debt</Button>
        
        <h3 className="text-xl font-semibold pt-4">Extra Monthly Payment</h3>
        <div>
          <Label>Amount ($)</Label>
          <Controller name="extraPayment" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
        </div>
        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Create Payoff Plan</Button>
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
        <h3 className="text-xl font-semibold">Payoff Plan</h3>
        {results ? (
            <div className="space-y-4">
                <Card><CardContent className="p-4 grid grid-cols-2 gap-2 text-center">
                    <div><p className="text-muted-foreground">Debt-Free In</p><p className="font-semibold">{Math.floor(results.totalMonths/12)} years, {results.totalMonths % 12} months</p></div>
                    <div><p className="text-muted-foreground">Total Interest Paid</p><p className="font-semibold">{formatCurrency(results.totalInterestPaid)}</p></div>
                </CardContent></Card>
                 <Card>
                    <CardContent className="p-2">
                        <h4 className="font-semibold mb-2 p-2">Payoff Schedule</h4>
                        <ScrollArea className="h-[40rem]">
                            <Table>
                                <TableHeader className="sticky top-0 bg-muted">
                                    <TableRow>
                                        <TableHead>Month</TableHead>
                                        {results.debts.map((d: any) => <TableHead key={d.name}>{d.name}</TableHead>)}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {results.schedule.map((row: any) => (
                                        <TableRow key={row.month}>
                                            <TableCell>{row.month}</TableCell>
                                            {results.debts.map((debt: any) => (
                                                <TableCell key={debt.name}>{formatCurrency(row.balances.find((b:any) => b.name === debt.name)?.balance || 0)}</TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        ) : (
             <div className="flex items-center justify-center h-60 bg-muted/50 rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">Add your debts to create a payoff plan</p>
            </div>
        )}
      </div>
    </form>
  );
}
