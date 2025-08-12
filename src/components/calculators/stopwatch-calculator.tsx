
"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download } from 'lucide-react';

export default function StopwatchCalculator() {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTime(prevTime => prevTime + 10);
      }, 10);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  const handleStartStop = () => setIsRunning(!isRunning);
  const handleReset = () => {
    setIsRunning(false);
    setTime(0);
    setLaps([]);
  };
  const handleLap = () => {
    setLaps(prevLaps => [...prevLaps, time]);
  };

  const formatTime = (ms: number) => {
    const minutes = String(Math.floor((ms / 60000) % 60)).padStart(2, '0');
    const seconds = String(Math.floor((ms / 1000) % 60)).padStart(2, '0');
    const milliseconds = String(Math.floor((ms % 1000) / 10)).padStart(2, '0');
    return `${minutes}:${seconds}.${milliseconds}`;
  };
  
  const handleExport = (format: 'txt' | 'csv') => {
    if (laps.length === 0) return;
    
    let content = '';
    const filename = `stopwatch-laps.${format}`;

    if (format === 'txt') {
      content = `Stopwatch Laps\n\n`;
      laps.forEach((lap, index) => {
        content += `Lap ${index + 1}: ${formatTime(lap)}\n`;
      });
    } else {
      content = 'Lap,Time\n';
       laps.forEach((lap, index) => {
        content += `${index + 1},${formatTime(lap)}\n`;
      });
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


  return (
    <div className="grid md:grid-cols-2 gap-8">
      {/* Stopwatch display and controls */}
      <div className="flex flex-col items-center justify-center gap-4">
          <p className="text-6xl font-mono tabular-nums">{formatTime(time)}</p>
          <div className="flex gap-2">
              <Button onClick={handleStartStop} className="w-24">
                  {isRunning ? 'Stop' : 'Start'}
              </Button>
              <Button onClick={handleLap} disabled={!isRunning && time === 0}>
                  Lap
              </Button>
              <Button onClick={handleReset} variant="destructive">
                  Reset
              </Button>
          </div>
          <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={laps.length === 0} className="mt-4">
                  <Download className="mr-2 h-4 w-4" /> Export Laps
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleExport('txt')}>Download as .txt</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('csv')}>Download as .csv</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
      </div>

      {/* Laps display */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Laps</h3>
        <Card>
            <CardContent className="p-2">
                <ScrollArea className="h-64">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Lap</TableHead>
                                <TableHead className="text-right">Time</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {laps.length > 0 ? laps.map((lap, index) => (
                                <TableRow key={index}>
                                    <TableCell>{laps.length - index}</TableCell>
                                    <TableCell className="text-right font-mono">{formatTime(lap)}</TableCell>
                                </TableRow>
                            )).reverse()
                            : (
                                <TableRow>
                                    <TableCell colSpan={2} className="text-center text-muted-foreground">No laps yet.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
