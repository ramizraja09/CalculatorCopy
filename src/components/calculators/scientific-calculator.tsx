
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { evaluate, format } from 'mathjs';

export default function ScientificCalculator() {
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState('0');
  const [angleMode, setAngleMode] = useState<'deg' | 'rad'>('deg');
  const [memory, setMemory] = useState(0);
  const [lastAns, setLastAns] = useState('');

  const handleButtonClick = (value: string) => {
    switch (value) {
      case '=':
        try {
          if (!expression) return;
          const mathjsExpr = expression
            .replace(/π/g, 'pi')
            .replace(/√/g, 'sqrt')
            .replace(/n!/g, '!')
            .replace(/%/g, '/100');
          
          const evalResult = evaluate(mathjsExpr);
          const formattedResult = format(evalResult, { precision: 10 });
          setResult(formattedResult);
          setLastAns(formattedResult);
          setExpression(formattedResult);
        } catch (error) {
          setResult('Error');
        }
        break;
      case 'AC':
        setExpression('');
        setResult('0');
        break;
      case 'Back':
        setExpression((prev) => prev.slice(0, -1));
        break;
      case 'Ans':
         setExpression((prev) => prev + lastAns);
        break;
      case 'MR':
        setExpression((prev) => prev + memory.toString());
        break;
      case 'M+':
        try {
            const currentResult = evaluate(expression || '0');
            setMemory((prev) => prev + currentResult);
        } catch {
            setResult('Error');
        }
        break;
      case 'M-':
         try {
            const currentResult = evaluate(expression || '0');
            setMemory((prev) => prev - currentResult);
        } catch {
            setResult('Error');
        }
        break;
      case '±':
        setExpression((prev) => {
            if (prev.startsWith('-')) {
                return prev.substring(1);
            } else {
                return '-' + prev;
            }
        });
        break;
      case 'x²':
        setExpression((prev) => `(${prev})^2`);
        break;
      case 'x³':
        setExpression((prev) => `(${prev})^3`);
        break;
      case 'xʸ':
        setExpression((prev) => `(${prev})^`);
        break;
      case '1/x':
        setExpression((prev) => `1/(${prev})`);
        break;
      case 'n!':
        setExpression((prev) => `${prev}!`);
        break;
      default:
        if (result === 'Error' || (result === '0' && value !== '.')) {
            setExpression(value);
            setResult('');
        } else if (result && expression === result) {
            setExpression(value);
            setResult('');
        }
        else {
            setExpression((prev) => prev + value);
        }
        break;
    }
  };

  const buttons = [
    ['sin(', 'cos(', 'tan(', '%', 'AC'],
    ['asin(', 'acos(', 'atan(', 'n!', 'Back'],
    ['xʸ', 'x³', 'x²', '1/x', 'Ans'],
    ['√(', '(', ')', '+', '-'],
    ['7', '8', '9', '*', 'M+'],
    ['4', '5', '6', '/', 'M-'],
    ['1', '2', '3', 'π', 'MR'],
    ['0', '.', '±', '=', 'e'],
  ];

  return (
    <Card className="max-w-md mx-auto">
      <CardContent className="p-4">
        <div className="bg-muted p-2 rounded-md mb-4 text-right space-y-1">
          <div className="h-6 text-sm text-muted-foreground truncate">{expression || ' '}</div>
          <div className="h-8 text-2xl font-bold font-mono" aria-live="polite">
            {result}
          </div>
        </div>
        
        <div className="grid grid-cols-5 gap-2">
            <div className="col-span-5 flex justify-end">
                <RadioGroup value={angleMode} onValueChange={(val) => setAngleMode(val as 'deg' | 'rad')} className="flex gap-4">
                    <Label className="flex items-center gap-2 text-xs"><RadioGroupItem value="deg" /> Deg</Label>
                    <Label className="flex items-center gap-2 text-xs"><RadioGroupItem value="rad" /> Rad</Label>
                </RadioGroup>
            </div>
          {buttons.flat().map((btn) => (
            <Button
              key={btn}
              variant={
                ['=', 'AC', 'Back'].includes(btn) ? 'destructive' :
                ['/', '*', '-', '+'].includes(btn) ? 'secondary' : 'outline'
              }
              className="text-md h-12"
              onClick={() => handleButtonClick(btn)}
            >
              {btn.replace('asin(', 'sin⁻¹').replace('acos(', 'cos⁻¹').replace('atan(','tan⁻¹').replace('xʸ','xʸ')}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
