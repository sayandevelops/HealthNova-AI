
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
import { HeartPulse, User, Bot, RefreshCcw } from "lucide-react";

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
  const [state, formAction, isPending] = useActionState(getHealthAdvice, initialState);
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
        setChatHistory((prev) => [...prev, { role: 'user', content: userContent }, { role: 'model', content: state.data.response }]);
        setSymptoms('');
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
  }, [chatHistory])

  const handleExampleClick = (symptom: string) => {
    setChatHistory([]);
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
    // To fully reset the form state, we can reset the form element itself
    formRef.current?.reset(); 
    // We also clear the `state` from useActionState by re-setting the page or relevant part, here we just clear history
    state.message = null;
    state.errors = null;
    state.data = null;
  }

  const historyForForm = state.data?.history ?? [];

  if (chatHistory.length > 0) {
    return (
      <div className="flex flex-col h-full max-h-[calc(100dvh-5rem)]">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6" ref={chatContainerRef}>
          {chatHistory.map((msg, index) => (
            <div key={index} className={`flex gap-3 items-start ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'model' && <Bot className="h-6 w-6 text-primary flex-shrink-0" />}
              <div className={`rounded-lg p-3 max-w-[85%] ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                {msg.role === 'user' ? <p>{msg.content}</p> : <AIResponse response={msg.content} isStreaming={false} chatHistory={chatHistory} audioRef={audioRef} />}
              </div>
              {msg.role === 'user' && <User className="h-6 w-6 text-primary flex-shrink-0" />}
            </div>
          ))}
          {isPending && (
            <div className="flex gap-3 items-start justify-start">
              <Bot className="h-6 w-6 text-primary flex-shrink-0" />
              <div className="rounded-lg p-3 max-w-[85%] bg-muted">
                <AIResponse response={null} isStreaming={true} chatHistory={chatHistory} audioRef={audioRef} />
              </div>
            </div>
          )}
        </div>
        <div className="p-4 bg-background border-t">
          <form ref={formRef} action={formAction} className="space-y-4 max-w-3xl mx-auto">
            <input type="hidden" name="history" value={JSON.stringify(historyForForm)} />
            <Textarea
              id="symptoms"
              name="symptoms"
              placeholder="Ask a follow-up question..."
              className="min-h-[60px] text-base"
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
                <p className="text-sm text-destructive">
                  {state.errors.symptoms[0]}
                </p>
              )}
            <div className="flex justify-between items-center">
               <RadioGroup
                  name="language"
                  defaultValue="en"
                  className="flex flex-row gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="en" id="en-chat" />
                    <Label htmlFor="en-chat">EN</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="hi" id="hi-chat" />
                    <Label htmlFor="hi-chat">HI</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="bn" id="bn-chat" />
                    <Label htmlFor="bn-chat">BN</Label>
                  </div>
                </RadioGroup>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={handleReset} aria-label="Reset chat">
                  <RefreshCcw className="h-5 w-5" />
                </Button>
                <SubmitButton />
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-0 sm:px-4 py-0 sm:py-4 md:py-12">
      <div className="mx-auto max-w-3xl">
        <Card className="shadow-lg transition-all duration-300 hover:shadow-xl rounded-none sm:rounded-lg sm:border-t-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <HeartPulse className="h-8 w-8 text-primary" />
                <CardTitle className="text-2xl md:text-3xl font-headline">
                  Symptom Checker
                </CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
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
            
            <form ref={formRef} action={formAction} className="space-y-6">
               <input type="hidden" name="history" value={JSON.stringify(historyForForm)} />
              <div className="space-y-2">
                <Label htmlFor="symptoms" className="text-lg">
                  How are you feeling?
                </Label>
                <Textarea
                  id="symptoms"
                  name="symptoms"
                  placeholder="Describe your symptoms..."
                  className="min-h-[100px] text-base"
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
      </div>
    </div>
  );
}

    