
"use client";

import { useFormStatus, useFormState } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { getHealthAdvice, type FormState, getText } from "@/app/actions";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AIResponse } from "@/components/ai-response";
import { useToast } from "@/hooks/use-toast";
import { HeartPulse, User, Bot, RefreshCcw, Send, Mic, MicOff, LoaderCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AppLayout } from "./app-layout";
import type { ChatHistory as GenkitChatHistory } from "@/ai/flows/symptom-checker";

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
    <Button type="submit" size="icon" disabled={pending} className="absolute right-12 bottom-2.5 h-8 w-8">
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

const LOCAL_STORAGE_KEY = 'healthnova-chat-history';

export function SymptomChecker() {
  const [state, formAction] = useFormState(getHealthAdvice, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [symptoms, setSymptoms] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [chatHistory, setChatHistory] = useState<ChatThread[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  const { pending: isFormPending } = useFormStatus();

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Load chat history from local storage on initial render
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory) as ChatThread[];
        if (Array.isArray(parsedHistory)) {
          setChatHistory(parsedHistory);
        }
      }
    } catch (e) {
      console.error("Failed to load chat history from local storage:", e);
    }
    setCurrentChatId(null);
  }, []);

  // Save chat history to local storage whenever it changes
  useEffect(() => {
    try {
      if (chatHistory.length > 0) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(chatHistory));
      } else {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    } catch (e) {
      console.error("Failed to save chat history to local storage:", e);
    }
  }, [chatHistory]);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Handle form submission response
  useEffect(() => {
    if (isFormPending) return;

    if (state.message === "Success" && state.data) {
        const lastUserMessageContent = state.data.history.findLast(m => m.role === 'user')?.content[0].text ?? '';
        
        const newUserMessage: ChatMessage = { role: 'user', content: lastUserMessageContent };
        const newAiMessage: ChatMessage = { role: 'model', content: state.data.response };
        
        setChatHistory(prevHistory => {
            if (currentChatId) {
                // Update existing chat
                return prevHistory.map(chat =>
                    chat.id === currentChatId
                        ? { ...chat, messages: [...chat.messages, newUserMessage, newAiMessage] }
                        : chat
                );
            } else {
                // Create new chat
                const newChatId = new Date().toISOString();
                const newChat: ChatThread = {
                    id: newChatId,
                    title: lastUserMessageContent.substring(0, 40) + (lastUserMessageContent.length > 40 ? '...' : ''),
                    messages: [newUserMessage, newAiMessage],
                };
                setCurrentChatId(newChatId);
                return [newChat, ...prevHistory];
            }
        });

        setSymptoms('');
    } else if (state.message && !["Success", "Invalid form data."].includes(state.message)) {
        toast({
            title: "Error",
            description: state.message,
            variant: "destructive",
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, isFormPending]);

  // Scroll to bottom of chat
  useEffect(() => {
    if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, currentChatId, isFormPending, state.data]);


  const handleExampleClick = (symptom: string) => {
    setSymptoms(symptom);
    setTimeout(() => {
      formRef.current?.requestSubmit();
    }, 0);
  }

  const handleNewChat = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setCurrentChatId(null);
    setSymptoms('');
    (formRef.current as HTMLFormElement)?.reset();
  }

  const handleDeleteChat = (idToDelete: string) => {
    setChatHistory(prev => {
        const newHistory = prev.filter(chat => chat.id !== idToDelete);
        if (currentChatId === idToDelete) {
          handleNewChat();
        }
        return newHistory;
      });
  };

  const handleSelectChat = (id: string) => {
    if (isFormPending) return;
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
    }
    const selectedChat = chatHistory.find(chat => chat.id === id);
    if(selectedChat) {
        setCurrentChatId(id);
    }
  }

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        audioChunksRef.current = [];
        stream.getTracks().forEach(track => track.stop()); // Stop the microphone access
        
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          setIsTranscribing(true);
          try {
            const result = await getText(base64Audio);
            if ('text' in result) {
              setSymptoms(prev => prev ? `${prev} ${result.text}` : result.text);
            } else {
              toast({ title: "Transcription Error", description: result.error, variant: "destructive" });
            }
          } catch (error) {
            console.error("Transcription failed:", error);
            toast({ title: "Error", description: "Could not transcribe audio.", variant: "destructive" });
          } finally {
            setIsTranscribing(false);
          }
        };
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Could not start recording:", error);
      toast({ title: "Microphone Error", description: "Could not access microphone. Please check permissions.", variant: "destructive" });
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };


  const currentChat = chatHistory.find(chat => chat.id === currentChatId);
  const currentChatMessages = currentChat?.messages ?? [];
  const historyForForm: GenkitChatHistory = currentChatMessages.map(msg => ({
      role: msg.role,
      content: [{ text: msg.content }]
  }));

  const handleFormAction = (formData: FormData) => {
    if(symptoms.trim() === '') return;
    const genkitHistory = currentChat ? currentChat.messages.map(m => ({role: m.role, content: [{text: m.content}]})) : [];
    formData.set('history', JSON.stringify(genkitHistory));
    formAction(formData);
  };
  
  const userMessageContent = symptoms;

  return (
    <AppLayout
        chatHistory={chatHistory}
        currentChatId={currentChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
    >
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto" ref={chatContainerRef}>
                {currentChatMessages.length === 0 && !isFormPending && !isRecording && !isTranscribing ? (
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
                        {currentChatMessages.map((msg, index) => (
                            <div key={index} className={`flex gap-4 items-start w-full`}>
                                {msg.role === 'model' && <Bot className="h-8 w-8 text-primary flex-shrink-0 rounded-full border p-1" />}
                                 {msg.role === 'user' && <div className="flex-grow"></div>}
                                <div className={`p-3 max-w-[85%] ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-lg' : ''}`}>
                                    {msg.role === 'user' ? <p>{msg.content}</p> : <AIResponse response={msg.content} isStreaming={false} chatHistory={historyForForm} />}
                                </div>
                                {msg.role === 'user' && <User className="h-8 w-8 text-primary flex-shrink-0 rounded-full border p-1" />}
                            </div>
                        ))}
                        {isFormPending && (
                             <div className={`flex gap-4 items-start w-full`}>
                                <div className="flex-grow"></div>
                                <div className={`rounded-lg p-3 max-w-[85%] bg-primary text-primary-foreground`}>
                                    <p>{userMessageContent}</p>
                                </div>
                                <User className="h-8 w-8 text-primary flex-shrink-0 rounded-full border p-1" />
                            </div>
                        )}
                        {isFormPending && (
                            <div className="flex gap-4 items-start justify-start w-full">
                                <Bot className="h-8 w-8 text-primary flex-shrink-0 rounded-full border p-1" />
                                <div className="rounded-lg p-3 max-w-[85%]">
                                    <AIResponse response={null} isStreaming={true} chatHistory={[]} />
                                </div>
                            </div>
                        )}
                       <div className="h-24" />
                    </div>
                )}
            </div>
            
            <div className="px-4 py-4 bg-background/80 backdrop-blur-sm sticky bottom-0">
                <div className="max-w-3xl mx-auto">
                    <form ref={formRef} action={handleFormAction} className="relative">
                        <div className="relative flex items-center">
                            <input type="hidden" name="history" value={JSON.stringify(historyForForm)} />
                            <Textarea
                                id="symptoms"
                                name="symptoms"
                                placeholder={isRecording ? "Recording..." : "Describe your symptoms or record audio..."}
                                className="min-h-[52px] text-base pl-4 pr-24 resize-none"
                                required
                                value={symptoms}
                                onChange={(e) => setSymptoms(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault();
                                      if(!isFormPending) {
                                        formRef.current?.requestSubmit();
                                      }
                                    }
                                }}
                                disabled={isRecording || isTranscribing}
                            />
                            <div className="absolute right-2.5 bottom-2.5 flex gap-1">
                                <SubmitButton />
                                <Button
                                  type="button"
                                  size="icon"
                                  variant={isRecording ? 'destructive' : 'ghost'}
                                  onClick={isRecording ? handleStopRecording : handleStartRecording}
                                  disabled={isFormPending || isTranscribing}
                                  className="h-8 w-8"
                                >
                                  {isTranscribing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : (isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />)}
                                  <span className="sr-only">{isRecording ? "Stop recording" : "Start recording"}</span>
                                </Button>
                            </div>

                        </div>
                        {state.errors?.symptoms && (
                            <p className="text-sm text-destructive mt-1">
                                {state.errors.symptoms[0]}
                            </p>
                        )}
                    </form>
                     <p className="text-xs text-center text-muted-foreground mt-2">
                        HealthNova AI can make mistakes. Consider checking important information.
                    </p>
                </div>
            </div>
        </div>
    </AppLayout>
  );
}
