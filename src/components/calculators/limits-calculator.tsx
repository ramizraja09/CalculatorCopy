
"use client";

import { Card } from '@/components/ui/card';

export default function LimitsCalculator() {

  return (
    <div className="space-y-4">
        <h3 className="text-xl font-semibold text-center">Coming Soon</h3>
        <Card className="flex items-center justify-center h-60 bg-muted/50 border-dashed">
            <p className="text-sm text-muted-foreground text-center p-4">
              Symbolic computation of limits is a complex feature. While the 'mathjs' library has been added for derivatives, its support for limits is not robust enough for a general-purpose calculator. This feature is still under development.
            </p>
        </Card>
    </div>
  );
}
