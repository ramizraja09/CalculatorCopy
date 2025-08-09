
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { calculators } from '@/lib/calculators';
import CalculatorCard from '@/components/calculator-card';
import SuggestionTool from '@/components/suggestion-tool';
import { useFavorites } from '@/hooks/use-favorites';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const { favorites, toggleFavorite, isLoaded } = useFavorites();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const filteredCalculators = useMemo(() => {
    return calculators.filter(calculator => {
      const matchesSearch = calculator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            calculator.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            calculator.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (isClient && showFavoritesOnly) {
          return matchesSearch && favorites.includes(calculator.slug);
      }

      return matchesSearch;
    });
  }, [searchTerm, showFavoritesOnly, favorites, isClient]);

  const PageSkeleton = () => (
    <div className="container max-w-screen-2xl mx-auto p-4 md:p-8 space-y-8">
        <div className="text-center space-y-4">
            <Skeleton className="h-12 w-1/2 mx-auto" />
            <Skeleton className="h-6 w-3/4 mx-auto" />
        </div>
        <Skeleton className="h-96 w-full max-w-4xl mx-auto" />
         <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-center">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-48" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
            </div>
        </div>
    </div>
  );

  if (!isClient) {
    return <PageSkeleton />;
  }

  return (
    <div className="container max-w-screen-2xl mx-auto p-4 md:p-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-6xl font-bold font-headline text-foreground">top100calculators</h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Your central hub for calculations. Fast, accurate, and easy-to-use tools for everyday needs.
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <SuggestionTool />
      </div>

      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
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

        {filteredCalculators.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCalculators.map(calculator => (
              <CalculatorCard
                key={calculator.slug}
                calculator={calculator}
                isFavorite={favorites.includes(calculator.slug)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-lg text-muted-foreground">No calculators found.</p>
            {searchTerm && <p className="text-sm text-muted-foreground">Try adjusting your search or filters.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
