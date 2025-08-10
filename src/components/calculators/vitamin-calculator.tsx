
"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ShieldAlert } from 'lucide-react';


export default function VitaminCalculator() {

  return (
    <div className="space-y-4">
        <h3 className="text-xl font-semibold text-center">Informational Tool</h3>
        <Card className="flex items-center justify-center h-60 bg-muted/50 border-dashed">
            <p className="text-sm text-muted-foreground text-center p-4">Individual vitamin and mineral needs are complex. They depend on many factors including your diet, age, gender, lifestyle, and health status. A simple online calculator cannot provide accurate recommendations.</p>
        </Card>
        <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Consult a Professional</AlertTitle>
            <AlertDescription className="text-xs">
              This tool is not a substitute for professional medical or nutritional advice. Please consult with a doctor or registered dietitian to determine your specific vitamin and mineral needs. Self-diagnosing and supplementing can be dangerous.
            </AlertDescription>
        </Alert>
    </div>
  );
}
