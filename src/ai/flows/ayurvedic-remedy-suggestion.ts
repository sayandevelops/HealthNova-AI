'use server';
/**
 * @fileOverview This file defines a Genkit flow for suggesting Ayurvedic remedies based on user-described symptoms.
 *
 * - ayurvedicRemedySuggestion - A function that takes symptom descriptions and returns suggested Ayurvedic remedies.
 * - AyurvedicRemedySuggestionInput - The input type for the ayurvedicRemedySuggestion function.
 * - AyurvedicRemedySuggestionOutput - The return type for the ayurvedicRemedySuggestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AyurvedicRemedySuggestionInputSchema = z.string().describe('A description of the user provided symptoms.');
export type AyurvedicRemedySuggestionInput = z.infer<typeof AyurvedicRemedySuggestionInputSchema>;

const AyurvedicRemedySuggestionOutputSchema = z.string().describe('Suggested Ayurvedic remedies for the described symptoms.');
export type AyurvedicRemedySuggestionOutput = z.infer<typeof AyurvedicRemedySuggestionOutputSchema>;

export async function ayurvedicRemedySuggestion(input: AyurvedicRemedySuggestionInput): Promise<AyurvedicRemedySuggestionOutput> {
  return ayurvedicRemedySuggestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'ayurvedicRemedySuggestionPrompt',
  input: {schema: AyurvedicRemedySuggestionInputSchema},
  output: {schema: AyurvedicRemedySuggestionOutputSchema},
  prompt: `You are an Ayurvedic wellness advisor. Based on the following symptoms, suggest safe Ayurvedic remedies.

Symptoms: {{{$input}}}

Make sure to only suggest remedies that are considered safe and widely accepted, such as Tulsi, Ginger, Turmeric, Amla, and Ashwagandha. Always clarify that this is general information, not a medical diagnosis, and that the user should consult a doctor for confirmation. Mark Ayurvedic advice separately as: “🌿 Ayurvedic Tip”. If you cannot provide a safe answer, state that you cannot provide a safe answer, and the user should consult a doctor.
`,
});

const ayurvedicRemedySuggestionFlow = ai.defineFlow(
  {
    name: 'ayurvedicRemedySuggestionFlow',
    inputSchema: AyurvedicRemedySuggestionInputSchema,
    outputSchema: AyurvedicRemedySuggestionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
