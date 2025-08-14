
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Download, Info } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const formSchema = z.object({
  initialSubscribers: z.number().min(0),
  newSubscribersPerMonth: z.number().min(0),
  churnRate: z.number().min(0).max(100),
  subscriptionPrice: z.number().min(0.01),
  acquisitionCost: z.number().min(0),
  monthlyOperatingCost: z.number().min(0),
  analysisPeriod: z.number().int().min(1).max(120),
});

type FormData = z.infer<typeof formSchema>;
const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

export default function SubscriptionProfitabilityCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      initialSubscribers: 100,
      newSubscribersPerMonth: 20,
      churnRate: 5,
      subscriptionPrice: 25,
      acquisitionCost: 100,
      monthlyOperatingCost: 3000,
      analysisPeriod: 24,
    },
  });

  const calculateProfitability = (data: FormData) => {
    const {
        initialSubscribers, newSubscribersPerMonth, churnRate,
        subscriptionPrice, acquisitionCost, monthlyOperatingCost, analysisPeriod
    } = data;

    const monthlyChurnRate = churnRate / 100;
    const projections = [];
    let subscriberCount = initialSubscribers;
    let cumulativeProfit = 0;
    let breakEvenMonth = -1;

    for (let month = 1; month <= analysisPeriod; month++) {
      const churnedSubscribers = subscriberCount * monthlyChurnRate;
      subscriberCount = subscriberCount - churnedSubscribers + newSubscribersPerMonth;
      
      const mrr = subscriberCount * subscriptionPrice;
      const totalAcquisitionCost = newSubscribersPerMonth * acquisitionCost;
      const totalCosts = monthlyOperatingCost + totalAcquisitionCost;
      const netProfit = mrr - totalCosts;
      cumulativeProfit += netProfit;

      projections.push({
        month,
        subscribers: Math.round(subscriberCount),
        mrr,
        totalCosts,
        netProfit,
        cumulativeProfit
      });
      
      if(cumulativeProfit > 0 && breakEvenMonth === -1) {
          breakEvenMonth = month;
      }
    }
    
    const averageLifetimeMonths = 1 / monthlyChurnRate;
    const ltv = subscriptionPrice * averageLifetimeMonths;
    const ltvToCacRatio = ltv / acquisitionCost;
    
    setResults({
      projections,
      ltv,
      ltvToCacRatio,
      breakEvenMonth,
      finalNetProfit: cumulativeProfit,
    });
    setFormData(data);
  };

  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `subscription-profitability-calculation.${format}`;

    if (format === 'txt') {
      content = `Subscription Profitability Calculation\n\nInputs:\n`;
      Object.entries(formData).forEach(([k, v]) => content += `- ${k}: ${v}\n`);
      content += `\nResults:\n- LTV: ${formatCurrency(results.ltv)}\n- LTV/CAC Ratio: ${results.ltvToCacRatio.toFixed(2)}\n- Break-even Month: ${results.breakEvenMonth > -1 ? results.breakEvenMonth : 'N/A'}\n- Net Profit after ${formData.analysisPeriod} months: ${formatCurrency(results.finalNetProfit)}\n\n`;
      content += "Monthly Projections:\nMonth,Subscribers,MRR,Total Costs,Net Profit,Cumulative Profit\n";
      results.projections.forEach((p: any) => {
        content += `${p.month},${p.subscribers},${p.mrr.toFixed(2)},${p.totalCosts.toFixed(2)},${p.netProfit.toFixed(2)},${p.cumulativeProfit.toFixed(2)}\n`;
      });
    } else {
       content = 'Category,Value\n';
       Object.entries(formData).forEach(([k, v]) => content += `${k},${v}\n`);
       content += `\nResult Category,Value\nLTV,${results.ltv.toFixed(2)}\nLTV/CAC Ratio,${results.ltvToCacRatio.toFixed(2)}\nBreak-even Month,${results.breakEvenMonth > -1 ? results.breakEvenMonth : 'N/A'}\nNet Profit after ${formData.analysisPeriod} months,${results.finalNetProfit.toFixed(2)}\n\n`;
       content += "Month,Subscribers,MRR,Total Costs,Net Profit,Cumulative Profit\n";
       results.projections.forEach((p: any) => {
        content += `${p.month},${p.subscribers},${p.mrr.toFixed(2)},${p.totalCosts.toFixed(2)},${p.netProfit.toFixed(2)},${p.cumulativeProfit.toFixed(2)}\n`;
      });
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
    <form onSubmit={handleSubmit(calculateProfitability)}>
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader><CardTitle>Business Metrics</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Initial Subscribers</Label><Controller name="initialSubscribers" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
              <div><Label>New Subscribers per Month</Label><Controller name="newSubscribersPerMonth" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
              <div><Label>Monthly Churn Rate (%)</Label><Controller name="churnRate" control={control} render={({ field }) => <Input type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
              <div><Label>Monthly Subscription Price ($)</Label><Controller name="subscriptionPrice" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
              <div><Label>Customer Acquisition Cost (CAC) ($)</Label><Controller name="acquisitionCost" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
              <div><Label>Monthly Operating Costs ($)</Label><Controller name="monthlyOperatingCost" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
              <div><Label>Analysis Period (months)</Label><Controller name="analysisPeriod" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
            </CardContent>
          </Card>
          <div className="flex gap-2">
            <Button type="submit" className="flex-1">Calculate</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={!results}><Download className="mr-2 h-4 w-4" /> Export</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleExport('txt')}>Download as .txt</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('csv')}>Download as .csv</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xl font-semibold">Profitability Analysis</h3>
          {results ? (
              <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <Card><CardContent className="p-4 text-center"><p className="text-muted-foreground">LTV:CAC Ratio</p><p className="font-semibold text-xl">{results.ltvToCacRatio.toFixed(2)}</p></CardContent></Card>
                    <Card><CardContent className="p-4 text-center"><p className="text-muted-foreground">Break-even Point</p><p className="font-semibold text-xl">{results.breakEvenMonth > -1 ? `Month ${results.breakEvenMonth}` : 'N/A'}</p></CardContent></Card>
                  </div>
                  <Card><CardContent className="p-4 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={results.projections} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" label={{ value: "Month", position: "insideBottom", offset: -5 }} />
                        <YAxis tickFormatter={(val) => `$${(val/1000)}k`}/>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                        <Line type="monotone" dataKey="mrr" name="Revenue" stroke="hsl(var(--chart-2))" dot={false} />
                        <Line type="monotone" dataKey="totalCosts" name="Total Costs" stroke="hsl(var(--destructive))" dot={false} />
                        <Line type="monotone" dataKey="cumulativeProfit" name="Cumulative Profit" stroke="hsl(var(--chart-1))" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent></Card>
                   <Card>
                    <CardHeader><CardTitle>Monthly Breakdown</CardTitle></CardHeader>
                    <CardContent>
                      <ScrollArea className="h-64">
                        <Table>
                          <TableHeader><TableRow><TableHead>Month</TableHead><TableHead>Subscribers</TableHead><TableHead>MRR</TableHead><TableHead>Costs</TableHead><TableHead>Net Profit</TableHead><TableHead>Cumulative</TableHead></TableRow></TableHeader>
                          <TableBody>
                            {results.projections.map((p: any) => (
                              <TableRow key={p.month}>
                                <TableCell>{p.month}</TableCell><TableCell>{p.subscribers}</TableCell><TableCell>{formatCurrency(p.mrr)}</TableCell><TableCell>{formatCurrency(p.totalCosts)}</TableCell><TableCell className={p.netProfit < 0 ? "text-destructive" : ""}>{formatCurrency(p.netProfit)}</TableCell><TableCell>{formatCurrency(p.cumulativeProfit)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </CardContent>
                   </Card>
              </div>
          ) : (
            <div className="flex items-center justify-center h-full bg-muted/50 rounded-lg border border-dashed"><p className="text-sm text-muted-foreground p-8 text-center">Enter your subscription metrics for a detailed profitability analysis.</p></div>
          )}
        </div>
      </div>
    </form>
  );
}
