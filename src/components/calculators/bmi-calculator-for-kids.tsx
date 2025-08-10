
"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';


export default function BmiCalculatorForKids() {

  return (
    <div className="space-y-4">
        <h3 className="text-xl font-semibold text-center">Special Considerations for Children</h3>
        <Card className="flex items-center justify-center h-60 bg-muted/50 border-dashed">
            <p className="text-sm text-muted-foreground text-center p-4">
              BMI for children and teens is interpreted differently than for adults. Instead of fixed categories, it is evaluated using age- and gender-specific percentile charts. For general BMI calculation, please use our main <Link href="/calculators/bmi-calculator" className="text-primary hover:underline">BMI Calculator</Link>.
            </p>
        </Card>
        <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Always Consult a Pediatrician</AlertTitle>
            <AlertDescription className="text-xs">
              This tool is not a substitute for professional medical advice. A child's growth and development should always be monitored by a pediatrician or other qualified healthcare provider, who can correctly interpret BMI percentile charts and provide appropriate guidance.
            </AlertDescription>
        </Alert>
    </div>
  );
}
