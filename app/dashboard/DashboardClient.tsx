"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { NoteCard } from "@/components/NoteCard";
import { createClient } from "@/lib/supabase/client";
import { sortNotes, stripHtml } from "@/lib/note-utils";
import type { Note } from "@/types/note";
import { useToast } from "@/hooks/use-toast";

export function DashboardClient({ notes }: { notes: Note[] }) {
  const [search, setSearch] = useState("");
  const [localNotes, setLocalNotes] = useState(notes);
  const router = useRouter();
  const { toast } = useToast();

  const sorted = useMemo(() => sortNotes(localNotes), [localNotes]);

  const filtered = search
    ? sorted.filter((n) => {
        const q = search.toLowerCase();
        return (
          n.title.toLowerCase().includes(q) ||
          stripHtml(n.body).toLowerCase().includes(q)
        );
      })
    : sorted;

  const handlePin = async (id: string, pinned: boolean) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("notes")
      .update({ is_pinned: pinned })
      .eq("id", id);

    if (error) {
      toast({
        variant: "destructive",
        description: "Could not update pin. Run the database migration.",
      });
      return;
    }

    setLocalNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_pinned: pinned } : n))
    );
    toast({ description: pinned ? "Note pinned" : "Note unpinned" });
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("notes").delete().eq("id", id);

    if (error) {
      toast({ variant: "destructive", description: "Could not delete note." });
      return;
    }

    setLocalNotes((prev) => prev.filter((n) => n.id !== id));
    toast({ description: "Note deleted" });
    router.refresh();
  };

  return (
    <>
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 w-full sm:max-w-sm h-11"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {filtered.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            onPin={handlePin}
            onDelete={handleDelete}
          />
        ))}
      </div>
      {search && filtered.length === 0 && (
        <p className="text-center text-muted-foreground py-12">
          No notes match &ldquo;{search}&rdquo;
        </p>
      )}
    </>
  );
}
