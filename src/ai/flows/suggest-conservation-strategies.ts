'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting contextually relevant conservation strategies based on groundwater levels.
 *
 * The flow takes groundwater level data as input and returns a list of conservation strategies.
 * - suggestConservationStrategies - A function that handles the suggestion of conservation strategies.
 * - SuggestConservationStrategiesInput - The input type for the suggestConservationStrategies function.
 * - SuggestConservationStrategiesOutput - The return type for the suggestConservationStrategies function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestConservationStrategiesInputSchema = z.object({
  currentGroundwaterLevel: z.number().describe('The current groundwater level in meters.'),
  predictedGroundwaterLevel: z
    .number()
    .describe('The predicted groundwater level in meters for the next month.'),
  location: z.string().describe('The location for which to suggest conservation strategies.'),
  historicalData: z
    .string()
    .describe('Historical groundwater level data for the past year.'),
  landUse: z.string().describe('Predominant land use in the area (e.g., agriculture, urban).'),
});
export type SuggestConservationStrategiesInput = z.infer<
  typeof SuggestConservationStrategiesInputSchema
>;

const SuggestConservationStrategiesOutputSchema = z.object({
  strategies: z
    .array(z.string())
    .describe('A list of contextually relevant conservation strategies.'),
  rationale: z
    .string()
    .describe('Explanation of why those strategies were suggested.'),
});
export type SuggestConservationStrategiesOutput = z.infer<
  typeof SuggestConservationStrategiesOutputSchema
>;

export async function suggestConservationStrategies(
  input: SuggestConservationStrategiesInput
): Promise<SuggestConservationStrategiesOutput> {
  return suggestConservationStrategiesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestConservationStrategiesPrompt',
  input: {schema: SuggestConservationStrategiesInputSchema},
  output: {schema: SuggestConservationStrategiesOutputSchema},
  prompt: `You are an expert in water resource management. Based on the current and predicted groundwater levels, location, historical data, and land use, suggest effective conservation strategies.

Current Groundwater Level: {{currentGroundwaterLevel}} meters
Predicted Groundwater Level: {{predictedGroundwaterLevel}} meters
Location: {{location}}
Historical Data: {{historicalData}}
Land Use: {{landUse}}

Suggest conservation strategies suitable for this context and explain why they are appropriate. Focus on practical and actionable measures.
`, // Changed prompt to focus on actionable measures
});

const suggestConservationStrategiesFlow = ai.defineFlow(
  {
    name: 'suggestConservationStrategiesFlow',
    inputSchema: SuggestConservationStrategiesInputSchema,
    outputSchema: SuggestConservationStrategiesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
