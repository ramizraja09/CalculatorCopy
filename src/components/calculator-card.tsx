"use client";

import Link from 'next/link';
import { Star } from 'lucide-react';
import type { Calculator } from '@/lib/calculators';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';

type CalculatorCardProps = {
  calculator: Calculator;
  isFavorite: boolean;
  onToggleFavorite: (slug: string) => void;
};

export default function CalculatorCard({ calculator, isFavorite, onToggleFavorite }: CalculatorCardProps) {
  const Icon = calculator.icon;
  
  return (
    <Card className="flex flex-col h-full transition-all hover:shadow-xl hover:-translate-y-1 bg-card">
        <CardHeader className="flex-row items-start gap-4 space-y-0 pb-2">
            <div className="flex-1">
                <CardTitle className="font-headline text-lg mb-2">
                    <Link href={`/calculators/${calculator.slug}`} className="hover:text-primary transition-colors">
                        {calculator.name}
                    </Link>
                </CardTitle>
                 <Badge variant="outline">{calculator.category}</Badge>
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
                <Star className={cn('h-5 w-5 transition-all', isFavorite ? 'fill-accent text-accent' : 'text-muted-foreground hover:text-accent')} />
            </Button>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col">
            <p className="text-sm text-muted-foreground flex-grow">{calculator.description}</p>
            <Link href={`/calculators/${calculator.slug}`} className="w-full mt-4">
                <Button className="w-full" variant="secondary">
                    {Icon && <Icon className="mr-2 h-4 w-4" />} Open
                </Button>
            </Link>
        </CardContent>
    </Card>
  );
}
