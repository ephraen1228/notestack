"use client";

import { useState } from "react";
import { LogOut, Layers, Menu, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function Header({ email }: { email: string }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 sm:h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <a
          href="/dashboard"
          className="flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity"
        >
          <Layers className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold tracking-tight">NoteStack</span>
        </a>

        {/* Desktop */}
        <div className="hidden sm:flex items-center gap-3">
          <span className="text-sm text-muted-foreground truncate max-w-[200px]">
            {email}
          </span>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-1.5" />
            Log Out
          </Button>
        </div>

        {/* Mobile menu */}
        <Button
          variant="ghost"
          size="icon"
          className="sm:hidden h-10 w-10"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {menuOpen && (
        <div className="sm:hidden border-t border-border px-4 py-3 space-y-3 bg-background">
          <p className="text-sm text-muted-foreground truncate">{email}</p>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Log Out
          </Button>
        </div>
      )}
    </header>
  );
}
