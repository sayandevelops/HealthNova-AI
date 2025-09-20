
"use server";

import { symptomChecker, type ChatHistory } from "@/ai/flows/symptom-checker";
import { textToSpeech } from "@/ai/flows/text-to-speech";
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
  
  const history: ChatHistory = validatedFields.data.history ? JSON.parse(validatedFields.data.history) : [];

  try {
    const result = await symptomChecker({
      symptoms: validatedFields.data.symptoms,
      language: validatedFields.data.language,
      history: history,
    });
    
    const newHistory = [
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

const ttsActionSchema = z.string().min(1, "Text cannot be empty.").max(2000, "Text is too long for audio conversion.");

export async function getAudio(text: string): Promise<{ audio: string } | { error: string }> {
  const validatedText = ttsActionSchema.safeParse(text);
  if (!validatedText.success) {
    return { error: "Invalid text provided." };
  }

  try {
    const result = await textToSpeech(validatedText.data);
    return { audio: result.audio };
  } catch (error) {
    console.error("TTS Error:", error);
    return { error: "Failed to generate audio. Please try again." };
  }
}
