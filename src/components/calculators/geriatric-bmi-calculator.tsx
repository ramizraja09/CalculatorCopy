
"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ShieldAlert } from 'lucide-react';


export default function GeriatricBmiCalculator() {

  return (
    <div className="space-y-4">
        <h3 className="text-xl font-semibold text-center">Feature Under Development</h3>
        <Card className="flex items-center justify-center h-60 bg-muted/50 border-dashed">
            <p className="text-sm text-muted-foreground text-center p-4">A BMI calculator with adjusted ranges for older adults is being developed. For now, please use the general BMI Calculator and consult a doctor.</p>
        </Card>
        <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Consult a Doctor</AlertTitle>
            <AlertDescription className="text-xs">
              Healthy BMI ranges can differ for older adults due to changes in body composition. The standard ranges may not be appropriate. This tool is not a substitute for professional medical advice. Always consult a physician regarding the health of an older adult.
            </AlertDescription>
        </Alert>
    </div>
  );
}
