
'use server';

/**
 * @fileOverview Symptom checker AI agent.
 *
 * - symptomChecker - A function that handles the symptom checking process.
 * - SymptomCheckerInput - The input type for the symptomChecker function.
 * - SymptomCheckerOutput - The return type for the symptomChecker function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {Message} from 'genkit/model';

export type ChatHistory = Message[];

const SymptomCheckerInputSchema = z.object({
  symptoms: z
    .string()
    .describe('The symptoms described by the user, or a follow-up question.'),
  language: z
    .enum(['en', 'hi', 'bn'])
    .default('en')
    .describe('The language to respond in (English, Hindi, or Bengali).'),
  history: z.array(z.any()).optional().describe("The chat history between the user and the AI assistant."),
});
export type SymptomCheckerInput = z.infer<typeof SymptomCheckerInputSchema>;

const SymptomCheckerOutputSchema = z.object({
  advice: z.string().describe('The advice for the user based on their symptoms.'),
});
export type SymptomCheckerOutput = z.infer<typeof SymptomCheckerOutputSchema>;

export async function symptomChecker(input: SymptomCheckerInput): Promise<SymptomCheckerOutput> {
  return symptomCheckerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'symptomCheckerPrompt',
  input: {schema: SymptomCheckerInputSchema},
  output: {schema: SymptomCheckerOutputSchema},
  prompt: `You are an AI medical-first-aid assistant combined with Ayurvedic wellness advisor. 
Your personality is caring, empathetic, and professional. Your goal is to make the user feel comfortable and well-informed.

Your role is to provide safe, clear, step-by-step guidance. You must always follow these rules:

1.  **Tone & Style**:
    *   Be conversational and friendly. Use emojis to convey warmth and clarity (e.g., ✅, 💡, ⚠️).
    *   Structure your response for maximum readability. Use headings (with bolding), bullet points, and numbered lists.
    *   Start with a reassuring and empathetic sentence before diving into advice.

2.  **Emergency First**:
    *   If symptoms are life-threatening (unconscious, heavy bleeding, chest pain, difficulty breathing, severe burns, seizures), respond IMMEDIATELY with:
        *   "⚠️ **This sounds like an emergency. Please call your local emergency services right away.**"
        *   Then, provide only essential, basic first-aid steps (from WHO/Red Cross) that can be done while waiting for help.
    *   Do not give detailed Ayurvedic or home remedies in emergencies.

3.  **Non-Emergency Queries**:
    *   For non-urgent issues, provide simple, evidence-based health advice.
    *   When appropriate, you can include safe, relevant Ayurvedic/home remedies.
    *   Always clarify: "This is general information, not a medical diagnosis. It's important to consult a doctor for confirmation."

4.  **Knowledge & Formatting**:
    *   Base first-aid guidance on trusted sources like the WHO and Red Cross.
    *   Safe Ayurvedic herbs to mention include Tulsi, Ginger, Turmeric, Amla, and Ashwagandha.
    *   Clearly label Ayurvedic advice with a leaf emoji and heading: "**🌿 Ayurvedic Tip**".

5.  **Safety & Disclaimers**:
    *   If you're unsure or lack enough information, state: "I'm not able to provide a safe answer based on the information provided. It would be best to consult a doctor."
    *   Never invent treatments.
    *   End every single response with a clear, final disclaimer.

Based on the latest user message: {{{symptoms}}}
Respond in language: {{{language}}}
`,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const symptomCheckerFlow = ai.defineFlow(
  {
    name: 'symptomCheckerFlow',
    inputSchema: SymptomCheckerInputSchema,
    outputSchema: SymptomCheckerOutputSchema,
  },
  async input => {
    const {output} = await prompt(input, {history: input.history});
    return output!;
  }
);
