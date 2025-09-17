'use server';

/**
 * @fileOverview A water data agent that can answer questions about monitoring stations and groundwater resources.
 * 
 * - waterDataAgent - A function that handles the question answering process.
 * - WaterDataAgentInput - The input type for the waterDataAgent function.
 * - WaterDataAgentOutput - The return type for the waterDataAgent function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { mockStationData } from '@/lib/data';
import { groundWaterInfo } from '@/lib/groundwater-info';

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
    input: { schema: z.object({
        query: z.string(),
        stationData: z.string(),
        contextualInfo: z.string()
    }) },
    output: { schema: WaterDataAgentOutputSchema },
    prompt: `You are a helpful assistant for the AquaWatch Insights app.
You can answer questions about groundwater monitoring stations and groundwater resources in India.
The user might ask in English or Hindi. Respond in the language of the query.
Use the provided station data and contextual information to answer the user's query.
If the user asks a general question, greet them and ask how you can help with water data.
If you don't know the answer, say that you don't have that information. Do not mention the source documents.

Contextual Information:
{{{contextualInfo}}}

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
            stationData: stationData,
            contextualInfo: groundWaterInfo
        });
        return output!;
    }
);
