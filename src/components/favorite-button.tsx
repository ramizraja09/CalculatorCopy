"use client";

import { Star } from "lucide-react";
import { useFavorites } from "@/hooks/use-favorites";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Skeleton } from "./ui/skeleton";

type FavoriteButtonProps = {
  slug: string;
};

export default function FavoriteButton({ slug }: FavoriteButtonProps) {
  const { favorites, toggleFavorite, isLoaded } = useFavorites();

  if (!isLoaded) {
    return <Skeleton className="h-10 w-10 rounded-full" />;
  }

  const isFavorite = favorites.includes(slug);

  return (
    <Button
      variant="ghost"
      size="icon"
      className="rounded-full"
      onClick={() => toggleFavorite(slug)}
      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Star className={cn('h-6 w-6 transition-all', isFavorite ? 'fill-accent text-accent' : 'text-muted-foreground hover:text-accent')} />
    </Button>
  );
}
