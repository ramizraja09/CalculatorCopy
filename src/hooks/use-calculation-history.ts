
"use client";

import { useState, useEffect, useCallback } from 'react';

// Define the shape of a history entry
export type HistoryEntry = {
  id: string;
  timestamp: string;
  inputs: { [key: string]: any };
  result: string;
};

// Define the shape of the entire history object stored in localStorage
type HistoryStore = {
  [calculatorSlug: string]: HistoryEntry[];
};

const HISTORY_KEY = 'calchub-calculation-history';

export function useCalculationHistory(slug: string) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load history from localStorage when the component mounts
  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem(HISTORY_KEY);
      if (storedHistory) {
        const allHistory: HistoryStore = JSON.parse(storedHistory);
        setHistory(allHistory[slug] || []);
      }
    } catch (error) {
      console.error('Failed to load calculation history from localStorage', error);
    }
    setIsLoaded(true);
  }, [slug]);

  // Function to save the entire history store to localStorage
  const saveHistory = (allHistory: HistoryStore) => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(allHistory));
    } catch (error) {
      console.error('Failed to save calculation history to localStorage', error);
    }
  };

  // Function to add a new entry to the history
  const addHistoryEntry = useCallback((inputs: { [key: string]: any }, result: string) => {
    const newEntry: HistoryEntry = {
      id: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      inputs,
      result,
    };

    setHistory(prevHistory => {
      const updatedHistory = [newEntry, ...prevHistory].slice(0, 50); // Keep last 50 entries
      
      const storedHistory = localStorage.getItem(HISTORY_KEY);
      const allHistory: HistoryStore = storedHistory ? JSON.parse(storedHistory) : {};
      allHistory[slug] = updatedHistory;
      saveHistory(allHistory);
      
      return updatedHistory;
    });
  }, [slug]);

  // Function to clear history for the current calculator
  const clearHistory = useCallback(() => {
    setHistory([]);
    const storedHistory = localStorage.getItem(HISTORY_KEY);
    const allHistory: HistoryStore = storedHistory ? JSON.parse(storedHistory) : {};
    delete allHistory[slug];
    saveHistory(allHistory);
  }, [slug]);

  return { history, addHistoryEntry, clearHistory, isLoaded };
}
