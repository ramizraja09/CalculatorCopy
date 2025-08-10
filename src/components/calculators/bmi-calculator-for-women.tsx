
"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info } from 'lucide-react';


export default function BmiCalculatorForWomen() {

  return (
    <div className="space-y-4">
        <h3 className="text-xl font-semibold text-center">Feature Under Development</h3>
        <Card className="flex items-center justify-center h-60 bg-muted/50 border-dashed">
            <p className="text-sm text-muted-foreground text-center p-4">A BMI calculator with specific considerations for women is being developed. For now, please use the general BMI Calculator.</p>
        </Card>
        <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Note on BMI</AlertTitle>
            <AlertDescription className="text-xs">
              The standard BMI calculation is the same for all adults. However, interpretation can vary. Body composition, such as fat distribution, differs and is not accounted for in BMI. For a more complete picture, consider using the Body Fat Calculator as well.
            </AlertDescription>
        </Alert>
    </div>
  );
}
