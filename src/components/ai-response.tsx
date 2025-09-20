
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Leaf } from "lucide-react";

type AIResponseProps = {
  response: string | null;
  isStreaming?: boolean;
  chatHistory: { role: 'user' | 'model', content: { text: string }[] | string }[];
};

export function AIResponse({ response, isStreaming = false, chatHistory }: AIResponseProps) {

  if (isStreaming) {
    return (
       <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-full" />
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
      <div className="prose prose-blue max-w-none text-base leading-relaxed">
        {renderContent()}
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
