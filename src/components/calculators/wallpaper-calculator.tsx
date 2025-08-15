
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

const formSchema = z.object({
  roomLength: z.number().min(1, 'Length must be positive'),
  roomWidth: z.number().min(1, 'Width must be positive'),
  roomHeight: z.number().min(1, 'Height must be positive'),
  rollWidth: z.number().min(0.1, 'Roll width must be positive'),
  rollLength: z.number().min(1, 'Roll length must be positive'),
});

type FormData = z.infer<typeof formSchema>;

export default function WallpaperCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      roomLength: 12,
      roomWidth: 10,
      roomHeight: 8,
      rollWidth: 1.71, // 20.5 inches in feet
      rollLength: 33,
    },
  });

  const calculateWallpaper = (data: FormData) => {
    const { roomLength, roomWidth, roomHeight, rollWidth, rollLength } = data;
    
    // Calculate total wall length (perimeter)
    const perimeter = 2 * (roomLength + roomWidth);
    
    // Calculate how many vertical strips are needed
    const stripsNeeded = Math.ceil(perimeter / rollWidth);
    
    // Calculate how many full-height strips can be cut from one roll
    const stripsPerRoll = Math.floor(rollLength / roomHeight);
    
    // Calculate total rolls needed
    const rollsNeeded = stripsPerRoll > 0 ? Math.ceil(stripsNeeded / stripsPerRoll) : 0;
    
    setResults({
      rollsNeeded,
      perimeter: perimeter.toFixed(2),
      stripsNeeded,
      stripsPerRoll,
    });
    setFormData(data);
  };
  
  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;
    
    let content = '';
    const filename = `wallpaper-calculation.${format}`;
    const { roomLength, roomWidth, roomHeight, rollWidth, rollLength } = formData;

    if (format === 'txt') {
      content = `Wallpaper Calculation\n\nInputs:\n- Room Length: ${roomLength} ft\n- Room Width: ${roomWidth} ft\n- Room Height: ${roomHeight} ft\n- Roll Width: ${rollWidth} ft\n- Roll Length: ${rollLength} ft\n\nResult:\n- Rolls Needed: ${results.rollsNeeded} (approx.)\n\nBreakdown:\n- Room Perimeter: ${results.perimeter} ft\n- Strips Needed: ${results.stripsNeeded}\n- Strips per Roll: ${results.stripsPerRoll}`;
    } else {
       content = `Room Length (ft),Room Width (ft),Room Height (ft),Roll Width (ft),Roll Length (ft),Rolls Needed,Room Perimeter (ft),Strips Needed,Strips per Roll\n`;
       content += `${roomLength},${roomWidth},${roomHeight},${rollWidth},${rollLength},${results.rollsNeeded},${results.perimeter},${results.stripsNeeded},${results.stripsPerRoll}`;
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
    <form onSubmit={handleSubmit(calculateWallpaper)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs Column */}
      <div className="space-y-4">
        <Card>
            <CardHeader><CardTitle>Room Dimensions (feet)</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                    <div><Label>Length</Label><Controller name="roomLength" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                    <div><Label>Width</Label><Controller name="roomWidth" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                    <div><Label>Height</Label><Controller name="roomHeight" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                </div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle>Wallpaper Roll Dimensions (feet)</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
                <div><Label>Width</Label><Controller name="rollWidth" control={control} render={({ field }) => <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                <div><Label>Length</Label><Controller name="rollLength" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
            </CardContent>
        </Card>
        
        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Calculate Rolls</Button>
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
        <h3 className="text-xl font-semibold">Estimate</h3>
        {results ? (
            <div className="space-y-4">
                <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-sm text-muted-foreground">Total Rolls Needed</p>
                        <p className="text-4xl font-bold">{results.rollsNeeded}</p>
                        <p className="text-sm text-muted-foreground">(including waste)</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="text-base text-center">Calculation Breakdown</CardTitle></CardHeader>
                    <CardContent className="text-sm space-y-1">
                        <div className="flex justify-between"><span>Room Perimeter:</span><span>{results.perimeter} ft</span></div>
                        <div className="flex justify-between"><span>Strips Needed:</span><span>{results.stripsNeeded}</span></div>
                        <div className="flex justify-between"><span>Strips per Roll:</span><span>{results.stripsPerRoll}</span></div>
                    </CardContent>
                </Card>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Good to know</AlertTitle>
                  <AlertDescription className="text-xs">
                    This calculation does not account for pattern repeats. For wallpapers with a pattern, you may need more rolls. It's always wise to buy at least one extra roll for mistakes and future repairs.
                  </AlertDescription>
                </Alert>
            </div>
        ) : (
             <div className="flex items-center justify-center h-full min-h-[20rem] bg-muted/50 rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground p-8 text-center">Enter your project details to estimate how many rolls of wallpaper you need.</p>
            </div>
        )}
      </div>
    </form>
  );
}
