"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { NoteCard } from "@/components/NoteCard";
import type { Note } from "@/types/note";

export function DashboardClient({ notes }: { notes: Note[] }) {
  const [search, setSearch] = useState("");

  const filtered = search
    ? notes.filter((n) =>
        n.title.toLowerCase().includes(search.toLowerCase())
      )
    : notes;

  return (
    <>
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 max-w-sm"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((note) => (
          <NoteCard key={note.id} note={note} />
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
