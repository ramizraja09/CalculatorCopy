
"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info } from 'lucide-react';
import Link from 'next/link';


export default function BmiWeightLossCalculator() {

  return (
    <div className="space-y-4">
        <h3 className="text-xl font-semibold text-center">Combining Tools for Weight Loss</h3>
        <Card className="flex items-center justify-center h-60 bg-muted/50 border-dashed">
            <p className="text-sm text-muted-foreground text-center p-4">To plan for weight loss, you can use our existing calculators together. A dedicated integrated tool is under consideration for a future update.</p>
        </Card>
        <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>How to Use Our Tools for Weight Loss</AlertTitle>
            <AlertDescription className="text-xs">
              1. First, use the <Link href="/calculators/bmi-calculator" className="font-semibold hover:underline">BMI Calculator</Link> to understand your current weight status.<br/>
              2. Next, use the <Link href="/calculators/tdee-calculator" className="font-semibold hover:underline">TDEE Calculator</Link> to estimate your daily maintenance calories.<br/>
              3. Finally, use the <Link href="/calculators/calorie-calculator" className="font-semibold hover:underline">Calorie Calculator</Link> to see how many calories you should consume for different rates of weight loss.
            </AlertDescription>
        </Alert>
    </div>
  );
}
