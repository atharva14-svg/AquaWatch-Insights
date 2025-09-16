// This file contains the Genkit flow for predicting future groundwater levels.

'use server';

/**
 * @fileOverview Predicts future groundwater levels based on historical data.
 *
 * - predictGroundwaterLevels - A function that handles the prediction process.
 * - PredictGroundwaterLevelsInput - The input type for the predictGroundwaterLevels function.
 * - PredictGroundwaterLevelsOutput - The return type for the predictGroundwaterLevels function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PredictGroundwaterLevelsInputSchema = z.object({
  stationId: z.string().describe('The ID of the groundwater monitoring station.'),
  historicalData: z.string().describe('Historical groundwater level data for the station in JSON format. Date must be in ISO format YYYY-MM-DD.'),
  predictionDays: z.number().describe('The number of days into the future to predict.'),
});
export type PredictGroundwaterLevelsInput = z.infer<typeof PredictGroundwaterLevelsInputSchema>;

const PredictGroundwaterLevelsOutputSchema = z.object({
  predictedLevels: z.string().describe('Predicted groundwater levels for the next N days, in JSON format. Date will be in ISO format YYYY-MM-DD.'),
});
export type PredictGroundwaterLevelsOutput = z.infer<typeof PredictGroundwaterLevelsOutputSchema>;

export async function predictGroundwaterLevels(input: PredictGroundwaterLevelsInput): Promise<PredictGroundwaterLevelsOutput> {
  return predictGroundwaterLevelsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictGroundwaterLevelsPrompt',
  input: {schema: PredictGroundwaterLevelsInputSchema},
  output: {schema: PredictGroundwaterLevelsOutputSchema},
  prompt: `You are an expert hydrologist specializing in predicting groundwater levels.

  You will receive historical groundwater level data for a specific monitoring station, and you will use this data to predict future groundwater levels for a specified number of days.

  The historical data will be in JSON format, with each entry containing a date and a groundwater level measurement. The predicted levels MUST also be in JSON format.

  Historical Data: {{{historicalData}}}
  Number of Days to Predict: {{{predictionDays}}}

  Please provide the predicted groundwater levels for the next {{{predictionDays}}} days in JSON format, including the date for each prediction. Dates MUST be in ISO format.
  `,
});

const predictGroundwaterLevelsFlow = ai.defineFlow(
  {
    name: 'predictGroundwaterLevelsFlow',
    inputSchema: PredictGroundwaterLevelsInputSchema,
    outputSchema: PredictGroundwaterLevelsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
