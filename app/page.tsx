import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Layers, ArrowRight, Shield, Zap, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <Layers className="h-7 w-7 text-primary" />
          <span className="text-xl font-semibold tracking-tight">NoteStack</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild>
            <a href="/login">Log In</a>
          </Button>
          <Button asChild>
            <a href="/signup">Get Started</a>
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-2xl space-y-6">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1]">
            Your thoughts,{" "}
            <span className="text-primary">stacked neatly.</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-md mx-auto leading-relaxed">
            A private, fast, distraction-free notes app. Write what matters and
            find it when you need it.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button size="lg" asChild className="gap-2">
              <a href="/signup">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="/login">Log In</a>
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mt-20 sm:mt-28">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-medium">Private by default</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your notes are encrypted and only accessible to you.
            </p>
          </div>
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-medium">Lightning fast</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Instant load times. No bloat, no waiting.
            </p>
          </div>
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-medium">Distraction-free</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              A clean editor that lets you focus on writing.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-muted-foreground">
        NoteStack &mdash; Your thoughts, stacked neatly.
      </footer>
    </div>
  );
}
