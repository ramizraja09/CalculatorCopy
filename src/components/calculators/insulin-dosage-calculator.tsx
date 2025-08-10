
"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ShieldAlert } from 'lucide-react';


export default function InsulinDosageCalculator() {

  return (
    <div className="space-y-4">
        <Card className="flex items-center justify-center h-60 bg-destructive/20 border-2 border-dashed border-destructive">
            <div className="text-center p-4">
              <ShieldAlert className="h-12 w-12 text-destructive mx-auto mb-2" />
              <p className="text-lg text-destructive font-semibold">
                  This feature is intentionally unavailable for your safety.
              </p>
            </div>
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
