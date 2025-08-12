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

const carbRatios = {
  maintenance: 0.4, // 40%
  cutting: 0.3,     // 30%
  bulking: 0.5,     // 50%
};

export default function CarbCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { calories: 2000, goal: 'maintenance' },
  });

  const calculateCarbs = (data: FormData) => {
    const { calories, goal } = data;
    const ratio = carbRatios[goal];
    
    // 1 gram of carbohydrates = 4 calories
    const carbGrams = (calories * ratio) / 4;

    setResults({ carbGrams });
    setFormData(data);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `carb-calculation.${format}`;
    const { calories, goal } = formData;

    if (format === 'txt') {
      content = `Carb Calculation\n\nInputs:\n- Daily Calories: ${calories}\n- Goal: ${goal}\n\nResult:\n- Recommended Carb Intake: ${Math.round(results.carbGrams)}g`;
    } else {
       content = `Calories,Goal,Carb Intake (g)\n${calories},${goal},${Math.round(results.carbGrams)}`;
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
    <form onSubmit={handleSubmit(calculateCarbs)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Inputs</h3>
        <div>
          <Label htmlFor="calories">Daily Calorie Goal</Label>
          <Controller name="calories" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} />
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
            <Button type="submit" className="flex-1">Calculate Carbs</Button>
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
                <CardContent className="p-6 text-center">
                    <p className="text-sm text-muted-foreground">Recommended Daily Carbohydrate Intake</p>
                    <p className="text-4xl font-bold my-2">{Math.round(results.carbGrams)}g</p>
                </CardContent>
            </Card>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter details to calculate carb intake</p></div>
        )}
      </div>
    </form>
  );
}
