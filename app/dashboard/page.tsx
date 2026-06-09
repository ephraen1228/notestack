import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import { Plus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardClient } from "./DashboardClient";
import type { Note } from "@/types/note";

function normalizeNotes(raw: Record<string, unknown>[]): Note[] {
  return raw.map((n) => ({
    id: n.id as string,
    user_id: n.user_id as string,
    title: n.title as string,
    body: (n.body as string) ?? "",
    color: (n.color as string | null) ?? null,
    is_pinned: Boolean(n.is_pinned),
    is_favorite: Boolean(n.is_favorite),
    note_style: (n.note_style as string) ?? "blank",
    note_type: (n.note_type as "note" | "todo") ?? "note",
    note_order: (n.note_order as number) ?? 0,
    created_at: n.created_at as string,
    updated_at: n.updated_at as string,
  }));
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: notes } = await supabase
    .from("notes")
    .select("*")
    .order("is_pinned", { ascending: false })
    .order("updated_at", { ascending: false });

  const allNotes = normalizeNotes(notes ?? []);

  return (
    <div className="min-h-screen bg-background pb-safe">
      <Header email={user.email ?? ""} />
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
            Your Notes
          </h1>
          <Button asChild className="gap-2 w-full sm:w-auto h-11">
            <a href="/notes/new">
              <Plus className="h-4 w-4" />
              New Note
            </a>
          </Button>
        </div>

        {allNotes.length > 0 ? (
          <DashboardClient notes={allNotes} />
        ) : (
          <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center px-4">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-medium mb-1">No notes yet</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              Create your first note and start stacking your thoughts.
            </p>
            <Button asChild className="gap-2 h-11">
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
