
"use client";

import { useState, useEffect, useCallback } from 'react';
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

// Basic sun position calculation (simplified, does not account for all orbital complexities)
function getSunPosition(date: Date, latitude: number, longitude: number) {
    const rad = Math.PI / 180;
    const day = Math.floor((Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - Date.UTC(date.getUTCFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    
    const gama = (2 * Math.PI / 365) * (day - 1 + (date.getUTCHours() - 12) / 24);
    
    const eqtime = 229.18 * (0.000075 + 0.001868 * Math.cos(gama) - 0.032077 * Math.sin(gama) - 0.014615 * Math.cos(2 * gama) - 0.040849 * Math.sin(2 * gama));
    
    const decl = 0.006918 - 0.399912 * Math.cos(gama) + 0.070257 * Math.sin(gama) - 0.006758 * Math.cos(2 * gama) + 0.000907 * Math.sin(2 * gama) - 0.002697 * Math.cos(3 * gama) + 0.00148 * Math.sin(3 * gama);

    const time_offset = eqtime - 4 * longitude;
    const tst = date.getUTCHours() * 60 + date.getUTCMinutes() + date.getUTCSeconds() / 60 + time_offset;
    const ha = (tst / 4) - 180;

    const latRad = latitude * rad;
    const haRad = ha * rad;

    const zenith = Math.acos(Math.sin(latRad) * Math.sin(decl) + Math.cos(latRad) * Math.cos(decl) * Math.cos(haRad));
    const elevation = 90 - (zenith / rad);
    
    const azimuth = Math.acos((Math.sin(decl) - Math.sin(latRad) * Math.cos(zenith)) / (Math.cos(latRad) * Math.sin(zenith))) / rad;

    return {
        elevation: elevation,
        azimuth: (ha > 0) ? (360 - azimuth) : azimuth,
    };
}


const formSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

type FormData = z.infer<typeof formSchema>;

export default function SunAngleCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [currentTime, setCurrentTime] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const { control, handleSubmit, getValues, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      latitude: 40.7128, // New York City
      longitude: -74.0060,
    },
  });

  const updateSunPosition = useCallback(() => {
    const now = new Date();
    setCurrentTime(now.toUTCString());
    const { latitude, longitude } = getValues();
    if(latitude !== undefined && longitude !== undefined) {
      setResults(getSunPosition(now, latitude, longitude));
      setFormData({latitude, longitude});
    }
  }, [getValues]);


  useEffect(() => {
    if (!isClient) return;
    updateSunPosition();
    const timer = setInterval(updateSunPosition, 1000); 
    return () => clearInterval(timer);
  }, [isClient, updateSunPosition]);

  const calculateSunAngle = (data: FormData) => {
    const { latitude, longitude } = data;
    const position = getSunPosition(new Date(), latitude, longitude);
    setResults(position);
    setFormData(data);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;

    let content = '';
    const filename = `sun-angle-calculation.${format}`;
    const { latitude, longitude } = formData;

    if (format === 'txt') {
      content = `Sun Angle Calculation\n\nInputs:\n- Latitude: ${latitude}\n- Longitude: ${longitude}\n- Time (UTC): ${currentTime}\n\nResult:\n- Elevation: ${results.elevation.toFixed(2)}°\n- Azimuth: ${results.azimuth.toFixed(2)}°`;
    } else {
      content = `Category,Value\nLatitude,${latitude}\nLongitude,${longitude}\nTime (UTC),${currentTime}\nElevation (°),${results.elevation.toFixed(2)}\nAzimuth (°),${results.azimuth.toFixed(2)}`;
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
    <form onSubmit={handleSubmit(calculateSunAngle)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs Column */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Location</h3>
        
        <div>
          <Label htmlFor="latitude">Latitude (-90 to 90)</Label>
          <Controller name="latitude" control={control} render={({ field }) => <Input id="latitude" type="number" step="0.0001" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
          {errors.latitude && <p className="text-destructive text-sm mt-1">{errors.latitude.message}</p>}
        </div>

        <div>
          <Label htmlFor="longitude">Longitude (-180 to 180)</Label>
          <Controller name="longitude" control={control} render={({ field }) => <Input id="longitude" type="number" step="0.0001" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
          {errors.longitude && <p className="text-destructive text-sm mt-1">{errors.longitude.message}</p>}
        </div>

        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Get Current Sun Position</Button>
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
         <Card className="mt-4">
            <CardContent className="p-4 text-center">
                 <p className="text-sm text-muted-foreground">Current UTC Time</p>
                 <p className="font-mono">{isClient ? currentTime : 'Loading...'}</p>
            </CardContent>
         </Card>
      </div>

      {/* Results Column */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Sun Position</h3>
        {isClient && results ? (
            results.error ? (
                <Card className="flex items-center justify-center h-60 bg-muted/50 border-dashed">
                    <p className="text-destructive">{results.error}</p>
                </Card>
            ) : (
                <Card>
                    <CardContent className="p-4 grid grid-cols-2 gap-4 text-center">
                        <div>
                            <p className="text-sm text-muted-foreground">Elevation / Altitude</p>
                            <p className="text-2xl font-bold">{results.elevation.toFixed(2)}°</p>
                        </div>
                         <div>
                            <p className="text-sm text-muted-foreground">Azimuth</p>
                            <p className="text-2xl font-bold">{results.azimuth.toFixed(2)}°</p>
                        </div>
                    </CardContent>
                </Card>
            )
        ) : (
             <div className="flex items-center justify-center h-60 bg-muted/50 rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">Enter location to see the sun's position</p>
            </div>
        )}
      </div>
    </form>
  );
}
