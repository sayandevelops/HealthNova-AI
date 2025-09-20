
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Home, Info, LifeBuoy, Menu, Plus, MessageSquare } from 'lucide-react';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-card text-card-foreground">
      <div className="p-4 border-b">
        <Button variant="outline" className="w-full justify-start gap-2">
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-2">
        <Link
          href="/"
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-muted ${
            pathname === '/' ? 'bg-muted' : ''
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          Chat History
        </Link>
        <Link
          href="/about"
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-muted ${
            pathname === '/about' ? 'bg-muted' : ''
          }`}
        >
          <Info className="h-4 w-4" />
          About
        </Link>
      </nav>
      <div className="mt-auto p-4 border-t">
        <div className="flex items-center gap-3">
          <LifeBuoy className="h-8 w-8 text-primary" />
          <div>
            <p className="text-lg font-bold tracking-tight font-headline">
              HealthNova AI
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-background">
      <div className="hidden md:flex md:w-[var(--sidebar-width)] md:flex-col md:fixed md:inset-y-0">
        {sidebarContent}
      </div>
      <div className="flex flex-col flex-1 md:pl-[var(--sidebar-width)]">
        <header className="flex h-14 items-center gap-4 border-b bg-card px-4 md:hidden sticky top-0 z-30">
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[var(--sidebar-width)]">
              {sidebarContent}
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2 font-semibold">
             <LifeBuoy className="h-6 w-6 text-primary" />
            <span className="font-headline">HealthNova AI</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
