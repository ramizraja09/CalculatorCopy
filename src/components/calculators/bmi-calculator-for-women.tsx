
"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info } from 'lucide-react';
import Link from 'next/link';


export default function BmiCalculatorForWomen() {

  return (
    <div className="space-y-4">
        <h3 className="text-xl font-semibold text-center">Special Considerations for Women</h3>
        <Card className="flex items-center justify-center h-60 bg-muted/50 border-dashed">
            <p className="text-sm text-muted-foreground text-center p-4">
              The standard BMI calculation is the same for all adults, regardless of gender. For a BMI calculation, please use our main <Link href="/calculators/bmi-calculator" className="text-primary hover:underline">BMI Calculator</Link>.
            </p>
        </Card>
        <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Note on BMI for Women</AlertTitle>
            <AlertDescription className="text-xs">
              While the formula is the same, factors like pregnancy, menopause, and natural variations in body fat distribution can influence what a "healthy" weight looks like. BMI does not account for body composition. For a more complete picture, consider using our <Link href="/calculators/body-fat-calculator" className="font-semibold hover:underline">Body Fat Calculator</Link> as well.
            </AlertDescription>
        </Alert>
    </div>
  );
}
