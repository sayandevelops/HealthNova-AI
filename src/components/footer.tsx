
export function Footer() {
  return (
    <footer className="bg-muted/50 mt-auto">
      <div className="container mx-auto px-4 py-6 text-center text-muted-foreground">
        <p className="text-sm font-semibold">
          Disclaimer: HealthNova AI is for informational purposes only.
        </p>
        <p className="text-xs mt-1">
          It is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition. In case of an emergency, call your local emergency services immediately.
        </p>
        <p className="text-xs mt-4">
          &copy; {new Date().getFullYear()} HealthNova AI. All Rights Reserved.
        </p>
        <p className="text-xs mt-2">
          Made by <a href="https://github.com/sayandevelops" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">sayandevelops</a>
        </p>
      </div>
    </footer>
  );
}
