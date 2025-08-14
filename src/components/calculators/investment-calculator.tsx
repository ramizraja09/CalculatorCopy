
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info, Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Financial functions
const calcFV = (rate: number, nper: number, pmt: number, pv: number) => {
    if (rate === 0) return -(pv + pmt * nper);
    return -(pv * Math.pow(1 + rate, nper) + pmt * (Math.pow(1 + rate, nper) - 1) / rate);
};

const calcPMT = (rate: number, nper: number, pv: number, fv: number) => {
    if (rate === 0) return -(pv + fv) / nper;
    return -(fv + pv * Math.pow(1 + rate, nper)) * rate / (Math.pow(1 + rate, nper) - 1);
};

const calcPV = (rate: number, nper: number, pmt: number, fv: number) => {
    if (rate === 0) return -(fv + pmt * nper);
    return -( (pmt * (Math.pow(1 + rate, nper) - 1) / rate + fv) / Math.pow(1 + rate, nper) );
};

const calcNPER = (rate: number, pmt: number, pv: number, fv: number) => {
    if (rate === 0) {
        if (pmt === 0) return NaN; // Cannot solve
        return -(pv + fv) / pmt;
    }
    const logVal = (pmt - fv * rate) / (pmt + pv * rate);
    if (logVal <= 0) return NaN; // No real solution
    return Math.log(logVal) / Math.log(1 + rate);
};

// Iterative function to find the rate
const calcRATE = (nper: number, pmt: number, pv: number, fv: number, guess = 0.005, max_iter = 100, tol = 1e-6) => {
  let rate = guess;
  for (let i = 0; i < max_iter; i++) {
    const fv_at_rate = pv * Math.pow(1 + rate, nper) + pmt * (Math.pow(1 + rate, nper) - 1) / rate;
    const fv_deriv = nper * pv * Math.pow(1 + rate, nper - 1) + pmt * ((nper * rate * Math.pow(1 + rate, nper - 1) - (Math.pow(1 + rate, nper) - 1)) / (rate * rate));
    
    const new_rate = rate - (fv_at_rate + fv) / fv_deriv;
    
    if (Math.abs(new_rate - rate) < tol) {
      return new_rate * 12 * 100; // Return annual rate
    }
    rate = new_rate;
  }
  return NaN; // Failed to converge
};

const formSchema = z.object({
  solveFor: z.enum(['fv', 'pmt', 'pv', 'nper', 'rate']),
  pv: z.number().optional(), // Starting Amount
  fv: z.number().optional(), // End Amount
  pmt: z.number().optional(), // Additional Contribution
  nper: z.number().optional(), // Investment Length (in months)
  rate: z.number().optional(), // Annual Rate
});

type FormData = z.infer<typeof formSchema>;

export default function InvestmentCalculator() {
  const [results, setResults] = useState<{ [key: string]: string | number | null }>({});
  const [activeTab, setActiveTab] = useState('fv');
  const [lastCalculatedData, setLastCalculatedData] = useState<FormData | null>(null);


  const { control, handleSubmit, setValue, getValues } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      solveFor: 'fv',
      pv: 1000,
      pmt: 100,
      nper: 120, // 10 years
      rate: 7,
      fv: 0,
    },
  });

  const calculate = () => {
    const data = getValues();
    let res: number | string = 0;
    const { pv = 0, fv = 0, pmt = 0, nper = 0, rate = 0 } = data;
    const monthlyRate = (rate ?? 0) / 100 / 12;

    try {
        switch (activeTab) {
            case 'fv':
                res = calcFV(monthlyRate, nper, pmt, pv);
                break;
            case 'pmt':
                res = calcPMT(monthlyRate, nper, pv, fv);
                break;
            case 'pv':
                res = calcPV(monthlyRate, nper, pmt, fv);
                break;
            case 'nper':
                res = calcNPER(monthlyRate, pmt, pv, fv);
                if (isNaN(res)) throw new Error("Cannot calculate periods with these values.");
                break;
            case 'rate':
                res = calcRATE(nper, pmt, pv, -fv);
                if (isNaN(res)) throw new Error("Could not converge on a rate. Try different values.");
                break;
        }

        const newResults = {...results};

        if (typeof res === 'number') {
            if (activeTab === 'nper') {
                 const years = Math.floor(res / 12);
                 const months = Math.round(res % 12);
                 newResults[activeTab] = `${years} years, ${months} months`;
            } else if (activeTab === 'rate') {
                newResults[activeTab] = `${res.toFixed(3)}%`;
            }
            else {
                 newResults[activeTab] = (Math.abs(res)).toFixed(2);
            }
        } else {
            newResults[activeTab] = res;
        }
        setResults(newResults);
        setLastCalculatedData(data); // Store data for export

    } catch (error: any) {
       setResults({ ...results, [activeTab]: `Error: ${error.message}` });
       setLastCalculatedData(null);
    }
  };

  const isInputDisabled = (field: keyof FormData) => activeTab === field;
  const formatCurrency = (value: string | number | null) => {
    if (value === null || value === undefined) return '';
    const num = parseFloat(String(value));
    if (isNaN(num)) return String(value); // Return original string if not a number
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
  }

  const handleExport = (format: 'txt' | 'csv') => {
    if (!lastCalculatedData || !results[activeTab]) return;

    let content = '';
    const filename = `tvm-calculation.${format}`;

    const { pv, fv, pmt, nper, rate } = lastCalculatedData;
    const resultValue = results[activeTab];

    if (format === 'txt') {
        content = `Time Value of Money Calculation\n\n`;
        content += `Solving for: ${activeTab.toUpperCase()}\n\n`;
        content += `Inputs:\n`;
        content += `- Present Value (PV): ${pv !== undefined ? formatCurrency(pv) : 'N/A'}\n`;
        content += `- Future Value (FV): ${fv !== undefined ? formatCurrency(fv) : 'N/A'}\n`;
        content += `- Payment (PMT): ${pmt !== undefined ? formatCurrency(pmt) : 'N/A'}\n`;
        content += `- Periods (NPER): ${nper !== undefined ? `${nper} months` : 'N/A'}\n`;
        content += `- Annual Rate: ${rate !== undefined ? `${rate}%` : 'N/A'}\n\n`;
        content += `Result:\n- ${activeTab.toUpperCase()}: ${resultValue}\n`;
    } else { // csv
        content = 'Category,Value\n';
        content += `Solving For,${activeTab.toUpperCase()}\n`;
        content += `Present Value (PV),${pv || ''}\n`;
        content += `Future Value (FV),${fv || ''}\n`;
        content += `Payment (PMT),${pmt || ''}\n`;
        content += `Periods (NPER),${nper || ''}\n`;
        content += `Annual Rate (%),${rate || ''}\n`;
        content += `Result,"${resultValue}"\n`;
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
    <Tabs defaultValue="fv" onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
        <TabsTrigger value="fv">End Amount</TabsTrigger>
        <TabsTrigger value="pmt">Contribution</TabsTrigger>
        <TabsTrigger value="rate">Return Rate</TabsTrigger>
        <TabsTrigger value="pv">Starting Amount</TabsTrigger>
        <TabsTrigger value="nper">Investment Length</TabsTrigger>
      </TabsList>
      
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="capitalize">Calculate {
            {fv: "End Amount (Future Value)", pmt: "Additional Contribution (Payment)", pv: "Starting Amount (Present Value)", nper: "Investment Length (Periods)", rate: "Return Rate"}[activeTab]
          }</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); calculate(); }} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pv">Starting Amount ($)</Label>
                <Controller name="pv" control={control} render={({ field }) => <Input type="number" step="any" {...field} disabled={isInputDisabled('pv')} value={isInputDisabled('pv') ? (results.pv ? formatCurrency(results.pv).replace(/[^0-9.-]+/g,"") : '') : field.value} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
              </div>
              <div>
                <Label htmlFor="pmt">Additional Contribution ($/month)</Label>
                <Controller name="pmt" control={control} render={({ field }) => <Input type="number" step="any" {...field} disabled={isInputDisabled('pmt')} value={isInputDisabled('pmt') ? (results.pmt ? formatCurrency(results.pmt).replace(/[^0-9.-]+/g,"") : '') : field.value} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))}/>} />
              </div>
              <div>
                <Label htmlFor="nper">Investment Length (months)</Label>
                <Controller name="nper" control={control} render={({ field }) => <Input type="number" {...field} disabled={isInputDisabled('nper')} value={isInputDisabled('nper') ? (typeof results.nper === 'string' ? results.nper.split(' ')[0] : '') : field.value} onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))}/>} />
              </div>
              <div>
                <Label htmlFor="rate">Annual Return Rate (%)</Label>
                <Controller name="rate" control={control} render={({ field }) => <Input type="number" step="any" {...field} disabled={isInputDisabled('rate')} value={isInputDisabled('rate') ? (typeof results.rate === 'string' ? results.rate.replace('%', '') : '') : field.value} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))}/>} />
              </div>
              <div>
                <Label htmlFor="fv">End Amount (Your Target) ($)</Label>
                <Controller name="fv" control={control} render={({ field }) => <Input type="number" step="any" {...field} disabled={isInputDisabled('fv')} value={isInputDisabled('fv') ? (results.fv ? formatCurrency(results.fv).replace(/[^0-9.-]+/g,"") : '') : field.value} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))}/>} />
              </div>
            </div>
            
            <div className="flex gap-2">
                <Button type="submit" className="flex-1">Calculate</Button>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" disabled={!lastCalculatedData}>
                            <Download className="mr-2 h-4 w-4" /> Export
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleExport('txt')}>Download as .txt</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExport('csv')}>Download as .csv</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {results[activeTab] && (
                <Alert className="mt-4">
                    <Info className="h-4 w-4" />
                    <AlertTitle>Result</AlertTitle>
                    <AlertDescription className="text-lg font-bold">
                        {
                           activeTab === 'nper' ? results[activeTab] : 
                           activeTab === 'rate' ? results[activeTab] :
                           formatCurrency(results[activeTab])
                        }
                    </AlertDescription>
                </Alert>
            )}

          </form>
        </CardContent>
      </Card>
    </Tabs>
  );
}
