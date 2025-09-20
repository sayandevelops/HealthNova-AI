
'use client';

import { useState, Children, isValidElement, cloneElement, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { LifeBuoy, Menu, MessageSquare, Info, Trash2 } from 'lucide-react';
import type { ChatThread } from './symptom-checker';

type AppLayoutProps = {
    children: React.ReactNode;
    chatHistory?: ChatThread[];
    currentChatId?: string | null;
    onSelectChat?: (id: string) => void;
    onNewChat?: () => void;
    onDeleteChat?: (id: string) => void;
};

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const child = Children.only(children);
  const layoutProps = useMemo(() => {
    if (isValidElement(child) && typeof child.props.datAappLayouTprops === 'string') {
      try {
        return JSON.parse(child.props.datAappLayouTprops);
      } catch (e) {
        // ignore
      }
    }
    return {} as AppLayoutProps;
  }, [child]);

  const { chatHistory = [], currentChatId, onSelectChat, onNewChat, onDeleteChat } = layoutProps;

  const handleSelectChat = (id: string) => {
    onSelectChat?.(id);
    setIsSidebarOpen(false);
  }

  const handleNewChat = () => {
    onNewChat?.();
    setIsSidebarOpen(false);
  }
  
  const sidebarContent = (
    <div className="flex flex-col h-full bg-card text-card-foreground">
      <div className="p-4 border-b">
        <Button variant="outline" className="w-full justify-start gap-2" onClick={handleNewChat}>
          <MessageSquare className="h-4 w-4" />
          New Chat
        </Button>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 py-2 text-xs font-semibold text-muted-foreground">Chat History</p>
        {chatHistory.map((chat: ChatThread) => (
          <div key={chat.id} className="flex items-center group">
            <Button
              variant={currentChatId === chat.id ? "secondary" : "ghost"}
              className="w-full justify-start gap-2 truncate"
              onClick={() => handleSelectChat(chat.id)}
            >
              <span className='flex-1 truncate'>{chat.title}</span>
            </Button>
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100"
                onClick={(e) => {
                    e.stopPropagation();
                    onDeleteChat?.(chat.id);
                }}
                >
                <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {chatHistory.length === 0 && (
            <p className="px-3 text-sm text-muted-foreground">No chats yet.</p>
        )}
      </nav>
      <div className="mt-auto p-4 border-t space-y-2">
         <Link
          href="/about"
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-muted ${
            pathname === '/about' ? 'bg-muted' : ''
          }`}
          onClick={() => setIsSidebarOpen(false)}
        >
          <Info className="h-4 w-4" />
          About
        </Link>
        <div className="flex items-center gap-3">
          <LifeBuoy className="h-8 w-8 text-primary" />
          <div>
            <p className="text-lg font-bold tracking-tight font-headline">
              MedAid AI
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const childWithProps = isValidElement(child) ? cloneElement(child, {
    chatHistory,
    currentChatId,
    onSelectChat,
    onNewChat,
    onDeleteChat
  } as any) : child;

  return (
    <div className="flex h-screen w-full bg-background">
      <div className="flex flex-col flex-1">
        <header className="flex h-14 items-center gap-4 border-b bg-card px-4 sticky top-0 z-30">
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[var(--sidebar-width)] z-50">
              {sidebarContent}
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2 font-semibold">
             <LifeBuoy className="h-6 w-6 text-primary" />
            <span className="font-headline">MedAid AI</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">{childWithProps}</main>
      </div>
    </div>
  );
}
