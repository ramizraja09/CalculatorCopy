
"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ShieldAlert } from 'lucide-react';


export default function BmiCalculatorForKids() {

  return (
    <div className="space-y-4">
        <h3 className="text-xl font-semibold text-center">Coming Soon</h3>
        <Card className="flex items-center justify-center h-60 bg-muted/50 border-dashed">
            <p className="text-sm text-muted-foreground text-center p-4">A specialized BMI calculator for children, which includes age and gender-specific percentile charts, is under development.</p>
        </Card>
        <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Consult a Pediatrician</AlertTitle>
            <AlertDescription className="text-xs">
              BMI in children is interpreted differently than in adults and requires comparison to percentile charts. This tool is not a substitute for professional medical advice. Always consult a pediatrician regarding your child's growth and health.
            </AlertDescription>
        </Alert>
    </div>
  );
}
