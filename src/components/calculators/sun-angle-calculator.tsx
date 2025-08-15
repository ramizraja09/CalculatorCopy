
"use client";

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Download, Calendar as CalendarIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';


// --- Solar Calculation Logic ---
// Based on formulas from NOAA & NREL
const toRad = (deg: number) => deg * Math.PI / 180;
const toDeg = (rad: number) => rad * 180 / Math.PI;

const getDayOfYear = (date: Date) => {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
};

const getSolarPosition = (date: Date, latitude: number, longitude: number) => {
    const dayOfYear = getDayOfYear(date);
    const B = toRad(360/365 * (dayOfYear - 81));
    const eot = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
    const lstm = 15 * date.getTimezoneOffset() / 60;
    const tc = 4 * (longitude - lstm) + eot;
    const localTime = date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
    const lst = localTime + tc / 60;
    const h = toRad(15 * (lst - 12));
    const latRad = toRad(latitude);
    const declination = toRad(23.45 * Math.sin(B));

    const elevationRad = Math.asin(Math.sin(declination) * Math.sin(latRad) + Math.cos(declination) * Math.cos(latRad) * Math.cos(h));
    const azimuthRad = Math.acos((Math.sin(declination) * Math.cos(latRad) - Math.cos(declination) * Math.sin(latRad) * Math.cos(h)) / Math.cos(elevationRad));
    
    let azimuth = toDeg(azimuthRad);
    if (lst > 12) {
      azimuth = 360 - azimuth;
    }

    return { elevation: toDeg(elevationRad), azimuth };
};

const getSunriseSunset = (date: Date, latitude: number, longitude: number) => {
    const dayOfYear = getDayOfYear(date);
    const B = toRad(360/365 * (dayOfYear - 81));
    const eot = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
    const declination = toRad(23.45 * Math.sin(B));
    const latRad = toRad(latitude);

    const hourAngleRad = Math.acos(-Math.tan(latRad) * Math.tan(declination));
    const hourAngleDeg = toDeg(hourAngleRad);

    const sunriseTime = 12 - hourAngleDeg / 15 - (4 * (longitude - (15 * (date.getTimezoneOffset() / 60 * -1))) + eot) / 60;
    const sunsetTime = 12 + hourAngleDeg / 15 - (4 * (longitude - (15 * (date.getTimezoneOffset() / 60 * -1))) + eot) / 60;
    const solarNoon = 12 - (4 * (longitude - (15 * (date.getTimezoneOffset() / 60 * -1))) + eot) / 60;
    const daylightHours = hourAngleDeg / 15 * 2;
    
    const formatToTime = (decimalHours: number) => {
        if (!isFinite(decimalHours)) return "N/A";
        const h = Math.floor(decimalHours);
        const m = Math.round((decimalHours - h) * 60);
        return new Date(1970,0,1,h,m).toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'});
    };

    return {
        sunrise: formatToTime(sunriseTime),
        sunset: formatToTime(sunsetTime),
        solarNoon: formatToTime(solarNoon),
        daylightHours: daylightHours,
    };
};
// --- End of Solar Calculation Logic ---


const formSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  date: z.date(),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format"),
});

type FormData = z.infer<typeof formSchema>;

export default function SunAngleCalculator() {
  const [results, setResults] = useState<any>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      latitude: 40.7128, // New York City
      longitude: -74.0060,
      date: new Date(),
      time: new Date().toTimeString().slice(0,5),
    },
  });

  const calculateSunAngle = (data: FormData) => {
    const { latitude, longitude, date, time } = data;
    const [hours, minutes] = time.split(':').map(Number);
    const calculationDate = new Date(date);
    calculationDate.setHours(hours, minutes);

    const position = getSolarPosition(calculationDate, latitude, longitude);
    const times = getSunriseSunset(calculationDate, latitude, longitude);
    
    const chartData = [];
    for(let h=0; h<24; h++){
      const chartDate = new Date(date);
      chartDate.setHours(h,0,0);
      const pos = getSolarPosition(chartDate, latitude, longitude);
      chartData.push({hour: `${h}:00`, elevation: pos.elevation > 0 ? pos.elevation : 0});
    }

    setResults({ ...position, ...times, chartData });
    setFormData(data);
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (!results || !formData) return;

    let content = '';
    const filename = `sun-angle-calculation.${format}`;
    const { latitude, longitude, date, time } = formData;

    if (format === 'txt') {
      content = `Sun Angle Calculation\n\nInputs:\n- Latitude: ${latitude}\n- Longitude: ${longitude}\n- Date: ${date.toDateString()}\n- Time: ${time}\n\nResult:\n- Elevation: ${results.elevation.toFixed(2)}°\n- Azimuth: ${results.azimuth.toFixed(2)}°\n- Sunrise: ${results.sunrise}\n- Sunset: ${results.sunset}\n- Solar Noon: ${results.solarNoon}\n- Daylight: ${results.daylightHours.toFixed(2)} hours`;
    } else {
      content = `Category,Value\nLatitude,${latitude}\nLongitude,${longitude}\nDate,${date.toDateString()}\nTime,${time}\nElevation (°),${results.elevation.toFixed(2)}\nAzimuth (°),${results.azimuth.toFixed(2)}\nSunrise,${results.sunrise}\nSunset,${results.sunset}\nSolar Noon,${results.solarNoon}\nDaylight (hours),${results.daylightHours.toFixed(2)}`;
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
    <div className="space-y-8">
      <form onSubmit={handleSubmit(calculateSunAngle)}>
          <Card>
            <CardHeader><CardTitle>Location & Time</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><Label htmlFor="latitude">Latitude (-90 to 90)</Label><Controller name="latitude" control={control} render={({ field }) => <Input id="latitude" type="number" step="0.0001" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
                  <div><Label htmlFor="longitude">Longitude (-180 to 180)</Label><Controller name="longitude" control={control} render={({ field }) => <Input id="longitude" type="number" step="0.0001" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />} /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Date</Label><Controller name="date" control={control} render={({ field }) => ( <Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover> )}/></div>
                <div><Label>Time (Local)</Label><Controller name="time" control={control} render={({ field }) => <Input type="time" {...field} />} /></div>
              </div>
               <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">Calculate Sun Position</Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="outline" disabled={!results}><Download className="mr-2 h-4 w-4" /> Export</Button></DropdownMenuTrigger>
                  <DropdownMenuContent><DropdownMenuItem onClick={() => handleExport('txt')}>Download .txt</DropdownMenuItem><DropdownMenuItem onClick={() => handleExport('csv')}>Download .csv</DropdownMenuItem></DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        </form>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Solar Position Data</h3>
          {results ? (
              results.error ? (
                  <Card className="flex items-center justify-center h-60 bg-muted/50 border-dashed"><p className="text-destructive">{results.error}</p></Card>
              ) : (
                <div className="space-y-4">
                  <Card>
                    <CardContent className="p-4 grid grid-cols-2 gap-4 text-center">
                        <div><p className="text-sm text-muted-foreground">Elevation</p><p className="text-2xl font-bold">{results.elevation.toFixed(2)}°</p></div>
                        <div><p className="text-sm text-muted-foreground">Azimuth</p><p className="text-2xl font-bold">{results.azimuth.toFixed(2)}°</p></div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 grid grid-cols-3 gap-4 text-center">
                      <div><p className="text-sm text-muted-foreground">Sunrise</p><p className="font-semibold">{results.sunrise}</p></div>
                      <div><p className="text-sm text-muted-foreground">Solar Noon</p><p className="font-semibold">{results.solarNoon}</p></div>
                      <div><p className="text-sm text-muted-foreground">Sunset</p><p className="font-semibold">{results.sunset}</p></div>
                    </CardContent>
                    <CardContent className="p-4 border-t text-center"><p className="text-sm text-muted-foreground">Daylight Duration</p><p className="font-semibold">{`${Math.floor(results.daylightHours)}h ${Math.round((results.daylightHours % 1) * 60)}m`}</p></CardContent>
                  </Card>
                </div>
              )
          ) : (
              <div className="flex items-center justify-center h-60 bg-muted/50 rounded-lg border-dashed"><p className="text-sm text-muted-foreground">Enter location to see sun data</p></div>
          )}
        </div>
       {results && !results.error && (
        <div className="space-y-4">
           <Card>
              <CardHeader>
                <CardTitle>Sun Elevation Throughout the Day</CardTitle>
              </CardHeader>
              <CardContent className="p-2 pt-6 h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={results.chartData} margin={{ top: 5, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" label={{ value: "Hour of the Day", position: "insideBottom", offset: -10 }} />
                    <YAxis label={{ value: 'Elevation (°)', angle: -90, position: 'insideLeft' }}/>
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="elevation" name="Sun Elevation" stroke="hsl(var(--chart-1))" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
        </div>
      )}
    </div>
  );
}
