
"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info } from 'lucide-react';
import Link from 'next/link';


export default function BmiCalculatorForMen() {

  return (
    <div className="space-y-4">
        <h3 className="text-xl font-semibold text-center">Special Considerations for Men</h3>
        <Card className="flex items-center justify-center h-60 bg-muted/50 border-dashed">
             <p className="text-sm text-muted-foreground text-center p-4">
              The standard BMI calculation is the same for all adults, regardless of gender. For a BMI calculation, please use our main <Link href="/calculators/bmi-calculator" className="text-primary hover:underline">BMI Calculator</Link>.
            </p>
        </Card>
        <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Note on BMI for Men</AlertTitle>
            <AlertDescription className="text-xs">
              While the formula is the same, men often have higher muscle mass than women, which is denser than fat. This can sometimes result in a higher BMI that might not accurately reflect their body fat percentage. For a more complete picture of body composition, consider using our <Link href="/calculators/body-fat-calculator" className="font-semibold hover:underline">Body Fat Calculator</Link> as well.
            </AlertDescription>
        </Alert>
    </div>
  );
}
