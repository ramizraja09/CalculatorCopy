
"use client";

import { Card } from '@/components/ui/card';

export default function RetirementSavingsCalculator() {
  return (
    <div className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Inputs</h3>
        <Card className="p-4">
            <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">Input fields coming soon</p>
            </div>
        </Card>
      </div>
      {/* Results */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Results</h3>
        <Card className="p-4">
            <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed">
            <p className="text-sm text-muted-foreground">Results display coming soon</p>
            </div>
        </Card>
      </div>
    </div>
  );
}
