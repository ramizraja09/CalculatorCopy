
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Image from 'next/image';

const unitFactors: { [key: string]: number } = {
  feet: 1,
  inches: 1 / 12,
  meters: 3.28084,
  centimeters: 0.0328084,
};

const convertToFeet = (value: number, unit: string) => value * (unitFactors[unit] || 1);

const formatNumber = (num: number) => num.toLocaleString(undefined, { maximumFractionDigits: 2 });

// --- Schemas ---
const slabSchema = z.object({
  length: z.number().min(0), lengthUnit: z.string(),
  width: z.number().min(0), widthUnit: z.string(),
  thickness: z.number().min(0), thicknessUnit: z.string(),
  quantity: z.number().int().min(1),
});
const columnSchema = z.object({
  diameter: z.number().min(0), diameterUnit: z.string(),
  depth: z.number().min(0), depthUnit: z.string(),
  quantity: z.number().int().min(1),
});
const circularSlabSchema = z.object({
    outerDiameter: z.number().min(0), outerDiameterUnit: z.string(),
    innerDiameter: z.number().min(0), innerDiameterUnit: z.string(),
    height: z.number().min(0), heightUnit: z.string(),
    quantity: z.number().int().min(1),
}).refine(data => convertToFeet(data.outerDiameter, data.outerDiameterUnit) > convertToFeet(data.innerDiameter, data.innerDiameterUnit), {
    message: "Outer diameter must be greater than inner diameter.",
    path: ["outerDiameter"],
});
const curbSchema = z.object({
  curbDepth: z.number().min(0), curbDepthUnit: z.string(),
  gutterWidth: z.number().min(0), gutterWidthUnit: z.string(),
  curbHeight: z.number().min(0), curbHeightUnit: z.string(),
  flagThickness: z.number().min(0), flagThicknessUnit: z.string(),
  length: z.number().min(0), lengthUnit: z.string(),
  quantity: z.number().int().min(1),
});
const stairsSchema = z.object({
    run: z.number().min(0), runUnit: z.string(),
    rise: z.number().min(0), riseUnit: z.string(),
    width: z.number().min(0), widthUnit: z.string(),
    platformDepth: z.number().min(0), platformDepthUnit: z.string(),
    numSteps: z.number().int().min(1),
});


type CalculatorTabProps = {
    title: string;
    image: React.ReactNode;
    schema: any;
    defaultValues: any;
    calculateFn: (data: any) => number;
    children: (props: { control: any, errors: any }) => React.ReactNode;
};

function CalculatorTab({ title, image, schema, defaultValues, calculateFn, children }: CalculatorTabProps) {
  const [results, setResults] = useState<{ volumeYards: number; volumeMeters: number } | null>(null);
  const { control, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const onSubmit = (data: any) => {
    const volumeFeet = calculateFn(data);
    setResults({
      volumeYards: volumeFeet / 27,
      volumeMeters: volumeFeet * 0.0283168,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid md:grid-cols-2 gap-8 items-start">
            <div className="space-y-4">
                <Card>
                    <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        {children({ control, errors })}
                    </CardContent>
                </Card>
                 <div className="flex gap-2">
                    <Button type="submit" className="w-full">Calculate</Button>
                    <Button type="button" variant="outline" onClick={() => { reset(); setResults(null); }}>Clear</Button>
                 </div>
            </div>
            <div className="space-y-4">
                 <div className="flex justify-center p-4 border rounded-lg bg-muted">
                    {image}
                </div>
                {results ? (
                    <Card>
                        <CardHeader><CardTitle className="text-center">Concrete Needed</CardTitle></CardHeader>
                        <CardContent className="space-y-4 text-center">
                            <div>
                                <p className="text-3xl font-bold">{formatNumber(results.volumeYards)}</p>
                                <p className="text-muted-foreground">Cubic Yards</p>
                            </div>
                            <div className="border-t pt-4">
                                <p className="text-2xl font-bold">{formatNumber(results.volumeMeters)}</p>
                                <p className="text-muted-foreground">Cubic Meters</p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter dimensions to calculate</p></div>
                )}
            </div>
        </div>
    </form>
  )
}

function UnitSelect({ control, name }: { control: any, name: string }) {
    return (
        <Controller
            name={name}
            control={control}
            render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="feet">feet</SelectItem>
                        <SelectItem value="inches">inches</SelectItem>
                        <SelectItem value="meters">meters</SelectItem>
                        <SelectItem value="centimeters">centimeters</SelectItem>
                    </SelectContent>
                </Select>
            )}
        />
    );
}

export default function ConcreteCalculator() {
  return (
    <Tabs defaultValue="slab" className="w-full">
      <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
        <TabsTrigger value="slab">Slabs/Walls</TabsTrigger>
        <TabsTrigger value="column">Columns</TabsTrigger>
        <TabsTrigger value="circular">Circular Slabs</TabsTrigger>
        <TabsTrigger value="curb">Curbs</TabsTrigger>
        <TabsTrigger value="stairs">Stairs</TabsTrigger>
      </TabsList>
      <TabsContent value="slab" className="mt-6">
        <CalculatorTab
          title="Slabs, Square Footings, or Walls"
          image={<svg width="200" height="150" viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <path d="M40 95L100 125L160 95L100 65L40 95Z" fill="hsl(var(--muted))" stroke="hsl(var(--foreground))" strokeWidth="2"/>
            <path d="M40 55V95L100 125V85L40 55Z" fill="hsl(var(--muted))" stroke="hsl(var(--foreground))" strokeWidth="2"/>
            <path d="M100 85L160 55V95L100 125V85Z" fill="hsl(var(--muted))" stroke="hsl(var(--foreground))" strokeWidth="2"/>
            <path d="M40 55L100 25L160 55L100 85L40 55Z" fill="hsl(var(--card))" stroke="hsl(var(--foreground))" strokeWidth="2"/>
            <text x="65" y="40" className="text-xs font-sans fill-muted-foreground">Width</text>
            <text x="125" y="40" className="text-xs font-sans fill-muted-foreground">Length</text>
            <text x="15" y="80" className="text-xs font-sans fill-muted-foreground" transform="rotate(-30 15 80)">Thickness</text>
          </svg>}
          schema={slabSchema}
          defaultValues={{ length: 10, lengthUnit: 'feet', width: 10, widthUnit: 'feet', thickness: 6, thicknessUnit: 'inches', quantity: 1 }}
          calculateFn={(data) => {
            const lengthFt = convertToFeet(data.length, data.lengthUnit);
            const widthFt = convertToFeet(data.width, data.widthUnit);
            const thicknessFt = convertToFeet(data.thickness, data.thicknessUnit);
            return lengthFt * widthFt * thicknessFt * data.quantity;
          }}
        >
          {({ control }) => (<>
            <div className="grid grid-cols-[1fr,120px] gap-2 items-end"><Label>Length</Label><UnitSelect control={control} name="lengthUnit" /></div>
            <Controller name="length" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
            <div className="grid grid-cols-[1fr,120px] gap-2 items-end"><Label>Width</Label><UnitSelect control={control} name="widthUnit" /></div>
            <Controller name="width" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
            <div className="grid grid-cols-[1fr,120px] gap-2 items-end"><Label>Thickness/Height</Label><UnitSelect control={control} name="thicknessUnit" /></div>
            <Controller name="thickness" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
            <Label>Quantity</Label>
            <Controller name="quantity" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 1)} />} />
          </>)}
        </CalculatorTab>
      </TabsContent>
       <TabsContent value="column" className="mt-6">
        <CalculatorTab
          title="Hole, Column, or Round Footings"
          image={<svg width="200" height="150" viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
              <ellipse cx="100" cy="40" rx="50" ry="15" fill="hsl(var(--card))" stroke="hsl(var(--foreground))" strokeWidth="2" />
              <path d="M50 40 V 110" stroke="hsl(var(--foreground))" strokeWidth="2" />
              <path d="M150 40 V 110" stroke="hsl(var(--foreground))" strokeWidth="2" />
              <ellipse cx="100" cy="110" rx="50" ry="15" stroke="hsl(var(--foreground))" strokeWidth="2" fill="hsl(var(--muted))" />
              <path d="M50 110 A 50 15 0 0 0 150 110" stroke="hsl(var(--foreground))" strokeWidth="2" fill="none" />
              <path d="M50 110 A 50 15 0 0 1 150 110" stroke="hsl(var(--foreground))" strokeWidth="2" strokeDasharray="3 3" fill="none" />
              <text x="10" y="80" className="text-xs font-sans fill-muted-foreground">Depth</text>
              <text x="90" y="30" className="text-xs font-sans fill-muted-foreground">Diameter</text>
          </svg>}
          schema={columnSchema}
          defaultValues={{ diameter: 2, diameterUnit: 'feet', depth: 4, depthUnit: 'feet', quantity: 1 }}
          calculateFn={(data) => {
            const r = convertToFeet(data.diameter, data.diameterUnit) / 2;
            const h = convertToFeet(data.depth, data.depthUnit);
            return Math.PI * r * r * h * data.quantity;
          }}
        >
          {({ control }) => (<>
            <div className="grid grid-cols-[1fr,120px] gap-2 items-end"><Label>Diameter</Label><UnitSelect control={control} name="diameterUnit" /></div>
            <Controller name="diameter" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
            <div className="grid grid-cols-[1fr,120px] gap-2 items-end"><Label>Depth/Height</Label><UnitSelect control={control} name="depthUnit" /></div>
            <Controller name="depth" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
            <Label>Quantity</Label>
            <Controller name="quantity" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 1)} />} />
          </>)}
        </CalculatorTab>
      </TabsContent>
       <TabsContent value="circular" className="mt-6">
        <CalculatorTab
          title="Circular Slab or Tube"
          image={<svg width="200" height="150" viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
              <ellipse cx="100" cy="50" rx="70" ry="20" fill="hsl(var(--card))" stroke="hsl(var(--foreground))" strokeWidth="2"/>
              <ellipse cx="100" cy="50" rx="35" ry="10" fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth="2"/>
              <path d="M30 50 V 100" stroke="hsl(var(--foreground))" strokeWidth="2"/>
              <path d="M170 50 V 100" stroke="hsl(var(--foreground))" strokeWidth="2"/>
              <ellipse cx="100" cy="100" rx="70" ry="20" stroke="hsl(var(--foreground))" strokeWidth="2" fill="hsl(var(--muted))"/>
              <path d="M30 100 A 70 20 0 0 0 170 100" stroke="hsl(var(--foreground))" strokeWidth="2" fill="none"/>
              <path d="M30 100 A 70 20 0 0 1 170 100" stroke="hsl(var(--foreground))" strokeWidth="2" fill="none" stroke-dasharray="3 3"/>
              <ellipse cx="100" cy="100" rx="35" ry="10" fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth="2"/>
              <text x="5" y="80" className="text-xs font-sans fill-muted-foreground">Height</text>
              <text x="135" y="45" className="text-xs font-sans fill-muted-foreground">d₁</text>
              <text x="110" y="55" className="text-xs font-sans fill-muted-foreground">d₂</text>
          </svg>}
          schema={circularSlabSchema}
          defaultValues={{ outerDiameter: 4, outerDiameterUnit: 'feet', innerDiameter: 2, innerDiameterUnit: 'feet', height: 6, heightUnit: 'inches', quantity: 1 }}
          calculateFn={(data) => {
             const r_outer = convertToFeet(data.outerDiameter, data.outerDiameterUnit) / 2;
             const r_inner = convertToFeet(data.innerDiameter, data.innerDiameterUnit) / 2;
             const h = convertToFeet(data.height, data.heightUnit);
             return (Math.PI * r_outer * r_outer * h - Math.PI * r_inner * r_inner * h) * data.quantity;
          }}
        >
          {({ control, errors }) => (<>
            <div className="grid grid-cols-[1fr,120px] gap-2 items-end"><Label>Outer Diameter (d₁)</Label><UnitSelect control={control} name="outerDiameterUnit" /></div>
            <Controller name="outerDiameter" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
            <div className="grid grid-cols-[1fr,120px] gap-2 items-end"><Label>Inner Diameter (d₂)</Label><UnitSelect control={control} name="innerDiameterUnit" /></div>
            <Controller name="innerDiameter" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
            <div className="grid grid-cols-[1fr,120px] gap-2 items-end"><Label>Length/Height (h)</Label><UnitSelect control={control} name="heightUnit" /></div>
            <Controller name="height" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
             {errors.outerDiameter && <p className="text-destructive text-sm col-span-2 text-right -mt-4">{errors.outerDiameter.message as string}</p>}
            <Label>Quantity</Label>
            <Controller name="quantity" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 1)} />} />
          </>)}
        </CalculatorTab>
      </TabsContent>
      <TabsContent value="curb" className="mt-6">
        <CalculatorTab
          title="Curb and Gutter Barrier"
          image={<svg width="200" height="150" viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <path d="M50 120 L150 120 L150 110 L80 110 L80 60 L50 60 L50 120Z" stroke="hsl(var(--foreground))" fill="hsl(var(--muted))" stroke-width="2"/>
            <text x="85" y="130" className="text-xs font-sans fill-muted-foreground">Gutter Width</text>
            <text x="20" y="95" className="text-xs font-sans fill-muted-foreground">Curb Height</text>
            <text x="85" y="85" className="text-xs font-sans fill-muted-foreground" transform="rotate(90 85 85)">Curb Depth</text>
            <text x="110" y="105" className="text-xs font-sans fill-muted-foreground">Flag Thickness</text>
          </svg>}
          schema={curbSchema}
          defaultValues={{ curbDepth: 4, curbDepthUnit: 'inches', gutterWidth: 10, gutterWidthUnit: 'inches', curbHeight: 4, curbHeightUnit: 'inches', flagThickness: 5, flagThicknessUnit: 'inches', length: 10, lengthUnit: 'feet', quantity: 1 }}
          calculateFn={(data) => {
             const curbDepth = convertToFeet(data.curbDepth, data.curbDepthUnit);
             const gutterWidth = convertToFeet(data.gutterWidth, data.gutterWidthUnit);
             const curbHeight = convertToFeet(data.curbHeight, data.curbHeightUnit);
             const flagThickness = convertToFeet(data.flagThickness, data.flagThicknessUnit);
             const length = convertToFeet(data.length, data.lengthUnit);
             const volume = (curbDepth * curbHeight + gutterWidth * flagThickness) * length * data.quantity;
             return volume;
          }}
        >
          {({ control }) => (<>
            <div className="grid grid-cols-[1fr,120px] gap-2 items-end"><Label>Curb Depth</Label><UnitSelect control={control} name="curbDepthUnit" /></div>
            <Controller name="curbDepth" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
            <div className="grid grid-cols-[1fr,120px] gap-2 items-end"><Label>Gutter Width</Label><UnitSelect control={control} name="gutterWidthUnit" /></div>
            <Controller name="gutterWidth" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
            <div className="grid grid-cols-[1fr,120px] gap-2 items-end"><Label>Curb Height</Label><UnitSelect control={control} name="curbHeightUnit" /></div>
            <Controller name="curbHeight" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
            <div className="grid grid-cols-[1fr,120px] gap-2 items-end"><Label>Flag Thickness</Label><UnitSelect control={control} name="flagThicknessUnit" /></div>
            <Controller name="flagThickness" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
            <div className="grid grid-cols-[1fr,120px] gap-2 items-end"><Label>Length</Label><UnitSelect control={control} name="lengthUnit" /></div>
            <Controller name="length" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
             <Label>Quantity</Label>
            <Controller name="quantity" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 1)} />} />
          </>)}
        </CalculatorTab>
      </TabsContent>
      <TabsContent value="stairs" className="mt-6">
        <CalculatorTab
          title="Stairs"
          image={<svg width="200" height="150" viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <path d="M40 120 L40 100 L70 100 L70 80 L100 80 L100 60 L130 60 L130 40 L160 40 L160 120 L40 120Z" stroke="hsl(var(--foreground))" fill="hsl(var(--muted))" stroke-width="2"/>
            <text x="135" y="85" className="text-xs font-sans fill-muted-foreground">Run</text>
            <text x="165" y="60" className="text-xs font-sans fill-muted-foreground" transform="rotate(90 165 60)">Rise</text>
            <text x="10" y="80" className="text-xs font-sans fill-muted-foreground">Width (not shown)</text>
          </svg>}
          schema={stairsSchema}
          defaultValues={{ run: 12, runUnit: 'inches', rise: 6, riseUnit: 'inches', width: 50, widthUnit: 'inches', platformDepth: 5, platformDepthUnit: 'centimeters', numSteps: 5 }}
          calculateFn={(data) => {
            const run = convertToFeet(data.run, data.runUnit);
            const rise = convertToFeet(data.rise, data.riseUnit);
            const width = convertToFeet(data.width, data.widthUnit);
            const platformDepth = convertToFeet(data.platformDepth, data.platformDepthUnit);
            const triangleVolume = 0.5 * run * rise * width;
            const totalTriangleVolume = data.numSteps * triangleVolume;
            const platformVolume = platformDepth > 0 ? (run * data.numSteps * platformDepth * width) : 0;
            return totalTriangleVolume + platformVolume;
          }}
        >
          {({ control }) => (<>
            <div className="grid grid-cols-[1fr,120px] gap-2 items-end"><Label>Run</Label><UnitSelect control={control} name="runUnit" /></div>
            <Controller name="run" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
            <div className="grid grid-cols-[1fr,120px] gap-2 items-end"><Label>Rise</Label><UnitSelect control={control} name="riseUnit" /></div>
            <Controller name="rise" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
            <div className="grid grid-cols-[1fr,120px] gap-2 items-end"><Label>Width</Label><UnitSelect control={control} name="widthUnit" /></div>
            <Controller name="width" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
            <div className="grid grid-cols-[1fr,120px] gap-2 items-end"><Label>Platform Depth</Label><UnitSelect control={control} name="platformDepthUnit" /></div>
            <Controller name="platformDepth" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
            <Label>Number of Steps</Label>
            <Controller name="numSteps" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 1)} />} />
          </>)}
        </CalculatorTab>
      </TabsContent>
    </Tabs>
  );
}
