
"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ShieldAlert } from 'lucide-react';


export default function VitaminCalculator() {

  return (
    <div className="space-y-4">
        <h3 className="text-xl font-semibold text-center">Informational Tool</h3>
        <Card className="flex items-center justify-center h-60 bg-muted/50 border-dashed">
            <p className="text-sm text-muted-foreground text-center p-4">This feature is under development. A comprehensive vitamin calculator requires a detailed assessment of diet, age, gender, and lifestyle factors.</p>
        </Card>
        <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Consult a Professional</AlertTitle>
            <AlertDescription className="text-xs">
              Nutrient needs are highly individual. This tool is not a substitute for professional medical or nutritional advice. Please consult with a doctor or registered dietitian to determine your specific vitamin and mineral needs.
            </AlertDescription>
        </Alert>
    </div>
  );
}
