'use server';

import { suggestCalculators, type SuggestCalculatorsInput } from '@/ai/flows/suggest-calculators';
import { calculatorNames } from '@/lib/calculators';

export async function getSuggestions(prompt: string) {
  if (!prompt) {
    return { suggestions: [], error: 'Prompt cannot be empty.' };
  }

  try {
    const input: SuggestCalculatorsInput = {
      prompt,
      calculatorNames: calculatorNames,
    };
    const result = await suggestCalculators(input);
    return { suggestions: result.suggestedCalculators, error: null };
  } catch (error) {
    console.error('Error getting suggestions:', error);
    return { suggestions: [], error: 'Failed to get suggestions from AI. Please try again.' };
  }
}
