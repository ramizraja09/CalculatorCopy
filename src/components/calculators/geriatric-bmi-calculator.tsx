
"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';


export default function GeriatricBmiCalculator() {

  return (
    <div className="space-y-4">
        <h3 className="text-xl font-semibold text-center">Special Considerations for Older Adults</h3>
        <Card className="flex items-center justify-center h-60 bg-muted/50 border-dashed">
            <p className="text-sm text-muted-foreground text-center p-4">
              While the BMI calculation is the same, healthy BMI ranges can differ for older adults due to natural changes in body composition (less muscle, more fat). For general BMI calculation, please use our main <Link href="/calculators/bmi-calculator" className="text-primary hover:underline">BMI Calculator</Link>.
            </p>
        </Card>
        <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Consult a Doctor</AlertTitle>
            <AlertDescription className="text-xs">
              The standard BMI categories may not be appropriate for older adults, and maintaining a slightly higher BMI can sometimes be protective. This tool is not a substitute for professional medical advice. Always consult a physician regarding the health and weight management of an older adult.
            </AlertDescription>
        </Alert>
    </div>
  );
}
