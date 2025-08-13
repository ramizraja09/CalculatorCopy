
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download } from 'lucide-react';

const formSchema = z.object({
  calories: z.number().min(1, "Calories must be positive"),
  goal: z.enum(['maintenance', 'cutting', 'bulking']),
});

type FormData = z.infer<typeof formSchema>;

const macroRatios = {
  maintenance: { protein: 0.3, carbs: 0.4, fat: 0.3 },
  cutting: { protein: 0.4, carbs: 0.3, fat: 0.3 },
  bulking: { protein: 0.3, carbs: 0.5, fat: 0.2 },
};

export default function MacroCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { calories: 2000, goal: 'maintenance' },
  });

  const calculateMacros = (data: FormData) => {
    const { calories, goal } = data;
    const ratios = macroRatios[goal];
    
    const proteinGrams = (calories * ratios.protein) / 4;
    const carbGrams = (calories * ratios.carbs) / 4;
    const fatGrams = (calories * ratios.fat) / 9;

    setResults({ proteinGrams, carbGrams, fatGrams });
    setFormData(data);
  };

  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `macros-calculation.${format}`;
    const { calories, goal } = formData;

    if (format === 'txt') {
      content = `Macronutrient Calculation\n\nInputs:\n- Daily Calories: ${calories}\n- Goal: ${goal}\n\nResult:\n- Protein: ${Math.round(results.proteinGrams)}g\n- Carbs: ${Math.round(results.carbGrams)}g\n- Fat: ${Math.round(results.fatGrams)}g`;
    } else {
       content = `Calories,Goal,Protein(g),Carbs(g),Fat(g)\n${calories},${goal},${Math.round(results.proteinGrams)},${Math.round(results.carbGrams)},${Math.round(results.fatGrams)}`;
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
    <form onSubmit={handleSubmit(calculateMacros)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Inputs</h3>
        <div>
          <Label htmlFor="calories">Daily Calorie Goal</Label>
          <Controller name="calories" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))} />} />
          {errors.calories && <p className="text-destructive text-sm mt-1">{errors.calories.message}</p>}
        </div>
        <div>
          <Label>Primary Goal</Label>
          <Controller name="goal" control={control} render={({ field }) => (
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="cutting">Cutting (Weight Loss)</SelectItem>
                <SelectItem value="bulking">Bulking (Weight Gain)</SelectItem>
              </SelectContent>
            </Select>
          )} />
        </div>
        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Calculate Macros</Button>
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
        <h3 className="text-xl font-semibold">Results</h3>
        {results ? (
            <Card>
                <CardContent className="p-4 grid grid-cols-3 gap-2 text-center">
                    <div>
                        <p className="font-semibold text-primary">Protein</p>
                        <p className="text-2xl font-bold">{Math.round(results.proteinGrams)}g</p>
                    </div>
                     <div>
                        <p className="font-semibold text-primary">Carbs</p>
                        <p className="text-2xl font-bold">{Math.round(results.carbGrams)}g</p>
                    </div>
                     <div>
                        <p className="font-semibold text-primary">Fat</p>
                        <p className="text-2xl font-bold">{Math.round(results.fatGrams)}g</p>
                    </div>
                </CardContent>
            </Card>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter details to calculate macros</p></div>
        )}
      </div>
    </form>
  );
}
