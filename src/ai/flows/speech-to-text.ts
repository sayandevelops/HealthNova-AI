'use server';
/**
 * @fileOverview A speech-to-text (STT) flow that converts spoken audio into text.
 *
 * - speechToText - A function that takes an audio data URI and returns the transcribed text.
 * - SpeechToTextInput - The input type for the speechToText function.
 * - SpeechToTextOutput - The return type for the speechToText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SpeechToTextInputSchema = z.object({
  audio: z
    .string()
    .describe(
      "A data URI representing the audio file to be transcribed. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type SpeechToTextInput = z.infer<typeof SpeechToTextInputSchema>;

const SpeechToTextOutputSchema = z.object({
  text: z.string().describe('The transcribed text from the audio.'),
});
export type SpeechToTextOutput = z.infer<typeof SpeechToTextOutputSchema>;

export async function speechToText(input: SpeechToTextInput): Promise<SpeechToTextOutput> {
  return speechToTextFlow(input);
}

const speechToTextFlow = ai.defineFlow(
  {
    name: 'speechToTextFlow',
    inputSchema: SpeechToTextInputSchema,
    outputSchema: SpeechToTextOutputSchema,
  },
  async ({audio}) => {
    const {text} = await ai.generate({
      prompt: [
        {media: {url: audio, contentType: 'audio/webm'}},
        {text: 'Transcribe the spoken audio.'},
      ],
      config: {
        temperature: 0.1,
      }
    });

    return {
      text,
    };
  }
);
