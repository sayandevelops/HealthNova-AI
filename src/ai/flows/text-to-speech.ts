
'use server';
/**
 * @fileOverview A text-to-speech (TTS) flow that converts a string of text into playable audio.
 * It handles long text by splitting it into sentences, generating audio for each, and then merging them into a single audio file.
 *
 * - textToSpeech - A function that takes a text string and returns a data URI for the generated audio.
 * - TextToSpeechInput - The input type for the textToSpeech function.
 * - TextToSpeechOutput - The return type for the textToSpeech function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import wav from 'wav';
import {Readable} from 'stream';

const TextToSpeechInputSchema = z.string().describe('The text to be converted to speech.');
export type TextToSpeechInput = z.infer<typeof TextToSpeechInputSchema>;

const TextToSpeechOutputSchema = z.object({
  audio: z.string().describe("A data URI representing the generated audio file in WAV format."),
});
export type TextToSpeechOutput = z.infer<typeof TextToSpeechOutputSchema>;

export async function textToSpeech(input: TextToSpeechInput): Promise<TextToSpeechOutput> {
  return textToSpeechFlow(input);
}

// This function converts raw PCM audio data into a Base64-encoded WAV file string.
async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

// This function merges multiple Base64-encoded WAV files into a single one.
async function mergeWavs(base64Wavs: string[]): Promise<string> {
  if (base64Wavs.length === 0) {
    return '';
  }
  if (base64Wavs.length === 1) {
    return base64Wavs[0];
  }

  const buffers = base64Wavs.map(b64 => Buffer.from(b64, 'base64'));
  const readers = buffers.map(buf => new wav.Reader());

  const getHeaderAndDuration = (reader: wav.Reader, buffer: Buffer): Promise<{header: Buffer, duration: number}> => {
    return new Promise((resolve) => {
      reader.on('format', (format) => {
        const header = buffer.slice(0, 44); // Standard WAV header size
        const duration = buffer.length / (format.sampleRate * format.channels * (format.bitDepth / 8));
        resolve({ header, duration });
      });
      reader.end(buffer);
    });
  };

  const firstReader = readers[0];
  const { header: mainHeader } = await getHeaderAndDuration(firstReader, buffers[0]);
  
  const dataChunks = buffers.map(buffer => buffer.slice(44));
  const combinedData = Buffer.concat(dataChunks);

  const finalSize = combinedData.length + 36;
  const finalRiffSize = combinedData.length + 8;
  
  const finalHeader = Buffer.from(mainHeader);
  finalHeader.writeUInt32LE(finalSize, 4); // Write final file size
  finalHeader.writeUInt32LE(combinedData.length, 40); // Write final data size

  const finalWavBuffer = Buffer.concat([finalHeader, combinedData]);
  
  return finalWavBuffer.toString('base64');
}


const textToSpeechFlow = ai.defineFlow(
  {
    name: 'textToSpeechFlow',
    inputSchema: TextToSpeechInputSchema,
    outputSchema: TextToSpeechOutputSchema,
  },
  async query => {
    // Split the input text into sentences. This is a simple regex and might not be perfect.
    const sentences = query.match(/[^.!?]+[.!?\s]*/g)?.filter(s => s.trim()) || [query];
    
    // Generate audio for each sentence in parallel.
    const audioGenerationPromises = sentences.map(async (sentence) => {
      try {
        const {media} = await ai.generate({
          model: 'googleai/gemini-2.5-flash-preview-tts',
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {voiceName: 'Algenib'},
              },
            },
          },
          prompt: sentence,
        });

        if (!media) {
          console.warn('Audio generation returned no media for sentence:', sentence);
          return null;
        }

        const pcmBuffer = Buffer.from(
          media.url.substring(media.url.indexOf(',') + 1),
          'base64'
        );

        return toWav(pcmBuffer);
      } catch (e) {
        console.error('Error generating audio for sentence:', sentence, e);
        return null; // Return null if a single sentence fails, so we can filter it out.
      }
    });

    const wavResults = await Promise.all(audioGenerationPromises);
    const validWavs = wavResults.filter((w): w is string => w !== null);
    
    if (validWavs.length === 0) {
      throw new Error('No audio could be generated for the provided text.');
    }

    const mergedWav = await mergeWavs(validWavs);

    return {
      audio: 'data:audio/wav;base64,' + mergedWav,
    };
  }
);
