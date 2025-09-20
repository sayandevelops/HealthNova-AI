
import { SymptomChecker } from "@/components/symptom-checker";

export default function Home() {
  return (
    <div className="flex flex-col h-full bg-background">
      <main className="flex-1 w-full">
        <SymptomChecker />
      </main>
    </div>
  );
}

    