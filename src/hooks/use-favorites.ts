"use client";

import { useState, useEffect, useCallback } from 'react';

const FAVORITES_KEY = 'calchub-favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedFavorites = localStorage.getItem(FAVORITES_KEY);
      if (storedFavorites) {
        setFavorites(JSON.parse(storedFavorites));
      }
    } catch (error) {
      console.error('Failed to load favorites from localStorage', error);
    }
    setIsLoaded(true);
  }, []);

  const toggleFavorite = useCallback((slug: string) => {
    setFavorites(prevFavorites => {
      const newFavorites = prevFavorites.includes(slug)
        ? prevFavorites.filter(fav => fav !== slug)
        : [...prevFavorites, slug];
      
      try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
      } catch (error) {
        console.error('Failed to save favorites to localStorage', error);
      }
      return newFavorites;
    });
  }, []);

  return { favorites, toggleFavorite, isLoaded };
}
