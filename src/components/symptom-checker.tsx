
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
import { HeartPulse, User, Bot } from "lucide-react";

type ChatMessage = {
    role: 'user' | 'model';
    content: string;
};

const initialState: FormState = {
  message: null,
  errors: null,
  data: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? "Sending..." : "Send"}
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
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.message === "Success" && state.data) {
        setChatHistory((prev) => [...prev, { role: 'user', content: symptoms }, { role: 'model', content: state.data.response }]);
        setSymptoms('');
    } else if (state.message && state.message !== "Invalid form data.") {
      toast({
        title: "Error",
        description: state.message,
        variant: "destructive",
      });
    }
  }, [state, toast, symptoms]);

  useEffect(() => {
    chatContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [chatHistory])

  const handleExampleClick = (symptom: string) => {
    setChatHistory([]);
    setSymptoms(symptom);
    setTimeout(() => {
        formRef.current?.querySelector<HTMLButtonElement>('button[type="submit"]')?.click()
    }, 0);
  }

  const historyForForm = state.data?.history ?? [];

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
            {chatHistory.length === 0 && (
                 <div className="space-y-3 mb-6">
                 <Label className="text-base">Need help? Try an example:</Label>
                 <div className="flex flex-wrap gap-2">
                    {exampleSymptoms.map(ex => (
                        <Button key={ex.name} type="button" variant="outline" size="sm" onClick={() => handleExampleClick(ex.symptom)}>
                            {ex.name}
                        </Button>
                    ))}
                 </div>
               </div>
            )}
            
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4 mb-4" ref={chatContainerRef}>
                {chatHistory.map((msg, index) => (
                    <div key={index} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                       {msg.role === 'model' && <Bot className="h-6 w-6 text-primary flex-shrink-0" />}
                        <div className={`rounded-lg p-3 max-w-[85%] ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                           {msg.role === 'user' ? <p>{msg.content}</p> : <AIResponse response={msg.content} isStreaming={false} />}
                        </div>
                        {msg.role === 'user' && <User className="h-6 w-6 text-primary flex-shrink-0" />}
                    </div>
                ))}
                {useFormStatus().pending && chatHistory.length > 0 && (
                     <div className="flex gap-3 justify-start">
                        <Bot className="h-6 w-6 text-primary flex-shrink-0" />
                        <div className="rounded-lg p-3 max-w-[85%] bg-muted">
                           <AIResponse response={null} isStreaming={true} />
                        </div>
                    </div>
                )}
            </div>

            <form ref={formRef} action={formAction} className="space-y-6">
               <input type="hidden" name="history" value={JSON.stringify(historyForForm)} />
              <div className="space-y-2">
                <Label htmlFor="symptoms" className="text-lg">
                  {chatHistory.length === 0 ? "How are you feeling?" : "Ask a follow-up question:"}
                </Label>
                <Textarea
                  id="symptoms"
                  name="symptoms"
                  placeholder={chatHistory.length === 0 ? "Describe your symptoms... (e.g., 'I have a high fever and a headache')" : "e.g., What should I eat?"}
                  className="min-h-[100px] text-base"
                  required
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        formRef.current?.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
                    }
                  }}
                />
                {state.errors?.symptoms && (
                  <p className="text-sm text-destructive">
                    {state.errors.symptoms[0]}
                  </p>
                )}
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
        
        {chatHistory.length === 0 && <AIResponse response={state.data?.response ?? null} isStreaming={useFormStatus().pending} />}

      </div>
    </div>
  );
}
