import { SidebarTrigger } from "@/components/ui/sidebar";
import { LifeBuoy } from "lucide-react";

export function Header() {
  return (
    <header className="border-b bg-card sticky top-0 z-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center">
            <div className="md:hidden">
                <SidebarTrigger />
            </div>
            <div className="flex-1 flex justify-center items-center md:hidden">
                <div className="flex items-center gap-2">
                    <LifeBuoy className="h-8 w-8 text-primary" />
                    <span className="text-2xl font-bold tracking-tight font-headline">
                    HealthNova AI
                    </span>
                </div>
            </div>
            <div className="md:hidden w-8">
                {/* Spacer to balance the trigger button */}
            </div>
        </div>
      </div>
    </header>
  );
}
