
"use client";

import { useFormStatus } from "react-dom";
import { useEffect, useRef, useState, useActionState } from "react";
import { getHealthAdvice, type FormState } from "@/app/actions";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AIResponse } from "@/components/ai-response";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { HeartPulse, Pill, Sparkles } from "lucide-react";

const initialState: FormState = {
  message: null,
  errors: null,
  data: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? (
        <>
          <Sparkles className="mr-2 h-4 w-4 animate-spin" />
          Getting Advice...
        </>
      ) : (
        "Get AI Advice"
      )}
    </Button>
  );
}

const exampleSymptoms = [
    { name: "Nose Bleed", symptom: "I have a small nose bleed" },
    { name: "Fever", symptom: "I have a fever and a slight headache" },
    { name: "Cough", symptom: "I have a dry cough that won't go away" },
    { name: "Unconscious", symptom: "Someone is unconscious and not responding" },
];

export function SymptomChecker() {
  const [state, formAction] = useActionState(getHealthAdvice, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [symptoms, setSymptoms] = useState('');

  useEffect(() => {
    if (state.message === "Success" || state.message === "Invalid form data.") {
        // Form submitted, do nothing
    } else if (state.message) {
      toast({
        title: "Error",
        description: state.message,
        variant: "destructive",
      });
    }
  }, [state, toast]);

  const handleExampleClick = (symptom: string) => {
    setSymptoms(symptom);
    // Directly submit form
    setTimeout(() => formRef.current?.requestSubmit(), 0);
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="mx-auto max-w-3xl">
        <Card className="shadow-lg transition-all duration-300 hover:shadow-xl">
          <CardHeader>
            <div className="flex items-center gap-3">
              <HeartPulse className="h-8 w-8 text-primary" />
              <CardTitle className="text-2xl md:text-3xl font-headline">
                Symptom Checker
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <form ref={formRef} action={formAction} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="symptoms" className="text-lg">
                  How are you feeling?
                </Label>
                <Textarea
                  id="symptoms"
                  name="symptoms"
                  placeholder="Describe your symptoms... (e.g., 'I have a high fever and a headache')"
                  className="min-h-[120px] text-base"
                  required
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                />
                {state.errors?.symptoms && (
                  <p className="text-sm text-destructive">
                    {state.errors.symptoms[0]}
                  </p>
                )}
              </div>

               <div className="space-y-3">
                 <Label className="text-base">Or try an example:</Label>
                 <div className="flex flex-wrap gap-2">
                    {exampleSymptoms.map(ex => (
                        <Button key={ex.name} type="button" variant="outline" size="sm" onClick={() => handleExampleClick(ex.symptom)}>
                            {ex.name}
                        </Button>
                    ))}
                 </div>
               </div>

              <div className="space-y-3">
                <Label className="text-lg">Response Language</Label>
                <RadioGroup
                  name="language"
                  defaultValue="en"
                  className="flex flex-col sm:flex-row gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="en" id="en" />
                    <Label htmlFor="en">English</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="hi" id="hi" />
                    <Label htmlFor="hi">हिंदी (Hindi)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="bn" id="bn" />
                    <Label htmlFor="bn">বাংলা (Bengali)</Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="flex justify-end pt-4">
                <SubmitButton />
              </div>
            </form>
          </CardContent>
        </Card>
        
        <AIResponse response={state.data} />

      </div>
    </div>
  );
}
