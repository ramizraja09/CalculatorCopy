
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function BasicCalculator() {
  const [display, setDisplay] = useState('0');
  const [firstOperand, setFirstOperand] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForSecondOperand, setWaitingForSecondOperand] = useState(false);

  const inputDigit = (digit: string) => {
    if (waitingForSecondOperand) {
      setDisplay(digit);
      setWaitingForSecondOperand(false);
    } else {
      setDisplay(display === '0' ? digit : display + digit);
    }
  };

  const inputDecimal = () => {
    if (waitingForSecondOperand) {
      setDisplay('0.');
      setWaitingForSecondOperand(false);
      return;
    }
    if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const handleOperator = (nextOperator: string) => {
    const inputValue = parseFloat(display);

    if (operator && waitingForSecondOperand) {
      setOperator(nextOperator);
      return;
    }

    if (firstOperand === null) {
      setFirstOperand(inputValue);
    } else if (operator) {
      const result = performCalculation();
      setDisplay(String(result));
      setFirstOperand(result);
    }

    setWaitingForSecondOperand(true);
    setOperator(nextOperator);
  };
  
  const performCalculation = () => {
      if(operator && firstOperand !== null) {
          const secondOperand = parseFloat(display);
          if (operator === '+') return firstOperand + secondOperand;
          if (operator === '-') return firstOperand - secondOperand;
          if (operator === '*') return firstOperand * secondOperand;
          if (operator === '/') return firstOperand / secondOperand;
      }
      return parseFloat(display);
  }

  const handleEquals = () => {
      const result = performCalculation();
      setDisplay(String(result));
      setFirstOperand(null);
      setOperator(null);
      setWaitingForSecondOperand(false);
  }

  const clearAll = () => {
    setDisplay('0');
    setFirstOperand(null);
    setOperator(null);
    setWaitingForSecondOperand(false);
  };

  const buttons = [
    '7', '8', '9', '/',
    '4', '5', '6', '*',
    '1', '2', '3', '-',
    '0', '.', '=', '+'
  ];

  const handleButtonClick = (value: string) => {
    if (/\d/.test(value)) {
      inputDigit(value);
    } else if (value === '.') {
      inputDecimal();
    } else if (value === '=') {
      handleEquals();
    } else {
      handleOperator(value);
    }
  };

  return (
    <Card className="max-w-sm mx-auto">
      <CardContent className="p-4">
        <div className="bg-muted text-right text-3xl font-mono p-4 rounded-md mb-4 overflow-x-auto">
          {display}
        </div>
        <div className="grid grid-cols-4 gap-2">
          <Button variant="destructive" className="col-span-4" onClick={clearAll}>AC</Button>
          {buttons.map(btn => (
            <Button
              key={btn}
              variant="outline"
              className="text-xl h-16"
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
