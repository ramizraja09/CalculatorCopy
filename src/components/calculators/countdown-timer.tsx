
"use client";

import { useState, useEffect } from 'react';
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
  targetDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" }),
  targetTime: z.string(),
});

type FormData = z.infer<typeof formSchema>;

export default function CountdownTimer() {
  const [countdown, setCountdown] = useState<any>(null);
  const [target, setTarget] = useState<Date | null>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], targetTime: "12:00" },
  });

  useEffect(() => {
    if (!target) return;
    
    const interval = setInterval(() => {
      const now = new Date();
      const difference = target.getTime() - now.getTime();

      if (difference <= 0) {
        setCountdown({ d: 0, h: 0, m: 0, s: 0 });
        clearInterval(interval);
        return;
      }
      
      const d = Math.floor(difference / (1000 * 60 * 60 * 24));
      const h = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((difference % (1000 * 60)) / 1000);
      setCountdown({ d, h, m, s });
    }, 1000);

    return () => clearInterval(interval);
  }, [target]);
  
  const startCountdown = (data: FormData) => {
    const [hours, minutes] = data.targetTime.split(':').map(Number);
    const date = new Date(data.targetDate);
    date.setHours(hours, minutes);
    setTarget(date);
    setFormData(data);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!countdown || !formData) return;
    const { targetDate, targetTime } = formData;
    
    let content = '';
    const filename = `countdown-result.${format}`;
    const timeRemaining = `${countdown.d}d ${countdown.h}h ${countdown.m}m ${countdown.s}s`;

    if (format === 'txt') {
      content = `Countdown Timer State\n\nTarget: ${targetDate} ${targetTime}\nTime Remaining: ${timeRemaining}`;
    } else {
      content = `Target Date,Target Time,Time Remaining\n${targetDate},${targetTime},"${timeRemaining}"`;
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
    <form onSubmit={handleSubmit(startCountdown)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Target Date & Time</h3>
        <div><Label>Date</Label><Controller name="targetDate" control={control} render={({ field }) => <Input type="date" {...field} />} /></div>
        <div><Label>Time (24-hour)</Label><Controller name="targetTime" control={control} render={({ field }) => <Input type="time" {...field} />} /></div>
        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Start Countdown</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={!countdown}>
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
        <h3 className="text-xl font-semibold">Time Remaining</h3>
        {countdown ? (
            <Card>
                <CardContent className="p-6 grid grid-cols-4 gap-2 text-center">
                    <div><p className="text-4xl font-bold">{String(countdown.d).padStart(2,'0')}</p><p className="text-xs text-muted-foreground">Days</p></div>
                    <div><p className="text-4xl font-bold">{String(countdown.h).padStart(2,'0')}</p><p className="text-xs text-muted-foreground">Hours</p></div>
                    <div><p className="text-4xl font-bold">{String(countdown.m).padStart(2,'0')}</p><p className="text-xs text-muted-foreground">Mins</p></div>
                    <div><p className="text-4xl font-bold">{String(countdown.s).padStart(2,'0')}</p><p className="text-xs text-muted-foreground">Secs</p></div>
                </CardContent>
            </Card>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Set a target date to start</p></div>
        )}
      </div>
    </form>
  );
}
