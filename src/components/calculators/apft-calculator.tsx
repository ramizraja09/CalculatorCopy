"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download } from 'lucide-react';

const formSchema = z.object({
  gender: z.enum(['male', 'female']),
  age: z.number().int().min(17),
  pushups: z.number().int().min(0),
  situps: z.number().int().min(0),
  runMinutes: z.number().int().min(0),
  runSeconds: z.number().int().min(0),
});

type FormData = z.infer<typeof formSchema>;

// Simplified scoring, a real version would use large lookup tables.
const getScore = (reps: number) => Math.min(100, Math.max(0, (reps - 10) * 2));
const getRunScore = (totalSeconds: number) => {
    const baseTime = 18 * 60; // 18:00
    const score = 100 - (totalSeconds - (13 * 60)) / 6;
    return Math.min(100, Math.max(0, score));
}

export default function ApftCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { gender: 'male', age: 25, pushups: 50, situps: 60, runMinutes: 15, runSeconds: 30 },
  });

  const calculateScore = (data: FormData) => {
    const pushupScore = getScore(data.pushups);
    const situpScore = getScore(data.situps);
    const runTimeSeconds = (data.runMinutes * 60) + data.runSeconds;
    const runScore = getRunScore(runTimeSeconds);
    const totalScore = pushupScore + situpScore + runScore;
    const passed = pushupScore >= 60 && situpScore >= 60 && runScore >= 60;
    setResults({ pushupScore, situpScore, runScore, totalScore, passed });
    setFormData(data);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `apft-score-calculation.${format}`;
    const { gender, age, pushups, situps, runMinutes, runSeconds } = formData;

    if (format === 'txt') {
      content = `APFT Score Calculation\n\nInputs:\n- Gender: ${gender}\n- Age: ${age}\n- Push-ups: ${pushups}\n- Sit-ups: ${situps}\n- 2-Mile Run: ${runMinutes}m ${runSeconds}s\n\nResult:\n- Total Score: ${results.totalScore}\n- Status: ${results.passed ? 'Passed' : 'Failed'}`;
    } else {
       content = `Gender,Age,Push-ups,Sit-ups,Run Time,Total Score,Status\n${gender},${age},${pushups},${situps},"${runMinutes}m ${runSeconds}s",${results.totalScore},${results.passed ? 'Passed' : 'Failed'}`;
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
    <form onSubmit={handleSubmit(calculateScore)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Inputs</h3>
        <Controller name="gender" control={control} render={({ field }) => (
            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 gap-4">
                <Label className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><RadioGroupItem value="male" className="mr-2"/>Male</Label>
                <Label className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><RadioGroupItem value="female" className="mr-2"/>Female</Label>
            </RadioGroup>
        )}/>
        <div><Label>Age</Label><Controller name="age" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
        <div><Label>Push-up Reps</Label><Controller name="pushups" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
        <div><Label>Sit-up Reps</Label><Controller name="situps" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
        <div>
          <Label>2-Mile Run Time</Label>
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-xs text-muted-foreground">Minutes</Label><Controller name="runMinutes" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
            <div><Label className="text-xs text-muted-foreground">Seconds</Label><Controller name="runSeconds" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
          </div>
        </div>
        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Calculate Score</Button>
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
        <h3 className="text-xl font-semibold">APFT Score</h3>
        {results ? (
            <Card>
                <CardContent className="p-4 space-y-2">
                    <div className={`p-4 text-center rounded-md ${results.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        <p className="font-bold text-lg">Total Score: {results.totalScore}</p>
                        <p>{results.passed ? "Passed" : "Failed"}</p>
                    </div>
                     <div className="grid grid-cols-3 gap-2 text-center">
                        <div><p className="font-semibold">Push-ups</p><p>{results.pushupScore}</p></div>
                        <div><p className="font-semibold">Sit-ups</p><p>{results.situpScore}</p></div>
                        <div><p className="font-semibold">2-Mile Run</p><p>{Math.round(results.runScore)}</p></div>
                    </div>
                </CardContent>
            </Card>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter scores to calculate result</p></div>
        )}
      </div>
    </form>
  );
}
