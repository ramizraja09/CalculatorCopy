
"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';


export default function BmiCalculatorForTeens() {

  return (
    <div className="space-y-4">
        <h3 className="text-xl font-semibold text-center">Special Considerations for Teenagers</h3>
        <Card className="flex items-center justify-center h-60 bg-muted/50 border-dashed">
            <p className="text-sm text-muted-foreground text-center p-4">
               BMI for teenagers is interpreted differently than for adults. It is evaluated using age- and gender-specific percentile charts to account for growth spurts and developmental changes. For general BMI calculation, please use our main <Link href="/calculators/bmi-calculator" className="text-primary hover:underline">BMI Calculator</Link>.
            </p>
        </Card>
        <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Consult a Doctor</AlertTitle>
            <AlertDescription className="text-xs">
              This tool is not a substitute for professional medical advice. A teenager's growth should be monitored by a doctor who can correctly interpret BMI percentiles from organizations like the CDC and provide health guidance.
            </AlertDescription>
        </Alert>
    </div>
  );
}
