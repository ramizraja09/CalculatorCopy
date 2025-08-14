
"use client";

import { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash, Download, Info } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const cardSchema = z.object({
  name: z.string().nonempty('Card name is required'),
  balance: z.number().min(1, 'Balance must be positive'),
  apr: z.number().min(0, 'APR must be non-negative'),
  minPayment: z.number().min(1, 'Minimum payment must be positive'),
});

const formSchema = z.object({
  cards: z.array(cardSchema).min(1, 'Please add at least one credit card.'),
  monthlyBudget: z.number().min(1, 'Monthly budget must be positive'),
}).refine(data => {
    const totalMinPayments = data.cards.reduce((sum, card) => sum + card.minPayment, 0);
    return data.monthlyBudget >= totalMinPayments;
}, {
    message: "Monthly budget must be at least the sum of all minimum payments.",
    path: ["monthlyBudget"],
});


type FormData = z.infer<typeof formSchema>;

export default function CreditCardPayoffCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cards: [
        { name: 'Card 1', balance: 4600, apr: 18.99, minPayment: 100 },
        { name: 'Card 2', balance: 3900, apr: 19.99, minPayment: 90 },
        { name: 'Card 3', balance: 6000, apr: 15.99, minPayment: 120 },
      ],
      monthlyBudget: 500,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "cards",
  });

  const calculateAvalanche = (data: FormData) => {
    let { cards, monthlyBudget } = data;
    
    // Create a mutable copy of cards with current balances and sort by highest APR (Debt Avalanche)
    let sortedCards = [...cards].map(d => ({ ...d, currentBalance: d.balance })).sort((a, b) => b.apr - a.apr);
    
    const schedule = [];
    let months = 0;
    let totalInterestPaid = 0;
    
    while (sortedCards.some(d => d.currentBalance > 0)) {
        months++;
        let monthPayments: { [key: string]: number } = {};
        let totalMonthPayment = 0;
        let remainingBudgetForMonth = monthlyBudget;

        // Pay minimums first
        sortedCards.forEach(card => {
            if (card.currentBalance > 0) {
                const interestForMonth = card.currentBalance * (card.apr / 100 / 12);
                totalInterestPaid += interestForMonth;
                card.currentBalance += interestForMonth;

                const minPayment = Math.min(card.currentBalance, card.minPayment);
                card.currentBalance -= minPayment;
                monthPayments[card.name] = (monthPayments[card.name] || 0) + minPayment;
                remainingBudgetForMonth -= minPayment;
                totalMonthPayment += minPayment;
            }
        });

        // Apply remaining budget to highest APR card
        for (const card of sortedCards) {
            if (card.currentBalance > 0 && remainingBudgetForMonth > 0) {
                const extraPayment = Math.min(card.currentBalance, remainingBudgetForMonth);
                card.currentBalance -= extraPayment;
                monthPayments[card.name] = (monthPayments[card.name] || 0) + extraPayment;
                remainingBudgetForMonth -= extraPayment;
                totalMonthPayment += extraPayment;
            }
        }
        
        schedule.push({ month: months, payments: monthPayments, totalPayment: totalMonthPayment, balances: sortedCards.map(d=> ({name: d.name, balance: d.currentBalance})) });

        if (months > 600) break; // Safety break for very long calculations
    }
    
    const totalPaid = cards.reduce((sum, card) => sum + card.balance, 0) + totalInterestPaid;
    setResults({ schedule, totalInterestPaid, totalMonths: months, totalPaid, cards: data.cards });
    setFormData(data);
  };
  
  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `cc-avalanche-plan.${format}`;
    const payoffTime = `${Math.floor(results.totalMonths/12)} years, ${results.totalMonths % 12} months`;

    if (format === 'txt') {
      content = `Credit Card Payoff Plan (Avalanche Method)\n\nInputs:\n`;
      content += `Monthly Budget: ${formatCurrency(formData.monthlyBudget)}\n\n`;
      formData.cards.forEach(card => {
        content += `- ${card.name}: ${formatCurrency(card.balance)} @ ${card.apr}% (Min: ${formatCurrency(card.minPayment)})\n`;
      });
      content += `\nResults:\n- Debt-Free In: ${payoffTime}\n- Total Interest Paid: ${formatCurrency(results.totalInterestPaid)}\n- Total Amount Paid: ${formatCurrency(results.totalPaid)}\n`;
    } else {
      content = 'Card Name,Balance,APR,Min Payment\n';
      formData.cards.forEach(card => {
        content += `"${card.name}",${card.balance},${card.apr},${card.minPayment}\n`;
      });
      content += `\nMonthly Budget,${formData.monthlyBudget}\n\n`;
      content += 'Result,Value\n';
      content += `Debt-Free In,"${payoffTime}"\nTotal Interest Paid,${results.totalInterestPaid.toFixed(2)}\nTotal Paid,${results.totalPaid.toFixed(2)}\n`;
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
    <form onSubmit={handleSubmit(calculateAvalanche)}>
        <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
                <Card>
                  <CardHeader><CardTitle>Info of Your Credit Cards</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    <div className="space-y-2">
                      <Label>Monthly budget set aside for credit cards ($)</Label>
                      <Controller name="monthlyBudget" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
                       {errors.monthlyBudget && <p className="text-destructive text-sm">{errors.monthlyBudget.message}</p>}
                    </div>

                    <div className="grid grid-cols-[1fr,1fr,1fr,1fr,auto] items-end gap-2 pt-4">
                      <Label className="col-span-2">Credit Card</Label>
                      <Label>Balance</Label>
                      <Label>Min. Payment</Label>
                      <Label>Interest Rate</Label>
                    </div>

                    {fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-[1fr,1fr,1fr,1fr,auto] items-center gap-2">
                        <span className="text-sm mr-2">{index + 1}.</span>
                        <Controller name={`cards.${index}.name`} control={control} render={({ field }) => <Input placeholder="e.g., Visa" {...field} />} />
                        <Controller name={`cards.${index}.balance`} control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
                        <Controller name={`cards.${index}.minPayment`} control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
                        <div className="flex items-center">
                          <Controller name={`cards.${index}.apr`} control={control} render={({ field }) => <Input type="number" step="0.1" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
                          <span className="ml-1">%</span>
                        </div>
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash className="h-4 w-4" /></Button>
                    </div>
                    ))}
                    {errors.cards && <p className="text-destructive text-sm">{errors.cards.root?.message}</p>}
                    <Button type="button" variant="link" onClick={() => append({ name: `Card ${fields.length + 1}`, balance: 0, apr: 0, minPayment: 0 })}>Show more input fields</Button>
                  </CardContent>
                </Card>
                
                <div className="flex gap-2">
                    <Button type="submit" className="flex-1">Calculate</Button>
                    <Button type="button" variant="outline" onClick={() => { setResults(null); }}>Clear</Button>
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

            <div className="space-y-4">
                <h3 className="text-xl font-semibold">Payoff Summary</h3>
                {results ? (
                  <div className="space-y-4">
                    <Card>
                        <CardContent className="p-4 grid grid-cols-2 gap-2 text-center">
                            <div><p className="text-muted-foreground">Debt-Free In</p><p className="font-semibold">{Math.floor(results.totalMonths/12)} years, {results.totalMonths % 12} months</p></div>
                            <div><p className="text-muted-foreground">Total Interest Paid</p><p className="font-semibold">{formatCurrency(results.totalInterestPaid)}</p></div>
                             <div><p className="text-muted-foreground">Total Amount Paid</p><p className="font-semibold">{formatCurrency(results.totalPaid)}</p></div>
                        </CardContent>
                    </Card>
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>Debt Avalanche Method</AlertTitle>
                        <AlertDescription className="text-xs">
                           This plan prioritizes paying off the card with the highest interest rate first, which is the most cost-effective way to become debt-free.
                        </AlertDescription>
                    </Alert>
                  </div>
                ) : (
                    <div className="flex items-center justify-center h-60 bg-muted/50 rounded-lg border border-dashed">
                        <p className="text-sm text-muted-foreground">Add your cards to create a payoff plan</p>
                    </div>
                )}
            </div>
        </div>
        {results && (
            <div className="md:col-span-2 mt-8">
                <h3 className="text-xl font-semibold mb-4">Payoff Schedule</h3>
                <Card>
                    <CardContent className="p-2">
                        <ScrollArea className="h-[40rem]">
                            <Table>
                                <TableHeader className="sticky top-0 bg-muted">
                                    <TableRow>
                                        <TableHead>Month</TableHead>
                                        {results.cards.map((d: any) => <TableHead key={d.name}>{d.name} Balance</TableHead>)}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {results.schedule.map((row: any) => (
                                        <TableRow key={row.month}>
                                            <TableCell>{row.month}</TableCell>
                                            {results.cards.map((card: any) => (
                                                <TableCell key={card.name}>{formatCurrency(row.balances.find((b:any) => b.name === card.name)?.balance || 0)}</TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        )}
    </form>
  );
}
