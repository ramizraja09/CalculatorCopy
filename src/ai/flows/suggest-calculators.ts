// This is a server-side file!
'use server';

/**
 * @fileOverview A calculator suggestion AI agent.
 *
 * - suggestCalculators - A function that suggests relevant calculators based on a user prompt.
 * - SuggestCalculatorsInput - The input type for the suggestCalculators function.
 * - SuggestCalculatorsOutput - The return type for the suggestCalculators function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestCalculatorsInputSchema = z.object({
  prompt: z.string().describe('The prompt describing the calculation needs.'),
  calculatorNames: z.array(z.string()).describe('An array of calculator names to consider.'),
});
export type SuggestCalculatorsInput = z.infer<typeof SuggestCalculatorsInputSchema>;

const SuggestCalculatorsOutputSchema = z.object({
  suggestedCalculators: z.array(z.string()).describe('An array of calculator names that are relevant to the prompt.'),
});
export type SuggestCalculatorsOutput = z.infer<typeof SuggestCalculatorsOutputSchema>;

export async function suggestCalculators(input: SuggestCalculatorsInput): Promise<SuggestCalculatorsOutput> {
  return suggestCalculatorsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestCalculatorsPrompt',
  input: {schema: SuggestCalculatorsInputSchema},
  output: {schema: SuggestCalculatorsOutputSchema},
  prompt: `You are an AI assistant helping users find the most relevant calculators based on their needs.

Given the following prompt: {{{prompt}}}

And the following list of calculator names: {{#each calculatorNames}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

Suggest the calculators that are most relevant to the prompt. Only return the names of the calculators.
`, // Ensure proper Handlebars usage here
});

const suggestCalculatorsFlow = ai.defineFlow(
  {
    name: 'suggestCalculatorsFlow',
    inputSchema: SuggestCalculatorsInputSchema,
    outputSchema: SuggestCalculatorsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
