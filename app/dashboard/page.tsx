import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import { NoteCard } from "@/components/NoteCard";
import { Plus, Search, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: notes } = await supabase
    .from("notes")
    .select("*")
    .order("updated_at", { ascending: false });

  const allNotes = notes ?? [];

  return (
    <div className="min-h-screen bg-background">
      <Header email={user.email ?? ""} />
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Your Notes</h1>
          <Button asChild className="gap-2">
            <a href="/notes/new">
              <Plus className="h-4 w-4" />
              New Note
            </a>
          </Button>
        </div>

        {allNotes.length > 0 ? (
          <DashboardClient notes={allNotes} />
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-medium mb-1">No notes yet</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              Create your first note and start stacking your thoughts.
            </p>
            <Button asChild className="gap-2">
              <a href="/notes/new">
                <Plus className="h-4 w-4" />
                Create your first note
              </a>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
