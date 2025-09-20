
"use server";

import { symptomChecker } from "@/ai/flows/symptom-checker";
import { z } from "zod";

const actionSchema = z.object({
  symptoms: z.string().min(3, "Please describe your symptoms in more detail.").max(500, "Please keep your description under 500 characters."),
  language: z.enum(["en", "hi", "bn"]),
});

export type FormState = {
  message: string | null;
  data: string | null;
  errors: {
    symptoms?: string[] | undefined;
    language?: string[] | undefined;
  } | null;
};

export async function getHealthAdvice(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const rawFormData = {
    symptoms: formData.get("symptoms"),
    language: formData.get("language"),
  };

  const validatedFields = actionSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      message: "Invalid form data.",
      errors: validatedFields.error.flatten().fieldErrors,
      data: null,
    };
  }

  try {
    const result = await symptomChecker(validatedFields.data);
    return {
      message: "Success",
      errors: null,
      data: result.advice,
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
