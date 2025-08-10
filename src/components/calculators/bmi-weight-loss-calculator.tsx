
"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info } from 'lucide-react';


export default function BmiWeightLossCalculator() {

  return (
    <div className="space-y-4">
        <h3 className="text-xl font-semibold text-center">Feature Under Development</h3>
        <Card className="flex items-center justify-center h-60 bg-muted/50 border-dashed">
            <p className="text-sm text-muted-foreground text-center p-4">A calculator that integrates BMI with weight loss goals and calorie targets is under development. For now, please use the BMI and Calorie calculators separately.</p>
        </Card>
        <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>How to Use Our Tools</AlertTitle>
            <AlertDescription className="text-xs">
              1. Use the **BMI Calculator** to find your current Body Mass Index.<br/>
              2. Use the **Calorie Calculator** or **TDEE Calculator** to estimate your daily calorie needs for weight loss.
            </AlertDescription>
        </Alert>
    </div>
  );
}
