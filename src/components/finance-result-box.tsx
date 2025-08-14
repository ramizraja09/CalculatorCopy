
"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

type FinanceResultBoxProps = {
    results: any;
    solveFor: 'fv' | 'pmt' | 'pv' | 'nper' | 'rate';
};

const PIE_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))'];

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

export function FinanceResultBox({ results, solveFor }: FinanceResultBoxProps) {
    if (!results) {
        return (
            <div className="flex items-center justify-center h-full bg-muted/50 rounded-lg border border-dashed p-8">
                <p className="text-sm text-muted-foreground text-center">Enter values and click calculate. The disabled field is what will be solved for.</p>
            </div>
        );
    }
    
    if (results.error) {
         return (
            <div className="flex items-center justify-center h-full bg-muted/50 rounded-lg border border-dashed p-8">
                <p className="text-sm text-destructive text-center">{results.error}</p>
            </div>
        );
    }

    const solvedValueDisplay = () => {
        if (results.solvedValue === undefined) return null;
        switch (solveFor) {
            case 'fv': return `End Balance: ${formatCurrency(results.solvedValue)}`;
            case 'pmt': return `Monthly Contribution: ${formatCurrency(results.solvedValue)}`;
            case 'pv': return `Starting Amount: ${formatCurrency(results.solvedValue)}`;
            case 'nper': return `Investment Length: ${Math.floor(results.solvedValue / 12)} years, ${Math.round(results.solvedValue % 12)} months`;
            case 'rate': return `Annual Return Rate: ${results.solvedValue.toFixed(2)}%`;
            default: return null;
        }
    };
    
    return (
        <div className="space-y-4">
            <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle className="font-bold text-lg">{solvedValueDisplay()}</AlertTitle>
            </Alert>
            <Card>
                <CardHeader><CardTitle className="text-base text-center">Breakdown</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between font-bold"><span>End Balance</span><span>{formatCurrency(results.endBalance)}</span></div>
                    <div className="flex justify-between pl-4 text-muted-foreground"><span>Starting Amount</span><span>{formatCurrency(results.startingAmount)}</span></div>
                    <div className="flex justify-between pl-4 text-muted-foreground"><span>Total Contributions</span><span>{formatCurrency(results.totalContributions)}</span></div>
                    <div className="flex justify-between pl-4 text-muted-foreground"><span>Total Interest</span><span>{formatCurrency(results.totalInterest)}</span></div>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="p-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={results.pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5}>
                            {results.pieData.map((_entry: any, index: number) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend iconType="circle" />
                    </PieChart>
                </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}

