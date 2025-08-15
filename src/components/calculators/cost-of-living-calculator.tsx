
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Mock data for city cost of living indices. In a real app, this would come from an API.
const cityIndices: { [key: string]: { name: string; index: number } } = {
  'nyc': { name: 'New York, NY', index: 100 },
  'sf': { name: 'San Francisco, CA', index: 96.7 },
  'la': { name: 'Los Angeles, CA', index: 77.2 },
  'chicago': { name: 'Chicago, IL', index: 75.3 },
  'houston': { name: 'Houston, TX', index: 62.4 },
  'phoenix': { name: 'Phoenix, AZ', index: 68.1 },
  'seattle': { name: 'Seattle, WA', index: 84.7 },
  'denver': { name: 'Denver, CO', index: 76.5 },
  'austin': { name: 'Austin, TX', index: 69.5 },
  'miami': { name: 'Miami, FL', index: 78.9 },
};

const formSchema = z.object({
  currentCity: z.string().nonempty(),
  newCity: z.string().nonempty(),
  currentSalary: z.number().min(1, 'Salary must be positive'),
});

type FormData = z.infer<typeof formSchema>;

export default function CostOfLivingCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currentCity: 'nyc',
      newCity: 'houston',
      currentSalary: 75000,
    },
  });

  const calculateEquivalentSalary = (data: FormData) => {
    const { currentCity, newCity, currentSalary } = data;
    const currentIndex = cityIndices[currentCity].index;
    const newIndex = cityIndices[newCity].index;
    
    const equivalentSalary = (currentSalary / currentIndex) * newIndex;
    const difference = equivalentSalary - currentSalary;
    
    setResults({
      equivalentSalary,
      difference,
      currentCityName: cityIndices[currentCity].name,
      newCityName: cityIndices[newCity].name,
      error: null,
    });
    setFormData(data);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;

    let content = '';
    const filename = `cost-of-living-calculation.${format}`;
    const { currentCity, newCity, currentSalary } = formData;

    if (format === 'txt') {
      content = `Cost of Living Calculation\n\nInputs:\n- Current City: ${cityIndices[currentCity].name}\n- Current Salary: ${formatCurrency(currentSalary)}\n- New City: ${cityIndices[newCity].name}\n\nResult:\n- Equivalent Salary in New City: ${formatCurrency(results.equivalentSalary)}\n- Difference: ${formatCurrency(results.difference)}`;
    } else {
      content = `Category,Value\nCurrent City,${cityIndices[currentCity].name}\nCurrent Salary,${currentSalary}\nNew City,${cityIndices[newCity].name}\nEquivalent Salary,${results.equivalentSalary.toFixed(2)}\nDifference,${results.difference.toFixed(2)}`;
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

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  return (
    <form onSubmit={handleSubmit(calculateEquivalentSalary)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs Column */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Inputs</h3>
        
        <div>
          <Label htmlFor="currentCity">Current City</Label>
          <Controller name="currentCity" control={control} render={({ field }) => (
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(cityIndices).map(([key, city]) => <SelectItem key={key} value={key}>{city.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )} />
        </div>

        <div>
          <Label htmlFor="currentSalary">Current Annual Salary ($)</Label>
          <Controller name="currentSalary" control={control} render={({ field }) => <Input id="currentSalary" type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} />
          {errors.currentSalary && <p className="text-destructive text-sm mt-1">{errors.currentSalary.message}</p>}
        </div>

        <div>
          <Label htmlFor="newCity">New City</Label>
          <Controller name="newCity" control={control} render={({ field }) => (
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(cityIndices).map(([key, city]) => <SelectItem key={key} value={key}>{city.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )} />
        </div>
        
        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Compare</Button>
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
            <Card>
                <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">To maintain your standard of living in {results.newCityName}, you would need a salary of:</p>
                    <p className="text-3xl font-bold my-2">{formatCurrency(results.equivalentSalary)}</p>
                    <p className={`text-sm font-semibold ${results.difference >= 0 ? 'text-destructive' : 'text-green-600'}`}>
                      That's a difference of {formatCurrency(Math.abs(results.difference))} {results.difference >= 0 ? 'more' : 'less'} per year.
                    </p>
                    <p className="text-xs text-muted-foreground mt-4">*Based on simplified cost of living index data. For estimation purposes only.</p>
                </CardContent>
            </Card>
        ) : (
             <div className="flex items-center justify-center h-60 bg-muted/50 rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">Enter your details to compare cost of living</p>
            </div>
        )}
      </div>
    </form>
  );
}
