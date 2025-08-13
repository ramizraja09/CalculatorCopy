
"use client";

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Progress } from '@/components/ui/progress';


const formSchema = z.object({
  magnitude: z.number().min(0).max(10),
});

type FormData = z.infer<typeof formSchema>;

const energyLevels = [
  { mag: 4, label: 'Small Quake' },
  { mag: 5, label: 'Moderate Quake' },
  { mag: 6, label: 'Strong Quake' },
  { mag: 7, label: 'Major Quake' },
  { mag: 8, label: 'Great Quake' },
]

export default function EarthquakeEnergyCalculator() {
  const { control, watch } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { magnitude: 5.0 },
  });

  const formValues = watch();

  let results: { joules: string; tntKg: string; kilotons: string; } | null = null;
  const { magnitude } = formValues;
  if (magnitude >= 0 && magnitude <= 10) {
    const energyJoules = Math.pow(10, 1.5 * magnitude + 4.8);
    const energyTntKg = energyJoules / 4.184e9;
    const energyKilotons = energyTntKg / 1000;
    results = {
        joules: energyJoules.toExponential(2),
        tntKg: energyTntKg.toExponential(2),
        kilotons: energyKilotons.toExponential(2),
    };
  }

  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formValues) return;
    
    let content = '';
    const filename = `earthquake-energy-calculation.${format}`;

    if (format === 'txt') {
      content = `Earthquake Energy Calculation\n\nInput Magnitude: ${formValues.magnitude}\n\nResults:\n- Joules: ${results.joules}\n- TNT (kg): ${results.tntKg}\n- Kilotons: ${results.kilotons}`;
    } else {
       content = `Magnitude,Joules,TNT (kg),Kilotons\n${formValues.magnitude},${results.joules},${results.tntKg},${results.kilotons}`;
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
    <form onSubmit={(e) => e.preventDefault()} className="grid md:grid-cols-2 gap-8">
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Richter Scale Magnitude</h3>
        <div>
          <Label>Magnitude</Label>
          <Controller name="magnitude" control={control} render={({ field }) => <Input type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
        </div>
        <div className="pt-4">
            <Label>Energy Release Scale</Label>
            <Progress value={(formValues.magnitude / 10) * 100} className="w-full mt-2" />
            <div className="w-full flex justify-between text-xs text-muted-foreground mt-1">
                {energyLevels.map(level => <span key={level.mag}>{level.label}</span>)}
            </div>
        </div>
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={!results} className="w-full mt-4">
                    <Download className="mr-2 h-4 w-4" /> Export Results
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleExport('txt')}>Download as .txt</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('csv')}>Download as .csv</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Equivalent Energy Released</h3>
        {results ? (
            <Card>
                <CardContent className="p-6 grid grid-cols-1 gap-4 text-center">
                    <div>
                        <p className="font-semibold text-primary">Joules</p>
                        <p className="text-2xl font-bold">{results.joules}</p>
                    </div>
                     <div>
                        <p className="font-semibold text-primary">Kilograms of TNT</p>
                        <p className="text-2xl font-bold">{results.tntKg}</p>
                    </div>
                     <div>
                        <p className="font-semibold text-primary">Kilotons of TNT</p>
                        <p className="text-2xl font-bold">{results.kilotons}</p>
                    </div>
                </CardContent>
            </Card>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter a magnitude value</p></div>
        )}
      </div>
    </form>
  );
}
