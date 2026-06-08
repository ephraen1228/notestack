import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-background text-center">
      <h1 className="text-6xl font-bold text-muted-foreground/30 mb-4">404</h1>
      <p className="text-lg font-medium mb-2">This page doesn&apos;t exist.</p>
      <p className="text-sm text-muted-foreground mb-8">
        The page you&apos;re looking for couldn&apos;t be found.
      </p>
      <Button variant="outline" asChild className="gap-2">
        <a href="/dashboard">
          <ArrowLeft className="h-4 w-4" />
          Back to notes
        </a>
      </Button>
    </div>
  );
}
