
"use client";

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { calculators } from '@/lib/calculators';
import CalculatorCard from '@/components/calculator-card';
import { useFavorites } from '@/hooks/use-favorites';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

const categoryDescriptions: { [key: string]: string } = {
    'All Calculators': "Explore all free calculators at My Genius Calculator – math, finance, health, conversions, and more. Instant, accurate results online.",
    'Career': "Career calculators to plan your future – salary, tax, savings, and skill-based tools. Free, accurate, and easy to use online.",
    'Everyday Utilities': "Everyday utility calculators for daily life – bills, shopping, travel, and more. Fast, accurate results for practical tasks.",
    'Finance': "Free finance calculators – loan EMI, interest, savings, mortgage, and budget tools. Plan your money with accurate results.",
    'Health & Fitness': "Health and fitness calculators – BMI, calorie, body fat, and more. Track and improve your wellness with free online tools.",
    'Length and Area': "Length and area calculators – convert and calculate dimensions easily. Free, accurate tools for work, school, or projects.",
    'Math': "Math calculators for quick, accurate problem solving – percentages, equations, algebra, geometry, and more.",
    'Time & Date': "Time and date calculators – age, duration, countdowns, and time zone conversions. Instant, precise results online.",
    'Unit Converters': "Free online unit converters – length, weight, temperature, volume, and more. Quick, accurate, and easy to use."
};

function CalculatorsPageContent() {
    const searchParams = useSearchParams();
    const initialCategory = searchParams.get('category');
  
    const [searchTerm, setSearchTerm] = useState('');
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    const { favorites, toggleFavorite, isLoaded } = useFavorites();
  
    useEffect(() => {
        if (initialCategory) {
            setSearchTerm(initialCategory);
        } else {
            setSearchTerm('');
        }
    }, [initialCategory]);

    const pageTitle = initialCategory ? `${initialCategory} Calculators` : 'All Calculators';
    const pageDescription = initialCategory ? categoryDescriptions[initialCategory] : categoryDescriptions['All Calculators'];

    const filteredCalculators = useMemo(() => {
        if (!isLoaded) {
            return [];
        }
        let results = calculators;
        
        if (initialCategory) {
            results = results.filter(c => c.category === initialCategory);
        }

        if (searchTerm && searchTerm.toLowerCase() !== (initialCategory || '').toLowerCase()) {
            const lowerCaseSearchTerm = searchTerm.toLowerCase();
            const sourceToFilter = initialCategory ? results : calculators;
            results = sourceToFilter.filter(calculator => 
                calculator.name.toLowerCase().includes(lowerCaseSearchTerm) ||
                calculator.description.toLowerCase().includes(lowerCaseSearchTerm) ||
                calculator.category.toLowerCase().includes(lowerCaseSearchTerm)
            );
        }
            
        if (showFavoritesOnly) {
            return results.filter(calculator => favorites.includes(calculator.slug));
        }

        return results;
    }, [searchTerm, showFavoritesOnly, favorites, isLoaded, initialCategory]);


    return (
        <div className="container max-w-screen-2xl mx-auto p-4 md:p-8 space-y-8">
            <div className="space-y-2">
                <h1 className="text-4xl font-bold font-headline text-foreground">{pageTitle}</h1>
                <p className="text-lg text-muted-foreground">{pageDescription}</p>
            </div>


            <div className="space-y-4">
                 <div className="sticky top-[55px] md:top-[57px] z-10 bg-muted/80 backdrop-blur-sm -mx-4 px-4 py-4 border-b">
                    <div className="flex flex-col md:flex-row gap-4 items-center max-w-screen-2xl mx-auto">
                        <div className="relative w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                                type="search"
                                aria-label="Search for a calculator"
                                placeholder="Search by name, category, or description..."
                                className="pl-10 w-full"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center space-x-2 self-start md:self-center">
                            <Switch
                                id="favorites-only"
                                checked={showFavoritesOnly}
                                onCheckedChange={setShowFavoritesOnly}
                                aria-label="Show favorites only"
                                disabled={!isLoaded}
                            />
                            <Label htmlFor="favorites-only">Show Favorites</Label>
                        </div>
                    </div>
                </div>

                {!isLoaded ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-4">
                        {[...Array(12)].map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
                    </div>
                ) : (
                    filteredCalculators.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-4">
                        {filteredCalculators.map(calculator => (
                          <Link href={`/calculators/${calculator.slug}`} key={calculator.slug} className="group block h-full">
                            <CalculatorCard
                                calculator={calculator}
                                isFavorite={favorites.includes(calculator.slug)}
                                onToggleFavorite={toggleFavorite}
                                isLink={true}
                            />
                          </Link>
                        ))}
                    </div>
                    ) : (
                    <div className="text-center py-16">
                        <p className="text-lg text-muted-foreground">No calculators found.</p>
                        {searchTerm && <p className="text-sm text-muted-foreground">Try adjusting your search or filters.</p>}
                    </div>
                    )
                )}
            </div>
        </div>
    );
}

const PageSkeleton = () => (
    <div className="container max-w-screen-2xl mx-auto p-4 md:p-8 space-y-8">
        <div className="space-y-2">
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-6 w-1/2" />
        </div>
        <div className="sticky top-[55px] md:top-[57px] z-10 bg-muted/80 backdrop-blur-sm -mx-4 px-4 py-4 border-b">
          <div className="flex flex-col md:flex-row gap-4 items-center max-w-screen-2xl mx-auto">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-48" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-4">
            {[...Array(12)].map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
        </div>
    </div>
);


export default function CalculatorsPage() {
    return (
        <Suspense fallback={<PageSkeleton />}>
            <CalculatorsPageContent />
        </Suspense>
    )
}
