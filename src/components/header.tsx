import { SidebarTrigger } from "@/components/ui/sidebar";

export function Header() {
  return (
    <header className="border-b bg-card sticky top-0 z-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
            <div className="md:hidden">
                <SidebarTrigger />
            </div>
            <div className="hidden md:flex items-center gap-2">
                {/* Desktop: No trigger, title might be here or in sidebar */}
            </div>
        </div>
      </div>
    </header>
  );
}
