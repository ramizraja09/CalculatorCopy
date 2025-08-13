
"use client";

import { useState, useMemo, useEffect, Suspense } from 'react';
import { Input } from '@/components/ui/input';
import { calculators } from '@/lib/calculators';
import CalculatorCard from '@/components/calculator-card';
import { useFavorites } from '@/hooks/use-favorites';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';


function HomePageContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const { favorites, toggleFavorite, isLoaded } = useFavorites();
  
  const filteredCalculators = useMemo(() => {
    if (!isLoaded) {
      return [];
    }
    return calculators.filter(calculator => {
      const matchesSearch = calculator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            calculator.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            calculator.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (showFavoritesOnly) {
          return matchesSearch && favorites.includes(calculator.slug);
      }

      return matchesSearch;
    });
  }, [searchTerm, showFavoritesOnly, favorites, isLoaded]);


  return (
     <div className="container max-w-screen-2xl mx-auto p-4 md:p-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-6xl font-bold font-headline text-foreground">My Genius Calculator</h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          My Genius Calculator – Free online calculators for math, finance, health, and conversions. Get instant, accurate results with our easy-to-use tools.
        </p>
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
                {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
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
  )
}

const PageSkeleton = () => (
    <div className="container max-w-screen-2xl mx-auto p-4 md:p-8 space-y-8">
        <div className="text-center space-y-4">
            <Skeleton className="h-12 w-1/2 mx-auto" />
            <Skeleton className="h-6 w-3/4 mx-auto" />
        </div>
        
         <div className="space-y-4">
             <div className="sticky top-[55px] md:top-[57px] z-10 bg-muted/80 backdrop-blur-sm -mx-4 px-4 py-4 border-b">
                <div className="flex flex-col md:flex-row gap-4 items-center max-w-screen-2xl mx-auto">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-48" />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-4">
                {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
            </div>
        </div>
    </div>
  );

export default function Home() {
    return (
      <Suspense fallback={<PageSkeleton />}>
        <HomePageContent />
      </Suspense>
    );
}
