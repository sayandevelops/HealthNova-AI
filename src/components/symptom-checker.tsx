
"use client";

import { useFormStatus, useFormState } from "react-dom";
import { useEffect, useRef, useState, useTransition } from "react";
import { getHealthAdvice, type FormState } from "@/app/actions";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AIResponse } from "@/components/ai-response";
import { useToast } from "@/hooks/use-toast";
import { HeartPulse, User, Bot, RefreshCcw, Send } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AppLayout } from "./app-layout";

type ChatMessage = {
    role: 'user' | 'model';
    content: string;
};

export type ChatThread = {
    id: string;
    title: string;
    messages: ChatMessage[];
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

const LOCAL_STORAGE_KEY = 'medaid-chat-history';

export function SymptomChecker() {
  const [state, formAction] = useFormState(getHealthAdvice, initialState);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [symptoms, setSymptoms] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [chatHistory, setChatHistory] = useState<ChatThread[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  useEffect(() => {
    // Load chat history from local storage on initial client render
    try {
      const savedHistory = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        setChatHistory(parsedHistory);
        if (parsedHistory.length > 0 && !currentChatId) {
            setCurrentChatId(parsedHistory[0].id);
        }
      }
    } catch (e) {
      console.error("Failed to load chat history from local storage:", e);
    }
  }, []);

  // Save chat history to local storage whenever it changes
  useEffect(() => {
    if (chatHistory.length > 0) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(chatHistory));
      } catch (e) {
        console.error("Failed to save chat history to local storage:", e);
      }
    } else {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }, [chatHistory]);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.message === "Success" && state.data) {
        const lastUserMessage = state.data.history.findLast(m => m.role === 'user');
        const userContent = lastUserMessage?.content[0].text ?? '';

        const newMessages: ChatMessage[] = [
            { role: 'user', content: userContent },
            { role: 'model', content: state.data.response }
        ];

        setChatHistory(prevHistory => {
            if (currentChatId) {
                // Add to existing chat
                return prevHistory.map(chat => 
                    chat.id === currentChatId 
                        ? { ...chat, messages: [...chat.messages, ...newMessages] }
                        : chat
                );
            } else {
                // Create new chat
                const newChatId = new Date().toISOString();
                const newChat: ChatThread = {
                    id: newChatId,
                    title: userContent.substring(0, 30), // Use first 30 chars as title
                    messages: newMessages
                };
                setCurrentChatId(newChatId);
                return [...prevHistory, newChat];
            }
        });
        setSymptoms('');

    } else if (state.message && state.message !== "Invalid form data." && state.message !== "Success") {
      toast({
        title: "Error",
        description: state.message,
        variant: "destructive",
      });
    }
  }, [state]);

  useEffect(() => {
    chatContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [chatHistory, isPending, currentChatId]);

  const handleExampleClick = (symptom: string) => {
    setSymptoms(symptom);
    setTimeout(() => {
        formRef.current?.querySelector<HTMLButtonElement>('button[type="submit"]')?.click()
    }, 0);
  }

  const handleNewChat = () => {
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
    }
    setCurrentChatId(null);
    setSymptoms('');
    state.message = null;
    state.errors = null;
    state.data = null;
  }

  const handleDeleteChat = (id: string) => {
    setChatHistory(prev => prev.filter(chat => chat.id !== id));
    if (currentChatId === id) {
        // If we deleted the active chat, select the first one or start a new chat
        const remainingChats = chatHistory.filter(chat => chat.id !== id);
        if (remainingChats.length > 0) {
            setCurrentChatId(remainingChats[0].id);
        } else {
            handleNewChat();
        }
    }
  };

  const currentChatMessages = chatHistory.find(chat => chat.id === currentChatId)?.messages ?? [];
  const historyForForm = currentChatMessages.map(msg => ({
      role: msg.role,
      content: [{ text: msg.content }]
  }));

  const handleFormAction = (formData: FormData) => {
      startTransition(() => {
          formAction(formData);
      });
  };

  return (
    <AppLayout
        chatHistory={chatHistory}
        currentChatId={currentChatId}
        onSelectChat={setCurrentChatId}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
    >
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto" ref={chatContainerRef}>
                {currentChatMessages.length === 0 && !isPending ? (
                    <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                        <div className="mb-8">
                            <HeartPulse className="h-16 w-16 text-primary mx-auto" />
                            <h1 className="text-3xl font-bold font-headline mt-4">MedAid AI</h1>
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
                        {currentChatMessages.map((msg, index) => (
                            <div key={index} className={`flex gap-4 items-start ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.role === 'model' && <Bot className="h-8 w-8 text-primary flex-shrink-0 rounded-full border p-1" />}
                                <div className={`rounded-lg p-3 max-w-[85%] ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card border'}`}>
                                    {msg.role === 'user' ? <p>{msg.content}</p> : <AIResponse response={msg.content} isStreaming={false} chatHistory={currentChatMessages.map(m => ({...m, content: m.content || ''}))} audioRef={audioRef} />}
                                </div>
                                {msg.role === 'user' && <User className="h-8 w-8 text-primary flex-shrink-0 rounded-full border p-1" />}
                            </div>
                        ))}
                        {isPending && (
                            <div className="flex gap-4 items-start justify-start">
                                <Bot className="h-8 w-8 text-primary flex-shrink-0 rounded-full border p-1" />
                                <div className="rounded-lg p-3 max-w-[85%] bg-card border">
                                    <AIResponse response={null} isStreaming={true} chatHistory={[]} audioRef={audioRef} />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            <div className="px-4 pb-4 bg-background sticky bottom-0">
                <div className="max-w-3xl mx-auto">
                    <form ref={formRef} action={handleFormAction} className="relative">
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
                </div>
            </div>
        </div>
    </AppLayout>
  );
}
