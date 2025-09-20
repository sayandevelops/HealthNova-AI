
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Leaf } from "lucide-react";
import { useFormStatus } from "react-dom";

type AIResponseProps = {
  response: string | null;
};

export function AIResponse({ response }: AIResponseProps) {
  const { pending } = useFormStatus();

  if (pending) {
    return (
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-8 w-48" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/6" />
        </CardContent>
      </Card>
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
  
    lines.forEach((line, index) => {
      if (line.match(/^\d+\.\s*/) || line.match(/^\s*-\s*/) || line.match(/^\s*\*\s*/)) {
        listItems.push(line.replace(/^\d+\.\s*|^\s*-\s*|^\s*\*\s*/, ''));
      } else {
        flushList();
        if (line.startsWith('⚠️')) {
          elements.push(
            <div key={index} className="my-4 flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <p className="font-semibold">{line.replace('⚠️', '').trim()}</p>
            </div>
          );
        } else if (line.startsWith('🌿 Ayurvedic Tip:')) {
          elements.push(
            <div key={index} className="my-4 flex items-start gap-3 rounded-lg bg-accent/20 p-4 text-accent-foreground border border-accent/50">
               <Leaf className="h-5 w-5 flex-shrink-0 mt-0.5 text-accent" />
              <p className="font-medium">{line.replace('🌿 Ayurvedic Tip:', '').trim()}</p>
            </div>
          );
        } else if (line.toLowerCase().startsWith('disclaimer:')) {
          elements.push(<p key={index} className="text-xs text-muted-foreground mt-6 italic">{line}</p>);
        } else {
          elements.push(<p key={index} className="font-semibold text-lg my-4 text-foreground">{line}</p>);
        }
      }
    });
  
    flushList(); // Make sure to render any remaining list items
  
    return elements;
  };
  

  return (
    <Card className="mt-8 animate-in fade-in-50 duration-500">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">AI Generated Advice</CardTitle>
      </CardHeader>
      <CardContent className="prose prose-blue max-w-none text-base">
        {renderContent()}
      </CardContent>
    </Card>
  );
}
