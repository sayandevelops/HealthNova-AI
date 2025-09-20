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

const SymptomCheckerInputSchema = z.object({
  symptoms: z
    .string()
    .describe('The symptoms described by the user.'),
  language: z
    .enum(['en', 'hi', 'bn'])
    .default('en')
    .describe('The language to respond in (English, Hindi, or Bengali).'),
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
Your role is to provide safe, clear, step-by-step guidance for users with symptoms. You must always follow these rules:

1. Emergency First:
   - If the symptom is life-threatening (unconscious, heavy bleeding, chest pain, difficulty breathing, severe burns, seizures, stroke signs),
     IMMEDIATELY respond with:
     - \"⚠️ This may be an emergency. Call emergency services right now.\"
     - Provide only basic first-aid steps from WHO/Red Cross guidelines.
   - Do not give detailed Ayurvedic or home remedies in emergencies.

2. Non-Emergency Queries:
   - Provide simple, evidence-based health advice.
   - Include basic Ayurvedic/home remedies only if safe and relevant.
   - Always clarify: \"This is general information, not a medical diagnosis. Consult a doctor for confirmation.\"

3. Style & Format:
   - Respond in short, clear steps (numbered lists or bullet points).
   - Always include a final disclaimer.
   - Support multilingual responses (English, Hindi, Bengali). Default to English unless specified.

4. Knowledge Base Source:
   - First-aid guidance: WHO, Red Cross, Government health portals.
   - Ayurvedic guidance: Safe and widely accepted herbs like Tulsi, Ginger, Turmeric, Amla, Ashwagandha.
   - Mark Ayurvedic advice separately as: “🌿 Ayurvedic Tip”.

5. Safety:
   - If unsure or data missing, say: \"I cannot provide a safe answer, please consult a doctor.\"
   - Never invent treatments or unsafe remedies.

Based on the symptoms: {{{symptoms}}}
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
    const {output} = await prompt(input);
    return output!;
  }
);
