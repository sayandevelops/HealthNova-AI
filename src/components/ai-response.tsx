
"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Leaf, Volume2, LoaderCircle } from "lucide-react";
import { getAudio } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";

type AIResponseProps = {
  response: string | null;
  isStreaming?: boolean;
  chatHistory: { role: 'user' | 'model', content: string }[];
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
  };

  useEffect(() => {
    // Cleanup function to stop audio when component unmounts
    return () => {
      if (audioState === 'playing') {
        stopAudio();
      }
    };
  }, [audioState]);


  const handlePlayAudio = async () => {
    if (audioState === 'loading') return;

    if (audioState === 'playing') {
        stopAudio();
        setAudioState('idle');
        return;
    }
    
    // Stop any currently playing audio before starting a new one
    stopAudio();

    if (!response) return;

    setAudioState('loading');
    try {
      const result = await getAudio(response);
      if ('error' in result) {
        throw new Error(result.error);
      }
      
      const audio = audioRef.current || new Audio();
      audio.src = result.audio;
      audio.play();
      setAudioState('playing');

      audio.onended = () => {
        setAudioState('idle');
      };

      audio.onpause = () => {
        if (audio.currentTime > 0 && !audio.ended) {
          setAudioState('idle');
        }
      }
      
      if (!audioRef.current) {
        audioRef.current = audio;
      }

    } catch (error) {
      console.error(error);
      toast({
        title: "Audio Error",
        description: "Could not generate audio for this message.",
        variant: "destructive",
      });
      setAudioState('idle');
    }
  };

  if (isStreaming) {
    return (
       <div className="flex items-center space-x-2">
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
          <ol key={`list-${elements.length}`} className="list-decimal list-outside space-y-2 my-4 pl-5 text-foreground/90">
            {listItems.map((item, idx) => <li key={idx} className="pl-2">{item}</li>)}
          </ol>
        );
        listItems = [];
      }
    };
    
    const disclaimerRegex = /^(?:\d+\.\s*)?(?:\*\*)?Disclaimer(?:\*\*)?:/i;
  
    lines.forEach((line, index) => {
      if (disclaimerRegex.test(line)) {
        flushList();
        elements.push(
          <div key={index} className="my-4 flex items-start gap-3 rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-3 text-sm text-yellow-700 dark:text-yellow-400">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <p className="font-semibold">{line.replace(disclaimerRegex, 'Disclaimer:')}</p>
          </div>
        );
      } else if (line.match(/^\d+\.\s*/) || line.match(/^\s*-\s*/) || line.match(/^\s*\*\s*/)) {
          listItems.push(line.replace(/^\d+\.\s*|^\s*-\s*|^\s*\*\s*/, ''));
      } else {
        flushList();
        if (line.startsWith('⚠️')) {
          elements.push(
            <div key={index} className="my-4 flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-destructive text-sm">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <p className="font-semibold">{line.replace('⚠️', '').trim()}</p>
            </div>
          );
        } else if (line.startsWith('🌿 Ayurvedic Tip:')) {
          elements.push(
            <div key={index} className="my-4 flex items-start gap-3 rounded-lg bg-accent/20 p-3 text-accent-foreground border border-accent/50 text-sm">
               <Leaf className="h-5 w-5 flex-shrink-0 mt-0.5 text-accent" />
              <p className="font-medium">{line.replace('🌿 Ayurvedic Tip:', '').trim()}</p>
            </div>
          );
        } else if (line.startsWith('**') && line.endsWith('**')) {
           elements.push(<h3 key={index} className="font-bold text-lg mt-4 mb-2">{line.replace(/\*\*/g, '')}</h3>);
        } else {
           elements.push(<p key={index} className="my-2">{line.replace(/\*\*/g, '')}</p>);
        }
      }
    });
  
    flushList();
  
    return elements;
  };
  
  const isCardWrapped = chatHistory.length === 0;
  
  const content = (
    <div className="space-y-4">
      <div className="flex justify-start mb-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePlayAudio}
          aria-label={audioState === 'playing' ? 'Stop audio' : 'Play audio'}
          disabled={audioState === 'loading'}
          className="h-8 w-8"
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

  if (isCardWrapped) {
    return (
        <Card className="mt-8 animate-in fade-in-50 duration-500">
          <CardHeader>
            <CardTitle className="text-2xl font-headline">AI Generated Advice</CardTitle>
          </CardHeader>
          <CardContent>
            {content}
          </CardContent>
        </Card>
      );
  }

  return content;
}
