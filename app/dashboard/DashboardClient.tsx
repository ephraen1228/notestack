"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, LayoutGrid, List, Heart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { NoteCard } from "@/components/NoteCard";
import { createClient } from "@/lib/supabase/client";
import { sortNotes, stripHtml } from "@/lib/note-utils";
import type { Note } from "@/types/note";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type ViewMode = "grid" | "list";
type FilterMode = "all" | "favorites";

export function DashboardClient({ notes }: { notes: Note[] }) {
  const [search, setSearch] = useState("");
  const [localNotes, setLocalNotes] = useState(notes);
  const [viewMode, setViewMode] = useState<ViewMode>(
    () => (typeof window !== "undefined" && (localStorage.getItem("notestack-view") as ViewMode)) || "grid"
  );
  const [filter, setFilter] = useState<FilterMode>("all");
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const router = useRouter();
  const { toast } = useToast();

  const sorted = useMemo(() => sortNotes(localNotes), [localNotes]);

  const filtered = useMemo(() => {
    let result = sorted;
    if (filter === "favorites") result = result.filter((n) => n.is_favorite);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (n) => n.title.toLowerCase().includes(q) || stripHtml(n.body).toLowerCase().includes(q)
      );
    }
    return result;
  }, [sorted, filter, search]);

  const setView = (mode: ViewMode) => {
    setViewMode(mode);
    if (typeof window !== "undefined") localStorage.setItem("notestack-view", mode);
  };

  const handlePin = async (id: string, pinned: boolean) => {
    const supabase = createClient();
    const { error } = await supabase.from("notes").update({ is_pinned: pinned }).eq("id", id);
    if (error) { toast({ variant: "destructive", description: "Could not update pin." }); return; }
    setLocalNotes((prev) => prev.map((n) => (n.id === id ? { ...n, is_pinned: pinned } : n)));
    toast({ description: pinned ? "Note pinned" : "Note unpinned" });
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("notes").delete().eq("id", id);
    if (error) { toast({ variant: "destructive", description: "Could not delete note." }); return; }
    setLocalNotes((prev) => prev.filter((n) => n.id !== id));
    toast({ description: "Note deleted" });
    router.refresh();
  };

  // ── Drag-and-drop reorder ─────────────────────────────────────────────────
  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("noteId", id);
    setDraggingId(id);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverId(id);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent, targetId: string) => {
      e.preventDefault();
      const draggedId = e.dataTransfer.getData("noteId");
      if (!draggedId || draggedId === targetId) { setDraggingId(null); setDragOverId(null); return; }

      const currentOrder = [...filtered];
      const fromIdx = currentOrder.findIndex((n) => n.id === draggedId);
      const toIdx = currentOrder.findIndex((n) => n.id === targetId);
      if (fromIdx === -1 || toIdx === -1) return;

      const reordered = [...currentOrder];
      const [moved] = reordered.splice(fromIdx, 1);
      reordered.splice(toIdx, 0, moved);

      // Update positions
      const updates = reordered.map((note, i) => ({ id: note.id, note_order: i }));
      setLocalNotes((prev) => {
        const orderMap = new Map(updates.map((u) => [u.id, u.note_order]));
        return prev.map((n) => ({ ...n, note_order: orderMap.get(n.id) ?? n.note_order }));
      });

      const supabase = createClient();
      await Promise.all(
        updates.map(({ id, note_order }) => supabase.from("notes").update({ note_order }).eq("id", id))
      );

      setDraggingId(null);
      setDragOverId(null);
    },
    [filtered]
  );

  const favCount = localNotes.filter((n) => n.is_favorite).length;

  return (
    <>
      {/* Controls bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-11"
          />
        </div>
        <div className="flex items-center gap-2">
          {/* Favorites filter */}
          <Button
            variant={filter === "favorites" ? "default" : "outline"}
            size="sm"
            className="h-11 gap-1.5"
            onClick={() => setFilter(filter === "favorites" ? "all" : "favorites")}
          >
            <Heart className={cn("h-4 w-4", filter === "favorites" && "fill-current")} />
            <span className="hidden sm:inline">Favorites</span>
            {favCount > 0 && (
              <span className="text-xs bg-primary/20 rounded-full px-1.5">{favCount}</span>
            )}
          </Button>

          {/* View toggle */}
          <div className="flex border rounded-md overflow-hidden">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              className="h-11 rounded-none"
              onClick={() => setView("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              className="h-11 rounded-none border-l"
              onClick={() => setView("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Drag hint */}
      {filtered.length > 1 && (
        <p className="text-xs text-muted-foreground/60 mb-3">
          💡 Drag and drop notes to reorder them
        </p>
      )}

      {/* Notes grid/list */}
      <div
        className={cn(
          viewMode === "grid"
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
            : "flex flex-col gap-2"
        )}
      >
        {filtered.map((note) => (
          <div
            key={note.id}
            draggable
            onDragStart={(e) => handleDragStart(e, note.id)}
            onDragOver={(e) => handleDragOver(e, note.id)}
            onDrop={(e) => handleDrop(e, note.id)}
            onDragEnd={() => { setDraggingId(null); setDragOverId(null); }}
            className={cn(
              "transition-all",
              draggingId === note.id && "opacity-50 scale-95",
              dragOverId === note.id && draggingId !== note.id && "ring-2 ring-primary rounded-lg scale-[1.02]",
              viewMode === "list" && "cursor-grab active:cursor-grabbing"
            )}
          >
            <NoteCard
              note={note}
              onPin={handlePin}
              onDelete={handleDelete}
              listMode={viewMode === "list"}
            />
          </div>
        ))}
      </div>

      {search && filtered.length === 0 && (
        <p className="text-center text-muted-foreground py-12">
          No notes match &ldquo;{search}&rdquo;
        </p>
      )}
      {filter === "favorites" && filtered.length === 0 && !search && (
        <p className="text-center text-muted-foreground py-12">
          No favorite notes yet. Heart a note to save it here.
        </p>
      )}
    </>
  );
}