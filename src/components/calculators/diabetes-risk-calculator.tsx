
"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ShieldAlert } from 'lucide-react';


export default function DiabetesRiskCalculator() {

  return (
    <div className="space-y-4">
        <h3 className="text-xl font-semibold text-center">Coming Soon</h3>
        <Card className="flex items-center justify-center h-60 bg-muted/50 border-dashed">
            <p className="text-sm text-muted-foreground">This calculator is currently under development.</p>
        </Card>
        <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>For Informational Purposes Only</AlertTitle>
            <AlertDescription className="text-xs">
              This tool provides a general risk assessment based on common factors and is not a diagnostic tool. The results should not be considered a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
            </AlertDescription>
        </Alert>
    </div>
  );
}
