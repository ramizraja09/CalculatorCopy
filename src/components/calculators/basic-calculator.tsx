
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mic, Copy, Trash2, History, Download } from 'lucide-react';
import { evaluate } from 'mathjs';

// Type for the Web Speech Recognition API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function BasicCalculator() {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);

  // Load history from localStorage on component mount (client-side only)
  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem('calculatorHistory');
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
        localStorage.setItem('calculatorHistory', JSON.stringify(history));
    } catch (error) {
        console.error("Could not save calculator history:", error);
    }
  }, [history]);


  const handleInput = (value: string) => {
    // If the current display is the result of a previous calculation, start a new expression
    if (expression === display) {
      setExpression(value);
      setDisplay(value);
    } else {
      setExpression(prev => (prev === '0' && value !== '.') ? value : prev + value);
      setDisplay(prev => (prev === '0' && value !== '.') ? value : prev + value);
    }
  };

  const handleOperator = (op: string) => {
    // Avoid adding multiple operators in a row
    if (/[+\-*/]$/.test(expression)) {
      setExpression(prev => prev.slice(0, -1) + op);
    } else {
      setExpression(prev => prev + op);
    }
  };

  const handleEquals = () => {
    try {
      if (!expression || /[+\-*/]$/.test(expression)) return;
      
      const result = evaluate(expression);
      const resultString = String(result);
      const newHistoryEntry = `${expression} = ${resultString}`;
      
      setHistory(prev => [newHistoryEntry, ...prev].slice(0, 50)); // Keep last 50 entries
      setDisplay(resultString);
      setExpression(resultString);
    } catch (error) {
      setDisplay('Error');
      setExpression('');
    }
  };
  
  const clearAll = () => {
    setDisplay('0');
    setExpression('');
  };

  const backspace = () => {
    if (expression === display) return; // Don't backspace a result
    setDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
    setExpression(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
  };
  
  const handleDecimal = () => {
    const currentOperand = expression.split(/([+\-*/])/).pop() || '';
    if (!currentOperand.includes('.')) {
      handleInput('.');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(display);
  };

  const exportHistory = () => {
    const historyText = history.join('\n');
    const blob = new Blob([historyText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'calculator-history.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in your browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsListening(true);
    recognition.start();

    recognition.onresult = (event: any) => {
        const speechResult = event.results[0][0].transcript.toLowerCase();
        const processedResult = speechResult.replace(/plus/g, '+').replace(/minus/g, '-').replace(/times/g, '*').replace(/divided by/g, '/').replace(/\s/g, '');
        setExpression(processedResult);
        setDisplay(processedResult);
    };

    recognition.onspeechend = () => {
        recognition.stop();
        setIsListening(false);
    };
    
    recognition.onerror = () => {
        setIsListening(false);
    };
  };


  return (
    <div className="grid md:grid-cols-2 gap-8">
      {/* Calculator */}
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="bg-muted text-right text-3xl font-mono p-4 rounded-md mb-4 overflow-x-auto break-all">
            {display}
          </div>
          <div className="flex gap-2 mb-2">
            <Button variant="ghost" size="icon" onClick={handleVoiceInput} aria-label="Voice Input">
              <Mic className={isListening ? 'text-destructive animate-pulse' : ''} />
            </Button>
             <Button variant="ghost" size="icon" onClick={copyToClipboard} aria-label="Copy Result">
              <Copy />
            </Button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <Button variant="destructive" className="col-span-2" onClick={clearAll}>AC</Button>
            <Button variant="secondary" onClick={backspace}>⌫</Button>
            <Button variant="secondary" onClick={() => handleOperator('/')}>➗</Button>
            
            <Button onClick={() => handleInput('7')}>7</Button>
            <Button onClick={() => handleInput('8')}>8</Button>
            <Button onClick={() => handleInput('9')}>9</Button>
            <Button variant="secondary" onClick={() => handleOperator('*')}>✖️</Button>

            <Button onClick={() => handleInput('4')}>4</Button>
            <Button onClick={() => handleInput('5')}>5</Button>
            <Button onClick={() => handleInput('6')}>6</Button>
            <Button variant="secondary" onClick={() => handleOperator('-')}>➖</Button>
            
            <Button onClick={() => handleInput('1')}>1</Button>
            <Button onClick={() => handleInput('2')}>2</Button>
            <Button onClick={() => handleInput('3')}>3</Button>
            <Button variant="secondary" onClick={() => handleOperator('+')}>➕</Button>
            
            <Button className="col-span-2" onClick={() => handleInput('0')}>0</Button>
            <Button onClick={handleDecimal}>.</Button>
            <Button variant="default" onClick={handleEquals}>=</Button>
          </div>
        </CardContent>
      </Card>
      {/* History */}
       <div className="space-y-4" data-results-container>
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold flex items-center gap-2"><History/> History</h3>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={exportHistory} aria-label="Export History" disabled={history.length === 0}>
                      <Download className="h-5 w-5"/>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setHistory([])} aria-label="Clear History">
                      <Trash2 className="h-5 w-5"/>
                  </Button>
                </div>
            </div>
            <Card>
                <CardContent className="p-2">
                    <ScrollArea className="h-96">
                        {history.length > 0 ? (
                           <ul className="space-y-2 p-2 text-sm font-mono">
                                {history.map((entry, index) => (
                                    <li key={index} className="text-muted-foreground break-words">{entry}</li>
                                ))}
                           </ul>
                        ) : (
                             <div className="flex items-center justify-center h-full">
                                <p className="text-sm text-muted-foreground">Your calculation history is empty.</p>
                            </div>
                        )}
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
