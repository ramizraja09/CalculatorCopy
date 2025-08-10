
"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ShieldAlert } from 'lucide-react';


export default function DiabetesRiskCalculator() {

  return (
    <div className="space-y-4">
        <h3 className="text-xl font-semibold text-center">Informational Tool</h3>
        <Card className="flex items-center justify-center h-60 bg-muted/50 border-dashed">
            <p className="text-sm text-muted-foreground text-center p-4">Assessing diabetes risk involves many factors including family history, age, weight, ethnicity, and lifestyle. A simple online tool cannot accurately determine your risk.</p>
        </Card>
        <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>This Is Not a Diagnostic Tool</AlertTitle>
            <AlertDescription className="text-xs">
              The information provided here is for educational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding your risk for diabetes or any other medical condition.
            </AlertDescription>
        </Alert>
    </div>
  );
}
