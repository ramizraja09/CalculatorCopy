
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const formSchema = z.object({
  roomLength: z.number().min(1, 'Length must be positive'),
  roomWidth: z.number().min(1, 'Width must be positive'),
  roomHeight: z.number().min(1, 'Height must be positive'),
  numDoors: z.number().int().min(0),
  numWindows: z.number().int().min(0),
  coats: z.number().int().min(1, 'Must have at least one coat'),
  coveragePerGallon: z.number().min(1, 'Coverage must be positive'),
  pricePerGallon: z.number().min(0).optional(),
});

type FormData = z.infer<typeof formSchema>;

const DOOR_AREA = 21; // sq. ft.
const WINDOW_AREA = 15; // sq. ft.
const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

export default function PaintCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      roomLength: 12,
      roomWidth: 10,
      roomHeight: 8,
      numDoors: 1,
      numWindows: 2,
      coats: 2,
      coveragePerGallon: 350,
      pricePerGallon: 45,
    },
  });

  const calculatePaint = (data: FormData) => {
    const { roomLength, roomWidth, roomHeight, numDoors, numWindows, coats, coveragePerGallon, pricePerGallon } = data;
    
    const totalWallArea = 2 * (roomLength * roomHeight) + 2 * (roomWidth * roomHeight);
    const areaToSubtract = (numDoors * DOOR_AREA) + (numWindows * WINDOW_AREA);
    const paintableArea = totalWallArea - areaToSubtract;
    const totalAreaToCover = paintableArea * coats;
    
    const gallonsNeeded = totalAreaToCover / coveragePerGallon;
    const rollsToBuy = Math.ceil(gallonsNeeded);
    const totalCost = pricePerGallon ? rollsToBuy * pricePerGallon : 0;
    
    setResults({
      gallonsNeeded,
      rollsToBuy,
      totalCost,
      totalWallArea,
      areaToSubtract,
      paintableArea,
      chartData: [
        { name: '1 Coat', gallons: paintableArea / coveragePerGallon },
        { name: '2 Coats', gallons: (paintableArea * 2) / coveragePerGallon },
      ]
    });
    setFormData(data);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;

    let content = '';
    const filename = `paint-calculation.${format}`;

    if (format === 'txt') {
      content = `Paint Calculation\n\nInputs:\n${Object.entries(formData).map(([k,v]) => `- ${k}: ${v}`).join('\n')}\n\nResult:\n- Gallons Needed: ${results.gallonsNeeded.toFixed(2)}\n- Gallons to Buy: ${results.rollsToBuy}\n- Total Cost: ${formatCurrency(results.totalCost)}`;
    } else {
      content = `Category,Value\n${Object.entries(formData).map(([k,v]) => `${k},${v}`).join('\n')}\nResult Category,Value\nGallons Needed,${results.gallonsNeeded.toFixed(2)}\nGallons to Buy,${results.rollsToBuy}\nTotal Cost,${results.totalCost}`;
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
    <form onSubmit={handleSubmit(calculatePaint)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs Column */}
      <div className="space-y-4">
        <Card>
            <CardHeader><CardTitle>Room & Project Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <h4 className="font-semibold">Room Dimensions (feet)</h4>
                <div className="grid grid-cols-3 gap-2">
                    <div><Label>Length</Label><Controller name="roomLength" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                    <div><Label>Width</Label><Controller name="roomWidth" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                    <div><Label>Height</Label><Controller name="roomHeight" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                </div>
                <h4 className="font-semibold">Openings</h4>
                 <div className="grid grid-cols-2 gap-4">
                    <div><Label>Number of Doors</Label><Controller name="numDoors" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
                    <div><Label>Number of Windows</Label><Controller name="numWindows" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
                </div>
                <h4 className="font-semibold">Paint Details</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div><Label>Number of Coats</Label><Controller name="coats" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} /></div>
                    <div><Label>Coverage (sq.ft/gallon)</Label><Controller name="coveragePerGallon" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                </div>
                <div><Label>Price per Gallon ($)</Label><Controller name="pricePerGallon" control={control} render={({ field }) => <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
            </CardContent>
        </Card>
        
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

      {/* Results Column */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Paint Estimate</h3>
        {results ? (
            <div className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Summary</AlertTitle>
                  <AlertDescription>You will need approximately <strong>{results.gallonsNeeded.toFixed(2)} gallons</strong> of paint. We recommend buying <strong>{results.rollsToBuy} gallons</strong> to be safe.
                  {results.totalCost > 0 && ` The estimated cost will be ${formatCurrency(results.totalCost)}.`}
                  </AlertDescription>
                </Alert>
                <Card>
                  <CardHeader><CardTitle className="text-base text-center">Breakdown</CardTitle></CardHeader>
                  <CardContent className="text-sm space-y-1">
                      <div className="flex justify-between"><span>Total Wall Area:</span><span>{results.totalWallArea.toFixed(1)} sq ft</span></div>
                      <div className="flex justify-between"><span>Area of Openings:</span><span>-{results.areaToSubtract.toFixed(1)} sq ft</span></div>
                      <div className="flex justify-between font-bold border-t pt-1"><span>Paintable Area:</span><span>{results.paintableArea.toFixed(1)} sq ft</span></div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-base text-center">Gallons Needed by Number of Coats</CardTitle></CardHeader>
                  <CardContent className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={results.chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip formatter={(value: number) => `${value.toFixed(2)} gal`} />
                            <Bar dataKey="gallons" fill="hsl(var(--primary))" name="Gallons" />
                        </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
            </div>
        ) : (
             <div className="flex items-center justify-center h-full min-h-[30rem] bg-muted/50 rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground p-8 text-center">Enter your project details to estimate how much paint you need.</p>
            </div>
        )}
      </div>
    </form>
  );
}
