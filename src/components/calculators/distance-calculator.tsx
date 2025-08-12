
"use client";

import { useState } from 'react';
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

const formSchema = z.object({
  lat1: z.number().min(-90).max(90),
  lon1: z.number().min(-180).max(180),
  lat2: z.number().min(-90).max(90),
  lon2: z.number().min(-180).max(180),
});

type FormData = z.infer<typeof formSchema>;

// Haversine formula to calculate distance between two points on Earth
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distanceKm = R * c;
    const distanceMiles = distanceKm * 0.621371;
    return { distanceKm, distanceMiles };
}

export default function DistanceCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      lat1: 40.7128, lon1: -74.0060, // NYC
      lat2: 34.0522, lon2: -118.2437, // LA
    },
  });

  const calculateDistance = (data: FormData) => {
    const { lat1, lon1, lat2, lon2 } = data;
    const distances = getDistance(lat1, lon1, lat2, lon2);
    setResults(distances);
    setFormData(data);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;

    let content = '';
    const filename = `distance-calculation.${format}`;
    const { lat1, lon1, lat2, lon2 } = formData;

    if (format === 'txt') {
      content = `Distance Calculation\n\nInputs:\n- Point 1: ${lat1}, ${lon1}\n- Point 2: ${lat2}, ${lon2}\n\nResult:\n- Distance (km): ${results.distanceKm.toFixed(2)}\n- Distance (miles): ${results.distanceMiles.toFixed(2)}`;
    } else {
      content = `Category,Value\nLatitude 1,${lat1}\nLongitude 1,${lon1}\nLatitude 2,${lat2}\nLongitude 2,${lon2}\nDistance (km),${results.distanceKm.toFixed(2)}\nDistance (miles),${results.distanceMiles.toFixed(2)}`;
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
    <form onSubmit={handleSubmit(calculateDistance)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs Column */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Point 1 (Latitude, Longitude)</h3>
        <div className="flex gap-2">
            <div>
              <Label htmlFor="lat1">Lat 1</Label>
              <Controller name="lat1" control={control} render={({ field }) => <Input type="number" step="0.0001" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
            </div>
            <div>
              <Label htmlFor="lon1">Lon 1</Label>
              <Controller name="lon1" control={control} render={({ field }) => <Input type="number" step="0.0001" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
            </div>
        </div>
        {(errors.lat1 || errors.lon1) && <p className="text-destructive text-sm mt-1">Please enter valid coordinates for Point 1.</p>}
        
        <h3 className="text-xl font-semibold">Point 2 (Latitude, Longitude)</h3>
        <div className="flex gap-2">
            <div>
              <Label htmlFor="lat2">Lat 2</Label>
              <Controller name="lat2" control={control} render={({ field }) => <Input type="number" step="0.0001" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
            </div>
            <div>
              <Label htmlFor="lon2">Lon 2</Label>
              <Controller name="lon2" control={control} render={({ field }) => <Input type="number" step="0.0001" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
            </div>
        </div>
        {(errors.lat2 || errors.lon2) && <p className="text-destructive text-sm mt-1">Please enter valid coordinates for Point 2.</p>}
        
        <div className="flex gap-2">
            <Button type="submit" className="flex-1">Calculate Distance</Button>
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
        <h3 className="text-xl font-semibold">Distance</h3>
        {results ? (
            <div className="space-y-4">
                <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-sm text-muted-foreground">Miles</p>
                        <p className="text-3xl font-bold">{results.distanceMiles.toFixed(2)} mi</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-sm text-muted-foreground">Kilometers</p>
                        <p className="text-3xl font-bold">{results.distanceKm.toFixed(2)} km</p>
                    </CardContent>
                </Card>
            </div>
        ) : (
             <div className="flex items-center justify-center h-60 bg-muted/50 rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">Enter coordinates to calculate distance</p>
            </div>
        )}
      </div>
    </form>
  );
}
