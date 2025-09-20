
"use client";

import { useFormStatus, useFormState } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { getHealthAdvice, type FormState } from "@/app/actions";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AIResponse } from "@/components/ai-response";
import { useToast } from "@/hooks/use-toast";
import { HeartPulse, User, Bot, RefreshCcw, Send } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

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
    <Button type="submit" size="icon" disabled={pending} className="absolute right-2.5 bottom-2.5 h-8 w-8">
       {pending ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
      <span className="sr-only">Send message</span>
    </Button>
  );
}

const exampleSymptoms = [
    { name: "Nose Bleed", symptom: "I have a small nose bleed", label: "Example" },
    { name: "Fever", symptom: "I have a fever and a slight headache", label: "Example" },
    { name: "Cough", symptom: "I have a dry cough that won't go away", label: "Creative" },
    { name: "Unconscious", symptom: "Someone is unconscious and not responding", label: "Emergency" },
];

export function SymptomChecker() {
  const [state, formAction, isPending] = useFormState(getHealthAdvice, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [symptoms, setSymptoms] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (state.message === "Success" && state.data) {
        const lastUserMessage = state.data.history.findLast(m => m.role === 'user');
        const userContent = lastUserMessage?.content[0].text ?? '';
        
        // This is a new chat if the history was empty before this message
        const isNewChat = chatHistory.length === 0;

        setChatHistory((prev) => [...prev, { role: 'user', content: userContent }, { role: 'model', content: state.data.response }]);
        setSymptoms('');

        if (isNewChat) {
            // Remove the example prompts view
        }

    } else if (state.message && state.message !== "Invalid form data." && state.message !== "Success") {
      toast({
        title: "Error",
        description: state.message,
        variant: "destructive",
      });
    }
  }, [state, toast]);

  useEffect(() => {
    chatContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [chatHistory, isPending]);

  const handleExampleClick = (symptom: string) => {
    setSymptoms(symptom);
    setTimeout(() => {
        formRef.current?.querySelector<HTMLButtonElement>('button[type="submit"]')?.click()
    }, 0);
  }

  const handleReset = () => {
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
    }
    setChatHistory([]);
    setSymptoms('');
    if (formRef.current) {
        formRef.current.reset();
    }
    // Manually reset the action state
    state.message = null;
    state.errors = null;
    state.data = null;
  }

  const historyForForm = state.data?.history ?? [];

  return (
    <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto" ref={chatContainerRef}>
            {chatHistory.length === 0 && !isPending ? (
                <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                    <div className="mb-8">
                        <HeartPulse className="h-16 w-16 text-primary mx-auto" />
                        <h1 className="text-3xl font-bold font-headline mt-4">HealthNova AI</h1>
                        <p className="text-muted-foreground mt-2">Your AI medical-first-aid and Ayurvedic wellness advisor.</p>
                    </div>
                    <div className="w-full max-w-2xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {exampleSymptoms.map((ex, index) => (
                                <Card key={index} className="p-4 text-left hover:bg-muted cursor-pointer transition-colors" onClick={() => handleExampleClick(ex.symptom)}>
                                    <CardContent className="p-0">
                                        <p className="font-semibold text-sm">{ex.name}</p>
                                        <p className="text-xs text-muted-foreground">{ex.symptom}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
                    {chatHistory.map((msg, index) => (
                        <div key={index} className={`flex gap-4 items-start ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'model' && <Bot className="h-8 w-8 text-primary flex-shrink-0 rounded-full border p-1" />}
                            <div className={`rounded-lg p-3 max-w-[85%] ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card border'}`}>
                                {msg.role === 'user' ? <p>{msg.content}</p> : <AIResponse response={msg.content} isStreaming={false} chatHistory={chatHistory} audioRef={audioRef} />}
                            </div>
                            {msg.role === 'user' && <User className="h-8 w-8 text-primary flex-shrink-0 rounded-full border p-1" />}
                        </div>
                    ))}
                    {isPending && (
                        <div className="flex gap-4 items-start justify-start">
                            <Bot className="h-8 w-8 text-primary flex-shrink-0 rounded-full border p-1" />
                            <div className="rounded-lg p-3 max-w-[85%] bg-card border">
                                <AIResponse response={null} isStreaming={true} chatHistory={chatHistory} audioRef={audioRef} />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
        
        <div className="px-4 pb-4 bg-background sticky bottom-0">
            <div className="max-w-3xl mx-auto">
                <form ref={formRef} action={formAction} className="relative">
                    <input type="hidden" name="history" value={JSON.stringify(historyForForm)} />
                    <input type="hidden" name="language" value="en" />
                    <Textarea
                        id="symptoms"
                        name="symptoms"
                        placeholder="Describe your symptoms..."
                        className="min-h-[52px] text-base pr-12 resize-none"
                        required
                        value={symptoms}
                        onChange={(e) => setSymptoms(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (!isPending) {
                                formRef.current?.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
                            }
                            }
                        }}
                    />
                    {state.errors?.symptoms && (
                        <p className="text-sm text-destructive mt-1">
                            {state.errors.symptoms[0]}
                        </p>
                    )}
                    <SubmitButton />
                </form>
                {chatHistory.length > 0 && <Button variant="ghost" size="sm" onClick={handleReset} className="mt-2 text-xs text-muted-foreground">Reset Chat</Button>}
            </div>
        </div>
    </div>
  );
}
