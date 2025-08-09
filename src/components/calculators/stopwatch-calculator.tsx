
"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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
                            {laps.map((lap, index) => (
                                <TableRow key={index}>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell className="text-right font-mono">{formatTime(lap)}</TableCell>
                                </TableRow>
                            )).reverse()}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
