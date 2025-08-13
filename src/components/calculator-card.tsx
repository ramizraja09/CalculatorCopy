
"use client";

import Link from 'next/link';
import { Star } from 'lucide-react';
import type { Calculator } from '@/lib/calculators';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';
import { useEffect, useState } from 'react';

type CalculatorCardProps = {
  calculator: Calculator;
  isFavorite: boolean;
  onToggleFavorite: (slug: string) => void;
  isLink?: boolean;
};

const categoryColors: { [key: string]: string } = {
  'Finance': 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800',
  'Health & Fitness': 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800',
  'Math': 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/50 dark:text-purple-300 dark:border-purple-800',
  'Unit Converters': 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-800',
  'Length and Area': 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-900/50 dark:text-sky-300 dark:border-sky-800',
  'Time & Date': 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/50 dark:text-orange-300 dark:border-orange-800',
  'Everyday Utilities': 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-300 dark:border-indigo-800',
  'Career': 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/50 dark:text-pink-300 dark:border-pink-800',
  'Other': 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-900/50 dark:text-slate-300 dark:border-slate-800',
};


export default function CalculatorCard({ calculator, isFavorite, onToggleFavorite, isLink = false }: CalculatorCardProps) {
  const Icon = calculator.icon;
  const categoryColorClass = categoryColors[calculator.category] || categoryColors['Other'];
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <Skeleton className="h-64 w-full" />;
  }
  
  const CardComponent = (
    <Card className={cn("flex flex-col h-full transition-all bg-card", isLink && "group-hover:shadow-xl group-hover:-translate-y-1")}>
        <CardHeader className="flex-row items-start gap-4 pb-4">
             {Icon && (
                <div className="bg-muted/70 p-3 rounded-lg">
                    <Icon className={cn("h-6 w-6 text-primary", isLink && "transition-transform duration-300 ease-in-out group-hover:scale-110 group-hover:-rotate-12")} />
                </div>
            )}
            <div className="flex-1">
                <CardTitle className="font-headline text-lg">
                    {calculator.name}
                </CardTitle>
                <Badge variant="outline" className={cn(categoryColorClass, 'font-medium mt-1')}>{calculator.category}</Badge>
            </div>
            <Button
                variant="ghost"
                size="icon"
                className="rounded-full h-8 w-8 shrink-0"
                onClick={(e) => {
                    e.preventDefault();
                    onToggleFavorite(calculator.slug);
                }}
                aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
                <Star className={cn('h-5 w-5 transition-all', isFavorite ? 'fill-accent text-accent' : 'text-muted-foreground/50 hover:text-accent hover:fill-accent')} />
            </Button>
        </CardHeader>
        <CardContent className="flex-grow">
            <CardDescription>{calculator.description}</CardDescription>
        </CardContent>
    </Card>
  );

  return CardComponent;
}

