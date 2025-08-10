
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function ScientificCalculator() {
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState('');

  const handleButtonClick = (value: string) => {
    if (value === '=') {
      try {
        // Replace ^ with ** for exponentiation
        const evalExpression = expression.replace(/\^/g, '**').replace(/π/g, 'Math.PI').replace(/e/g, 'Math.E').replace(/√/g, 'Math.sqrt').replace(/ln/g, 'Math.log');
        // Using a function constructor for safer evaluation than direct eval()
        const calculatedResult = new Function('return ' + evalExpression)();
        setResult(String(calculatedResult));
      } catch (error) {
        setResult('Error');
      }
    } else if (value === 'C') {
      setExpression('');
      setResult('');
    } else if (value === 'DEL') {
        setExpression((prev) => prev.slice(0, -1));
    } else if (['sin', 'cos', 'tan', 'log'].includes(value)) {
        setExpression((prev) => prev + `Math.${value}(`);
    } else {
      setExpression((prev) => prev + value);
    }
  };

  const buttons = [
    '(', ')', 'sin', 'cos', 'tan',
    '7', '8', '9', '/', 'C',
    '4', '5', '6', '*', 'DEL',
    '1', '2', '3', '-', '√',
    '0', '.', '=', '+', '^',
    'π', 'e', 'log', 'ln',
  ];

  return (
    <Card className="max-w-md mx-auto">
      <CardContent className="p-4">
        <div className="bg-muted p-2 rounded-md mb-4 text-right space-y-1">
            <Input
                type="text"
                readOnly
                value={expression}
                placeholder="Enter expression"
                className="text-right text-lg bg-transparent border-0"
                aria-label="Calculator expression"
            />
            <div className="text-2xl font-bold font-mono h-8" aria-live="polite">
                {result}
            </div>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {buttons.map((btn) => (
            <Button
              key={btn}
              variant={
                ['=', 'C', 'DEL'].includes(btn) ? 'destructive' :
                ['/', '*', '-', '+', '^'].includes(btn) ? 'secondary' : 'outline'
              }
              className="text-lg h-14"
              onClick={() => handleButtonClick(btn)}
            >
              {btn}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
