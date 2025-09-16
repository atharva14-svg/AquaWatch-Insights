'use server';

/**
 * @fileOverview A water data agent that can answer questions about monitoring stations.
 * 
 * - waterDataAgent - A function that handles the question answering process.
 * - WaterDataAgentInput - The input type for the waterDataAgent function.
 * - WaterDataAgentOutput - The return type for the waterDataAgent function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { mockStationData } from '@/lib/data';

const WaterDataAgentInputSchema = z.object({
    query: z.string().describe('The user\'s question about water data.'),
});
export type WaterDataAgentInput = z.infer<typeof WaterDataAgentInputSchema>;

const WaterDataAgentOutputSchema = z.object({
    answer: z.string().describe('The answer to the user\'s question.'),
});
export type WaterDataAgentOutput = z.infer<typeof WaterDataAgentOutputSchema>;

export async function waterDataAgent(input: WaterDataAgentInput): Promise<WaterDataAgentOutput> {
    return waterDataAgentFlow(input);
}

const prompt = ai.definePrompt({
    name: 'waterDataAgentPrompt',
    input: { schema: WaterDataAgentInputSchema },
    output: { schema: WaterDataAgentOutputSchema },
    prompt: `You are a helpful assistant for the AquaWatch Insights app.
You can answer questions about groundwater monitoring stations.
The user might ask in English or Hindi. Respond in the language of the query.
Use the provided station data to answer the user's query.
If the user asks a general question, greet them and ask how you can help with water data.
If you don't know the answer, say that you don't have that information.

Station Data:
{{{stationData}}}

User Query: {{{query}}}
`,
});

const waterDataAgentFlow = ai.defineFlow(
    {
        name: 'waterDataAgentFlow',
        inputSchema: WaterDataAgentInputSchema,
        outputSchema: WaterDataAgentOutputSchema,
    },
    async (input) => {
        const stationData = JSON.stringify(mockStationData.map(s => ({ id: s.id, name: s.name, district: s.district, state: s.state, currentLevel: s.currentLevel, status: s.status, landUse: s.landUse })));
        
        const { output } = await prompt({
            ...input,
            stationData: stationData
        });
        return output!;
    }
);
