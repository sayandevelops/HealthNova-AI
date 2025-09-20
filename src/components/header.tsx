
import { LifeBuoy } from "lucide-react";

export function Header() {
  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-center">
          <div className="flex items-center gap-2">
            <LifeBuoy className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold tracking-tight font-headline">
              MedAid AI
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
