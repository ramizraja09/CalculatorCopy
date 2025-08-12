
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { evaluate, format } from 'mathjs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function ScientificCalculator() {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [isAfterEquals, setIsAfterEquals] = useState(false);

  // Load history from localStorage on component mount (client-side only)
  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem('scientificCalculatorHistory');
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (error) {
      console.error("Could not load calculator history:", error);
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    try {
        localStorage.setItem('scientificCalculatorHistory', JSON.stringify(history));
    } catch (error) {
        console.error("Could not save calculator history:", error);
    }
  }, [history]);

  const handleButtonClick = (value: string) => {
    setIsAfterEquals(false);
    
    if (value === '=') {
      handleEquals();
      return;
    }
    if (value === 'AC') {
      clearAll();
      return;
    }
    if(value === 'Back') {
      backspace();
      return;
    }

    if (isAfterEquals) {
      // If it's an operator, use the previous result
      if (['+', '-', '*', '/'].includes(value)) {
        setExpression(display + value);
        setDisplay(display + value);
      } else { // Otherwise, start a new calculation
        setExpression(value);
        setDisplay(value);
      }
    } else {
      setExpression(prev => (prev === '0' && value !== '.') ? value : prev + value);
      setDisplay(prev => (prev === '0' && value !== '.') ? value : prev + value);
    }
  };

  const handleFunction = (func: string) => {
    setExpression(prev => `${func}(${prev})`);
    setDisplay(prev => `${func}(${prev})`);
    setIsAfterEquals(false);
  }

  const handleEquals = () => {
    try {
      if (!expression || /[+\-*/]$/.test(expression)) return;
      
      const mathjsExpr = expression
        .replace(/π/g, 'pi')
        .replace(/√/g, 'sqrt')
        .replace(/n!/g, '!');
          
      const result = evaluate(mathjsExpr);
      const resultString = format(result, { notation: 'fixed', precision: 10 }).replace(/\.?0+$/, "");
      const newHistoryEntry = `${expression} = ${resultString}`;
      
      setHistory(prev => [newHistoryEntry, ...prev].slice(0, 50));
      setDisplay(resultString);
      setExpression(resultString);
      setIsAfterEquals(true);
    } catch (error) {
      setDisplay('Error');
      setExpression('');
    }
  };

  const clearAll = () => {
    setDisplay('0');
    setExpression('');
    setIsAfterEquals(false);
  };

  const backspace = () => {
    if (isAfterEquals) return;
    setExpression(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
    setDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const exportHistory = (format: 'txt' | 'csv') => {
    if (history.length === 0) return;
    
    let content = '';
    const filename = `scientific-calculator-history.${format}`;

    if (format === 'csv') {
      content = 'Expression,Result\n';
      history.forEach(entry => {
        const parts = entry.split(' = ');
        content += `"${parts[0]}",${parts[1]}\n`;
      });
    } else {
      content = history.join('\n');
    }

    const blob = new Blob([content], { type: `text/${format}` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const buttons = [
    'sin', 'cos', 'tan', '%', 'AC',
    'asin', 'acos', 'atan', 'n!', 'Back',
    'xʸ', 'x³', 'x²', '√(', 'Ans',
    'log10', 'ln', ')', '+', '-',
    '7', '8', '9', '(', '*',
    '4', '5', '6', 'π', '/',
    '1', '2', '3', '.', '=',
    '0', 'e', '±'
  ];


  return (
    <div className="grid md:grid-cols-2 gap-8" data-results-container>
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="bg-muted text-right text-3xl font-mono p-4 rounded-md mb-4 break-words h-24 flex flex-col justify-end">
            <span className="text-sm text-muted-foreground truncate block">{expression || ' '}</span>
            <span aria-live="polite">{display}</span>
          </div>
          
          <div className="grid grid-cols-5 gap-2">
              <Button onClick={() => handleFunction('sin')} variant="outline">sin</Button>
              <Button onClick={() => handleFunction('cos')} variant="outline">cos</Button>
              <Button onClick={() => handleFunction('tan')} variant="outline">tan</Button>
              <Button onClick={() => handleButtonClick('%')} variant="outline">%</Button>
              <Button onClick={() => handleButtonClick('AC')} variant="destructive">AC</Button>

              <Button onClick={() => handleFunction('asin')} variant="outline">asin</Button>
              <Button onClick={() => handleFunction('acos')} variant="outline">acos</Button>
              <Button onClick={() => handleFunction('atan')} variant="outline">atan</Button>
              <Button onClick={() => handleButtonClick('!')} variant="outline">n!</Button>
              <Button onClick={() => handleButtonClick('Back')} variant="destructive">Back</Button>

              <Button onClick={() => handleButtonClick('^')} variant="outline">xʸ</Button>
              <Button onClick={() => handleButtonClick('^3')} variant="outline">x³</Button>
              <Button onClick={() => handleButtonClick('^2')} variant="outline">x²</Button>
              <Button onClick={() => handleButtonClick('sqrt(')} variant="outline">√</Button>
              <Button onClick={() => {}} variant="outline" disabled>Ans</Button>
              
              <Button onClick={() => handleFunction('log10')} variant="outline">log</Button>
              <Button onClick={() => handleFunction('log')} variant="outline">ln</Button>
              <Button onClick={() => handleButtonClick(')')} variant="outline">)</Button>
              <Button onClick={() => handleButtonClick('+')} variant="secondary">+</Button>
              <Button onClick={() => handleButtonClick('-')} variant="secondary">-</Button>

              <Button onClick={() => handleButtonClick('7')}>7</Button>
              <Button onClick={() => handleButtonClick('8')}>8</Button>
              <Button onClick={() => handleButtonClick('9')}>9</Button>
              <Button onClick={() => handleButtonClick('(')} variant="outline">(</Button>
              <Button onClick={() => handleButtonClick('*')} variant="secondary">*</Button>
              
              <Button onClick={() => handleButtonClick('4')}>4</Button>
              <Button onClick={() => handleButtonClick('5')}>5</Button>
              <Button onClick={() => handleButtonClick('6')}>6</Button>
              <Button onClick={() => handleButtonClick('pi')} variant="outline">π</Button>
              <Button onClick={() => handleButtonClick('/')} variant="secondary">/</Button>
              
              <Button onClick={() => handleButtonClick('1')}>1</Button>
              <Button onClick={() => handleButtonClick('2')}>2</Button>
              <Button onClick={() => handleButtonClick('3')}>3</Button>
              <Button onClick={() => handleButtonClick('.')} variant="outline">.</Button>
              <Button onClick={() => handleButtonClick('=')} variant="default" className="row-span-2 text-2xl">=</Button>
              
              <Button onClick={() => handleButtonClick('0')} className="col-span-2">0</Button>
              <Button onClick={() => handleButtonClick('e')} variant="outline">e</Button>
              <Button onClick={() => {}} variant="outline" disabled>±</Button>
          </div>
        </CardContent>
      </Card>
      
      <Card className="flex flex-col">
          <CardContent className="p-4 flex-grow flex flex-col">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">History</h3>
                <div className="flex gap-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" disabled={history.length === 0}><Download className="mr-2 h-4 w-4" /> Export</Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => exportHistory('txt')}>Download as .txt</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => exportHistory('csv')}>Download as .csv</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="outline" size="sm" onClick={clearHistory} aria-label="Clear History" disabled={history.length === 0}><Trash2 className="mr-2 h-4 w-4" /> Clear</Button>
                </div>
            </div>
            <ScrollArea className="flex-grow border rounded-md h-96">
                <div className="p-2 text-sm text-right">
                    {history.length > 0 ? (
                        history.map((item, index) => {
                          const parts = item.split(' = ');
                          return (
                            <div key={index} className="font-mono p-2 border-b flex justify-between items-center">
                              <span className="text-left text-muted-foreground truncate pr-4">{parts[0]}</span>
                              <span className="font-bold text-foreground">{parts[1]}</span>
                            </div>
                          )
                        })
                    ) : (
                        <p className="p-4 text-center text-muted-foreground">No history yet.</p>
                    )}
                </div>
            </ScrollArea>
          </CardContent>
        </Card>
    </div>
  );
}
