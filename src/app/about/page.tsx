import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <div className="container mx-auto max-w-3xl py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-headline">About MedAid AI</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2 text-muted-foreground">
            <p className="text-lg font-semibold text-foreground">
              Disclaimer: MedAid AI is for informational purposes only.
            </p>
            <p>
              It is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition. In case of an emergency, call your local emergency services immediately.
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>
              &copy; {new Date().getFullYear()} MedAid AI. All Rights Reserved.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
