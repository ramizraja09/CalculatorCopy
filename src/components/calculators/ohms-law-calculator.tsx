
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';

type OhmsValues = {
  voltage: string;
  current: string;
  resistance: string;
  power: string;
};

export default function OhmsLawCalculator() {
  const [values, setValues] = useState<OhmsValues>({
    voltage: '',
    current: '',
    resistance: '',
    power: '',
  });
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof OhmsValues, value: string) => {
    setValues(prev => ({ ...prev, [field]: value }));
    setError(null); // Clear error on new input
  };

  const calculate = () => {
    const { voltage, current, resistance, power } = values;
    const v = parseFloat(voltage);
    const i = parseFloat(current);
    const r = parseFloat(resistance);
    const p = parseFloat(power);

    const definedValues = [
      !isNaN(v) && 'voltage',
      !isNaN(i) && 'current',
      !isNaN(r) && 'resistance',
      !isNaN(p) && 'power',
    ].filter(Boolean) as (keyof OhmsValues)[];

    if (definedValues.length !== 2) {
      setError('Please enter exactly two values to calculate the others.');
      return;
    }
    
    setError(null);
    let newValues: Partial<OhmsValues> = {};

    if (definedValues.includes('voltage') && definedValues.includes('current')) {
      newValues.resistance = (v / i).toString();
      newValues.power = (v * i).toString();
    } else if (definedValues.includes('voltage') && definedValues.includes('resistance')) {
      newValues.current = (v / r).toString();
      newValues.power = (v * v / r).toString();
    } else if (definedValues.includes('voltage') && definedValues.includes('power')) {
      newValues.current = (p / v).toString();
      newValues.resistance = (v * v / p).toString();
    } else if (definedValues.includes('current') && definedValues.includes('resistance')) {
      newValues.voltage = (i * r).toString();
      newValues.power = (i * i * r).toString();
    } else if (definedValues.includes('current') && definedValues.includes('power')) {
      newValues.voltage = (p / i).toString();
      newValues.resistance = (p / (i * i)).toString();
    } else if (definedValues.includes('resistance') && definedValues.includes('power')) {
      newValues.voltage = Math.sqrt(p * r).toString();
      newValues.current = Math.sqrt(p / r).toString();
    }

    setValues(prev => ({ ...prev, ...newValues }));
  };

  const handleClear = () => {
    setValues({ voltage: '', current: '', resistance: '', power: '' });
    setError(null);
  };

  return (
    <div className="grid md:grid-cols-2 gap-8 items-start">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Ohm's Law Calculator</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Enter any two values to calculate the other two.</p>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="voltage">Voltage (V)</Label>
                <Input id="voltage" type="number" step="any" placeholder="Volts" value={values.voltage} onChange={(e) => handleInputChange('voltage', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="current">Current (I)</Label>
                <Input id="current" type="number" step="any" placeholder="Amps" value={values.current} onChange={(e) => handleInputChange('current', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="resistance">Resistance (R)</Label>
                <Input id="resistance" type="number" step="any" placeholder="Ohms (Ω)" value={values.resistance} onChange={(e) => handleInputChange('resistance', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="power">Power (P)</Label>
                <Input id="power" type="number" step="any" placeholder="Watts" value={values.power} onChange={(e) => handleInputChange('power', e.target.value)} />
              </div>
            </div>
            {error && (
              <Alert variant="destructive">
                <Info className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="flex gap-2 pt-4">
              <Button type="button" onClick={calculate} className="flex-1">Calculate</Button>
              <Button type="button" onClick={handleClear} variant="outline" className="flex-1">Clear</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Ohm's Law Circuit</h3>
        <Card className="p-4 flex items-center justify-center bg-muted/50">
           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120" className="w-full h-auto max-w-sm">
            <path d="M20 60h30" stroke="currentColor" strokeWidth="2" fill="none"/>
            <circle cx="20" cy="60" r="3" fill="currentColor"/>
            <path d="M50 50v20" stroke="currentColor" strokeWidth="2" fill="none"/>
            <path d="M50 50h10" stroke="currentColor" strokeWidth="2" fill="none"/>
            <path d="M50 70h10" stroke="currentColor" strokeWidth="2" fill="none"/>
            <text x="35" y="45" className="text-sm font-sans fill-muted-foreground">V</text>
            <path d="M60 60h40" stroke="currentColor" strokeWidth="2" fill="none"/>
            <path d="M100 60l5-10 10 20 10-20 10 20 10-20 5 10" stroke="currentColor" strokeWidth="2" fill="none"/>
            <text x="120" y="45" className="text-sm font-sans fill-muted-foreground">R</text>
            <path d="M150 60h30" stroke="currentColor" strokeWidth="2" fill="none"/>
            <circle cx="180" cy="60" r="3" fill="currentColor"/>
            <path d="M180 60v-40h-160v40" stroke="currentColor" strokeWidth="2" fill="none"/>
            <g transform="translate(100 20)">
                <path d="M0 0l-5 5h10l-5-5" stroke="currentColor" strokeWidth="2" fill="none"/>
            </g>
            <text x="110" y="25" className="text-sm font-sans fill-muted-foreground">I</text>
           </svg>
        </Card>
      </div>
    </div>
  );
}
