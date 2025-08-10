
"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ShieldAlert } from 'lucide-react';


export default function InsulinDosageCalculator() {

  return (
    <div className="space-y-4">
        <Card className="flex items-center justify-center h-60 bg-muted/50 border-dashed border-destructive">
            <p className="text-sm text-destructive font-semibold text-center p-4">
                This feature is not available for safety reasons.
            </p>
        </Card>
        <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>CRITICAL SAFETY WARNING</AlertTitle>
            <AlertDescription className="text-xs">
                Calculating insulin dosage is a complex medical decision that requires the direct supervision and guidance of a qualified healthcare professional. Self-administering an incorrect insulin dose can lead to severe health consequences, including hypoglycemia, hyperglycemia, or even death. 
                <br /><br />
                <strong>DO NOT use an online tool to calculate your insulin dosage. ALWAYS consult your doctor or endocrinologist to determine the correct dosage for your specific needs.</strong>
            </AlertDescription>
        </Alert>
    </div>
  );
}
