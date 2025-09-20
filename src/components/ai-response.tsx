
"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, Leaf, Volume2, LoaderCircle } from "lucide-react";
import { getAudio } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import type { ChatHistory as GenkitChatHistory } from "@/ai/flows/symptom-checker";

type AIResponseProps = {
  response: string | null;
  isStreaming?: boolean;
  chatHistory: GenkitChatHistory;
  audioRef: React.MutableRefObject<HTMLAudioElement | null>;
};

export function AIResponse({ response, isStreaming = false, chatHistory, audioRef }: AIResponseProps) {
  const [audioState, setAudioState] = useState<'idle' | 'loading' | 'playing'>('idle');
  const { toast } = useToast();

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setAudioState('idle');
  };

  useEffect(() => {
    // Cleanup function to stop audio when component unmounts or response changes
    return () => {
      stopAudio();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  const handlePlayAudio = async () => {
    if (audioState === 'loading') return;

    if (audioState === 'playing') {
      stopAudio();
      return;
    }

    if (!response) return;

    setAudioState('loading');
    try {
      const result = await getAudio(response);

      if ('error' in result) {
        throw new Error(result.error);
      }

      if (!audioRef.current) {
        audioRef.current = new Audio();
        audioRef.current.onended = () => {
          setAudioState('idle');
        };
      }
      
      audioRef.current.src = result.audio;
      setAudioState('playing');
      audioRef.current.play().catch(e => {
        console.error("Audio play failed:", e);
        toast({ title: "Audio Error", description: "Could not play audio.", variant: "destructive" });
        stopAudio();
      });

    } catch (error) {
      console.error(error);
      toast({
        title: "Audio Error",
        description: error instanceof Error ? error.message : "Could not generate audio for this message.",
        variant: "destructive",
      });
      stopAudio();
    }
  };


  if (isStreaming) {
    return (
       <div className="flex items-center space-x-2 p-4">
          <span className="h-2 w-2 bg-primary rounded-full animate-typing-bounce [animation-delay:-0.32s]"></span>
          <span className="h-2 w-2 bg-primary rounded-full animate-typing-bounce [animation-delay:-0.16s]"></span>
          <span className="h-2 w-2 bg-primary rounded-full animate-typing-bounce"></span>
        </div>
    );
  }

  if (!response) {
    return null;
  }
  
  const renderContent = () => {
    const lines = response.split('\n').filter(line => line.trim() !== '');
    const elements: JSX.Element[] = [];
    let listItems: string[] = [];
  
    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="list-disc list-outside space-y-2 my-4 pl-6 text-foreground/90">
            {listItems.map((item, idx) => (
              <li key={idx} className="pl-2" dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}></li>
            ))}
          </ul>
        );
        listItems = [];
      }
    };
  
    const disclaimerRegex = /^(?:\*\*)?Disclaimer(?:\*\*)?:\s*/i;
    const headingRegex = /^\*\*(.*?)\*\*$/;
  
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
  
      if (disclaimerRegex.test(trimmedLine)) {
        flushList();
        elements.push(
          <div key={index} className="my-4 flex items-start gap-3 rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4 text-sm text-yellow-700 dark:text-yellow-400">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <p className="font-semibold">{trimmedLine.replace(disclaimerRegex, '')}</p>
          </div>
        );
      } else if (trimmedLine.startsWith('⚠️')) {
        flushList();
        elements.push(
          <div key={index} className="my-4 flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive text-base">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <p className="font-bold">{trimmedLine.replace('⚠️', '').trim()}</p>
          </div>
        );
      } else if (trimmedLine.startsWith('🌿 Ayurvedic Tip:')) {
        flushList();
        elements.push(
          <div key={index} className="my-4 flex items-start gap-3 rounded-lg bg-accent/20 p-4 border border-accent/50 text-sm">
             <Leaf className="h-5 w-5 flex-shrink-0 mt-0.5 text-accent" />
            <p className="font-medium text-accent-foreground/90" dangerouslySetInnerHTML={{ __html: trimmedLine.replace('🌿 Ayurvedic Tip:', '').trim().replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}></p>
          </div>
        );
      } else if (headingRegex.test(trimmedLine)) {
        flushList();
        const headingText = (trimmedLine.match(headingRegex) as string[])[1];
        elements.push(<h3 key={index} className="font-bold text-lg mt-5 mb-2">{headingText}</h3>);
      } else if (trimmedLine.match(/^\d+\.\s*/) || trimmedLine.match(/^\s*-\s*/) || trimmedLine.match(/^\s*\*\s*/)) {
        listItems.push(trimmedLine.replace(/^\d+\.\s*|^\s*-\s*|^\s*\*\s*/, ''));
      } else {
        flushList();
        elements.push(<p key={index} className="my-2" dangerouslySetInnerHTML={{ __html: trimmedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}></p>);
      }
    });
  
    flushList();
  
    return elements;
  };
    
  return (
    <div className="space-y-4">
      <div className="flex justify-start mb-2">
        <Button
          size="icon"
          variant="ghost"
          onClick={handlePlayAudio}
          aria-label={audioState === 'playing' ? 'Stop audio' : 'Play audio'}
          disabled={audioState === 'loading'}
          className="h-8 w-8 text-primary hover:bg-primary/10"
        >
          {audioState === 'loading' && <LoaderCircle className="h-5 w-5 animate-spin" />}
          {audioState !== 'loading' && <Volume2 className="h-5 w-5" />}
        </Button>
      </div>
      <div className="prose prose-blue max-w-none text-base leading-relaxed">
        {renderContent()}
      </div>
    </div>
  );
}
