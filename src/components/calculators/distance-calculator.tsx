
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
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const formSchema = z.object({
  lat1: z.number().min(-90).max(90),
  lon1: z.number().min(-180).max(180),
  ele1: z.number().optional(),
  lat2: z.number().min(-90).max(90),
  lon2: z.number().min(-180).max(180),
  ele2: z.number().optional(),
  unit: z.enum(['km', 'miles', 'nm']),
});

type FormData = z.infer<typeof formSchema>;

// --- Calculation Logic ---
const toRad = (deg: number) => deg * Math.PI / 180;
const toDeg = (rad: number) => rad * 180 / Math.PI;

function getDistance(data: FormData) {
    const { lat1, lon1, lat2, lon2, ele1 = 0, ele2 = 0, unit } = data;

    const R_km = 6371; // Earth radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const radLat1 = toRad(lat1);
    const radLat2 = toRad(lat2);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(radLat1) * Math.cos(radLat2) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = R_km * c;

    // Bearing calculation
    const y = Math.sin(dLon) * Math.cos(radLat2);
    const x = Math.cos(radLat1) * Math.sin(radLat2) - Math.sin(radLat1) * Math.cos(radLat2) * Math.cos(dLon);
    const bearingRad = Math.atan2(y, x);
    const bearingDeg = (toDeg(bearingRad) + 360) % 360;

    // 3D distance if elevation is provided
    const dEleKm = (ele1 - ele2) / 1000;
    const distance3D_km = Math.sqrt(distanceKm * distanceKm + dEleKm * dEleKm);

    // Unit Conversions
    const kmToMiles = 0.621371;
    const kmToNm = 0.539957;

    return {
        distanceKm,
        distanceMiles: distanceKm * kmToMiles,
        distanceNm: distanceKm * kmToNm,
        distance3D_km,
        distance3D_miles: distance3D_km * kmToMiles,
        bearing: bearingDeg,
    };
}

function getTravelTimes(distanceKm: number) {
    return {
        walking: distanceKm / 5, // Avg walking speed 5 km/h
        driving: distanceKm / 80, // Avg driving speed 80 km/h
        flying: distanceKm / 800, // Avg commercial flight speed 800 km/h
    };
}
// --- End Calculation Logic ---


export default function DistanceCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      lat1: 40.7128, lon1: -74.0060, // NYC
      lat2: 34.0522, lon2: -118.2437, // LA
      unit: 'miles',
    },
  });

  const calculateDistance = (data: FormData) => {
    const distances = getDistance(data);
    const travelTimes = getTravelTimes(distances.distanceKm);
    setResults({ ...distances, ...travelTimes });
    setFormData(data);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;

    let content = '';
    const filename = `distance-calculation.${format}`;
    const { lat1, lon1, lat2, lon2 } = formData;

    if (format === 'txt') {
      content = `Distance Calculation\n\nInputs:\n- Point 1: ${lat1}, ${lon1}\n- Point 2: ${lat2}, ${lon2}\n\nResult:\n- Distance (km): ${results.distanceKm.toFixed(2)}\n- Distance (miles): ${results.distanceMiles.toFixed(2)}\n- Bearing: ${results.bearing.toFixed(2)}°`;
    } else {
      content = `Category,Value\nLatitude 1,${lat1}\nLongitude 1,${lon1}\nLatitude 2,${lat2}\nLongitude 2,${lon2}\nDistance (km),${results.distanceKm.toFixed(2)}\nDistance (miles),${results.distanceMiles.toFixed(2)}\nBearing (°),${results.bearing.toFixed(2)}`;
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
  
  const formatTime = (hours: number) => {
    if (hours < 1) {
        return `${Math.round(hours * 60)} minutes`;
    }
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const chartData = results ? [
    { name: 'Kilometers', value: results.distanceKm },
    { name: 'Miles', value: results.distanceMiles },
    { name: 'Nautical Miles', value: results.distanceNm },
  ] : [];

  return (
    <div className="space-y-8">
    <form onSubmit={handleSubmit(calculateDistance)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs Column */}
      <div className="space-y-4">
        <Card>
            <CardHeader><CardTitle>Location & Units</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Point 1 (Latitude, Longitude)</Label>
                    <div className="flex gap-2">
                        <Controller name="lat1" control={control} render={({ field }) => <Input placeholder="Lat" type="number" step="any" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
                        <Controller name="lon1" control={control} render={({ field }) => <Input placeholder="Lon" type="number" step="any" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Point 2 (Latitude, Longitude)</Label>
                    <div className="flex gap-2">
                        <Controller name="lat2" control={control} render={({ field }) => <Input placeholder="Lat" type="number" step="any" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
                        <Controller name="lon2" control={control} render={({ field }) => <Input placeholder="Lon" type="number" step="any" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
                    </div>
                </div>
                 <div>
                    <Label>Result Unit</Label>
                    <Controller name="unit" control={control} render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="km">Kilometers</SelectItem>
                                <SelectItem value="miles">Miles</SelectItem>
                                <SelectItem value="nm">Nautical Miles</SelectItem>
                            </SelectContent>
                        </Select>
                    )} />
                </div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle>Elevation (Optional, meters)</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
                 <div><Label>Elevation 1</Label><Controller name="ele1" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
                 <div><Label>Elevation 2</Label><Controller name="ele2" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} /></div>
            </CardContent>
        </Card>
        
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
        <h3 className="text-xl font-semibold">Results</h3>
        {results ? (
            <div className="space-y-4">
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Distance Summary</AlertTitle>
                    <AlertDescription>The great-circle distance is <strong>{results.distanceKm.toFixed(2)} km</strong> ({results.distanceMiles.toFixed(2)} miles). The initial bearing is {results.bearing.toFixed(1)}°.</AlertDescription>
                </Alert>
                <Card>
                    <CardContent className="p-4 grid grid-cols-2 gap-4 text-center">
                        <div>
                            <p className="text-muted-foreground">Great-Circle Distance</p>
                            <p className="font-bold text-xl">{results[formData?.unit === 'km' ? 'distanceKm' : formData?.unit === 'miles' ? 'distanceMiles' : 'distanceNm'].toFixed(2)} {formData?.unit}</p>
                        </div>
                         <div>
                            <p className="text-muted-foreground">Initial Bearing</p>
                            <p className="font-bold text-xl">{results.bearing.toFixed(2)}°</p>
                        </div>
                         <div className="col-span-2">
                            <p className="text-muted-foreground">3D Straight-Line Distance</p>
                            <p className="font-bold text-xl">{results[formData?.unit === 'km' ? 'distance3D_km' : 'distance3D_miles'].toFixed(2)} {formData?.unit}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        ) : (
             <div className="flex items-center justify-center h-full bg-muted/50 rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">Enter coordinates to calculate distance</p>
            </div>
        )}
      </div>
      </form>
      {results && (
        <div className="md:col-span-2 mt-4 space-y-8">
            <Card>
                <CardHeader><CardTitle className="text-base text-center">Distance Comparison</CardTitle></CardHeader>
                <CardContent className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis type="category" dataKey="name" width={80}/>
                            <Tooltip formatter={(value: number) => value.toFixed(2)} />
                            <Bar dataKey="value" fill="hsl(var(--primary))" name="Distance" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Estimated Travel Times</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>Mode</TableHead><TableHead>Avg. Speed</TableHead><TableHead className="text-right">Time</TableHead></TableRow></TableHeader>
                        <TableBody>
                            <TableRow><TableCell>Walking</TableCell><TableCell>5 km/h</TableCell><TableCell className="text-right">{formatTime(results.walking)}</TableCell></TableRow>
                            <TableRow><TableCell>Driving</TableCell><TableCell>80 km/h</TableCell><TableCell className="text-right">{formatTime(results.driving)}</TableCell></TableRow>
                            <TableRow><TableCell>Flying</TableCell><TableCell>800 km/h</TableCell><TableCell className="text-right">{formatTime(results.flying)}</TableCell></TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
      )}
    </div>
  );
}
