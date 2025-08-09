
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

const formSchema = z.object({
  number: z.number().int().min(1, "Number must be a positive integer"),
});

type FormData = z.infer<typeof formSchema>;

const isPrime = (num: number) => {
  if (num <= 1) return false;
  for (let i = 2; i <= Math.sqrt(num); i++) {
    if (num % i === 0) return false;
  }
  return true;
};

const findPrimesUpTo = (limit: number) => {
    const primes = [];
    for(let i=2; i<=limit; i++){
        if(isPrime(i)) primes.push(i);
    }
    return primes;
}

export default function PrimeNumberCalculator() {
  const [results, setResults] = useState<any>(null);
  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { number: 100 },
  });

  const checkPrime = (data: FormData) => {
    const primeStatus = isPrime(data.number);
    const primeList = findPrimesUpTo(data.number);
    setResults({ primeStatus, primeList: primeList.join(', ') });
  };

  return (
    <form onSubmit={handleSubmit(checkPrime)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Input</h3>
        <div>
          <Label htmlFor="number">Enter a number</Label>
          <Controller name="number" control={control} render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />} />
        </div>
        <Button type="submit" className="w-full">Check & List Primes</Button>
      </div>

      {/* Results */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Results</h3>
        {results ? (
            <>
            <Card>
                <CardContent className="p-4 text-center">
                    <p className={results.primeStatus ? 'text-green-500' : 'text-red-500'}>
                        The number is <strong>{results.primeStatus ? 'Prime' : 'Not Prime'}</strong>
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="p-4">
                    <Label>Primes up to your number:</Label>
                    <ScrollArea className="h-32 mt-2 p-2 border rounded-md"><p>{results.primeList}</p></ScrollArea>
                </CardContent>
            </Card>
            </>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg border border-dashed"><p>Enter a number to check if it's prime</p></div>
        )}
      </div>
    </form>
  );
}
