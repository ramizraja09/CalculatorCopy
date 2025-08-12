
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download } from 'lucide-react';

const formSchema = z.object({
  n: z.number().int().min(1, 'n must be at least 1'),
  r: z.number().int().min(1, 'r must be at least 1'),
}).refine(data => data.n >= data.r, {
    message: "n must be greater than or equal to r",
    path: ['r'],
});

type FormData = z.infer<typeof formSchema>;

const factorial = (num: number): number => {
  if (num < 0) return -1;
  if (num === 0) return 1;
  let result = 1;
  for(let i=1; i<=num; i++) {
    result *= i;
  }
  return result;
};


export default function CombinationsPermutationsCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { n: 10, r: 3 },
  });

  const calculate = (data: FormData) => {
    const { n, r } = data;
    try {
        const nFact = factorial(n);
        const rFact = factorial(r);
        const nMinusRFact = factorial(n - r);

        const permutations = nFact / nMinusRFact;
        const combinations = nFact / (rFact * nMinusRFact);
        setResults({ combinations, permutations });
        setFormData(data);
    } catch(e) {
        // Handle potential stack overflow for large numbers
        setResults({combinations: "Too large", permutations: "Too large"})
        setFormData(data);
    }
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    const { n, r } = formData;
    
    let content = '';
    const filename = `combo-perm-result.${format}`;

    if (format === 'txt') {
      content = `Combinations & Permutations Calculation\n\nInputs:\nTotal items (n): ${n}\nItems to choose (r): ${r}\n\nResults:\nCombinations (nCr): ${results.combinations.toLocaleString()}\nPermutations (nPr): ${results.permutations.toLocaleString()}`;
    } else {
      content = `n,r,Combinations,Permutations\n${n},${r},${results.combinations},${results.permutations}`;
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
    <form onSubmit={handleSubmit(calculate)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Inputs</h3>
        <div><Label>Total number of items (n)</Label><Controller name="n" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} />
        {errors.n && <p className="text-destructive text-sm mt-1">{errors.n.message}</p>}</div>
        <div><Label>Number of items to choose (r)</Label><Controller name="r" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} />
        {errors.r && <p className="text-destructive text-sm mt-1">{errors.r.message}</p>}</div>
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

      {/* Results */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Result</h3>
        {results ? (
            <div className="grid grid-cols-1 gap-4">
                <Card><CardContent className="p-4 text-center"><p className="text-muted-foreground">Combinations (nCr)</p><p className="text-2xl font-bold">{results.combinations.toLocaleString()}</p></CardContent></Card>
                <Card><CardContent className="p-4 text-center"><p className="text-muted-foreground">Permutations (nPr)</p><p className="text-2xl font-bold">{results.permutations.toLocaleString()}</p></CardContent></Card>
            </div>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter n and r to calculate</p></div>
        )}
      </div>
    </form>
  );
}
