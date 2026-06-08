"use client";

import { LogOut, Layers } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function Header({ email }: { email: string }) {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <a href="/dashboard" className="flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity">
          <Layers className="h-6 w-6" />
          <span className="text-lg font-semibold tracking-tight">NoteStack</span>
        </a>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-sm text-muted-foreground truncate max-w-[200px]">
            {email}
          </span>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-1.5" />
            Log Out
          </Button>
        </div>
      </div>
    </header>
  );
}
