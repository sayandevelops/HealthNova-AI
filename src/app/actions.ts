
"use server";

import { symptomChecker, type ChatHistory } from "@/ai/flows/symptom-checker";
import { textToSpeech } from "@/ai/flows/text-to-speech";
import { speechToText } from "@/ai/flows/speech-to-text";
import { z } from "zod";

const symptomActionSchema = z.object({
  symptoms: z.string().min(1, "Please enter a message.").max(1000, "Please keep your message under 1000 characters."),
  language: z.enum(["en", "hi", "bn"]),
  history: z.string().optional(),
});

export type FormState = {
  message: string | null;
  data: {
    response: string;
    history: ChatHistory;
  } | null;
  errors: {
    symptoms?: string[] | undefined;
    language?: string[] | undefined;
    history?: string[] | undefined;
  } | null;
};

export async function getHealthAdvice(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const rawFormData = {
    symptoms: formData.get("symptoms"),
    language: formData.get("language"),
    history: formData.get("history"),
  };

  const validatedFields = symptomActionSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      message: "Invalid form data.",
      errors: validatedFields.error.flatten().fieldErrors,
      data: null,
    };
  }
  
  let history: ChatHistory = [];
  if (validatedFields.data.history) {
      try {
          history = JSON.parse(validatedFields.data.history);
      } catch (e) {
          console.error("Failed to parse chat history", e);
          // Don't fail the request, just proceed with empty history
      }
  }


  try {
    const result = await symptomChecker({
      symptoms: validatedFields.data.symptoms,
      language: validatedFields.data.language,
      history: history,
    });
    
    const newHistory: ChatHistory = [
        ...history,
        { role: 'user' as const, content: [{ text: validatedFields.data.symptoms }] },
        { role: 'model' as const, content: [{ text: result.advice }] },
    ];

    return {
      message: "Success",
      errors: null,
      data: {
        response: result.advice,
        history: newHistory,
      },
    };
  } catch (error) {
    console.error(error);
    return {
      message: "An AI error occurred. Please try again.",
      errors: null,
      data: null,
    };
  }
}

const ttsActionSchema = z.array(z.string().min(1).max(1000)).min(1).max(100);

export async function getAudio(chunks: string[]): Promise<{ audio: string[] } | { error: string }> {
  const validatedText = ttsActionSchema.safeParse(chunks);
  if (!validatedText.success) {
    return { error: "Invalid text provided for audio conversion." };
  }

  try {
    const audioPromises = validatedText.data.map(text => textToSpeech(text));
    const results = await Promise.all(audioPromises);
    const audioDataUris = results.map(r => r.audio);
    return { audio: audioDataUris };
  } catch (error) {
    console.error("TTS Error:", error);
    return { error: "Failed to generate audio. Please try again." };
  }
}

const sttActionSchema = z.string().min(1, "Audio data cannot be empty.");

export async function getText(audio: string): Promise<{ text: string } | { error: string }> {
  const validatedAudio = sttActionSchema.safeParse(audio);
  if (!validatedAudio.success) {
    return { error: "Invalid audio data provided." };
  }

  try {
    const result = await speechToText({ audio: validatedAudio.data });
    return { text: result.text };
  } catch (error) {
    console.error("STT Error:", error);
    return { error: "Failed to transcribe audio. Please try again." };
  }
}
