
'use server';
/**
 * @fileOverview An AI agent for analyzing wedding budgets.
 *
 * - analyzeBudget - A function that provides insights and savings tips for a wedding budget.
 * - WeddingBudgetInput - The input type for the analyzeBudget function.
 * - WeddingBudgetOutput - The return type for the analyzeBudget function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const WeddingBudgetInputSchema = z.object({
  totalBudget: z.number().describe('The total budget for the wedding.'),
  expenses: z.array(z.object({
    item: z.string().describe('The name of the expense item (e.g., Venue, Catering).'),
    cost: z.number().describe('The estimated cost of the item.'),
  })).describe('A list of all planned expenses.'),
});
export type WeddingBudgetInput = z.infer<typeof WeddingBudgetInputSchema>;

const WeddingBudgetOutputSchema = z.object({
  analysis: z.string().describe('A brief, friendly analysis of the budget, highlighting the top 2-3 spending categories.'),
  savings_tips: z.array(z.string()).describe('A list of 2-3 actionable, concise tips for potential cost savings based on the provided expenses.'),
});
export type WeddingBudgetOutput = z.infer<typeof WeddingBudgetOutputSchema>;

export async function analyzeBudget(input: WeddingBudgetInput): Promise<WeddingBudgetOutput> {
  return weddingBudgetFlow(input);
}

const prompt = ai.definePrompt({
  name: 'weddingBudgetPrompt',
  input: {schema: WeddingBudgetInputSchema},
  output: {schema: WeddingBudgetOutputSchema},
  prompt: `You are a friendly and practical wedding budget advisor.
Analyze the user's wedding budget. The total budget is {{totalBudget}}.
The planned expenses are:
{{#each expenses}}
- {{item}}: {{cost}}
{{/each}}

Provide a short, encouraging analysis identifying the largest expense categories.
Then, offer 2-3 specific, actionable tips for saving money based on their current plan. Keep the tone light and helpful.`,
});

const weddingBudgetFlow = ai.defineFlow(
  {
    name: 'weddingBudgetFlow',
    inputSchema: WeddingBudgetInputSchema,
    outputSchema: WeddingBudgetOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
