"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowLeft,
  Loader2,
  Check,
  MoreVertical,
  Pin,
  PinOff,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NoteEditor } from "@/components/NoteEditor";
import { NotesSidebar } from "@/components/NotesSidebar";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { AutoSaveIndicator } from "@/components/AutoSaveIndicator";
import { useAutoSaveNote } from "@/hooks/use-auto-save-note";
import { useToast } from "@/hooks/use-toast";
import { sortNotes } from "@/lib/note-utils";
import type { Note } from "@/types/note";

function normalizeNote(raw: Record<string, unknown>): Note {
  return {
    id: raw.id as string,
    user_id: raw.user_id as string,
    title: raw.title as string,
    body: (raw.body as string) ?? "",
    color: (raw.color as string | null) ?? null,
    is_pinned: Boolean(raw.is_pinned),
    created_at: raw.created_at as string,
    updated_at: raw.updated_at as string,
  };
}

export default function NoteDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { toast } = useToast();

  const [note, setNote] = useState<Note | null>(null);
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [color, setColor] = useState<string | null>(null);
  const [isPinned, setIsPinned] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);

  const { status: autoSaveStatus, markSaved } = useAutoSaveNote({
    noteId: id,
    title,
    body,
    color,
    isPinned,
    enabled: autoSaveEnabled && !loading,
  });

  const fetchNotes = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const [{ data: noteData }, { data: allData }] = await Promise.all([
      supabase.from("notes").select("*").eq("id", id).single(),
      supabase.from("notes").select("*"),
    ]);

    if (!noteData || noteData.user_id !== user.id) {
      router.push("/dashboard");
      return;
    }

    const normalized = normalizeNote(noteData);
    setNote(normalized);
    setTitle(normalized.title);
    setBody(normalized.body);
    setColor(normalized.color);
    setIsPinned(normalized.is_pinned);
    setAllNotes(sortNotes((allData ?? []).map(normalizeNote)));
    setLoading(false);
  }, [id, router]);

  useEffect(() => {
    if (!loading && note) {
      markSaved({
        title: note.title,
        body: note.body,
        color: note.color,
        isPinned: note.is_pinned,
      });
      setAutoSaveEnabled(true);
    }
  }, [loading, note, markSaved]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleSave = async (redirectToDashboard = false) => {
    if (!title.trim()) return;
    setSaving(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("notes")
      .update({
        title: title.trim(),
        body,
        color,
        is_pinned: isPinned,
      })
      .eq("id", id);

    setSaving(false);

    if (error) {
      toast({ variant: "destructive", description: "Could not save note." });
      return;
    }

    markSaved({ title, body, color, isPinned });
    toast({ description: "Note saved" });

    if (redirectToDashboard) {
      router.push("/dashboard");
    }
  };

  const handlePin = async (noteId: string, pinned: boolean) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("notes")
      .update({ is_pinned: pinned })
      .eq("id", noteId);

    if (error) {
      toast({ variant: "destructive", description: "Could not update pin." });
      return;
    }

    if (noteId === id) {
      setIsPinned(pinned);
      markSaved({ title, body, color, isPinned: pinned });
    }
    setAllNotes((prev) =>
      sortNotes(
        prev.map((n) => (n.id === noteId ? { ...n, is_pinned: pinned } : n))
      )
    );
    toast({ description: pinned ? "Note pinned" : "Note unpinned" });
  };

  const handleDelete = async (noteId?: string) => {
    const targetId = noteId ?? id;
    setDeleting(true);

    const supabase = createClient();
    await supabase.from("notes").delete().eq("id", targetId);

    setDeleting(false);

    if (targetId === id) {
      router.push("/dashboard");
    } else {
      setAllNotes((prev) => prev.filter((n) => n.id !== targetId));
      toast({ description: "Note deleted" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const timeAgo = note
    ? formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })
    : "";

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
          <div className="mx-auto max-w-3xl flex items-center justify-between gap-2 px-3 sm:px-6 h-14">
            <a
              href="/dashboard"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </a>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <AutoSaveIndicator status={autoSaveStatus} />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handlePin(id, !isPinned)}>
                    {isPinned ? (
                      <>
                        <PinOff className="h-4 w-4 mr-2" />
                        Unpin
                      </>
                    ) : (
                      <>
                        <Pin className="h-4 w-4 mr-2" />
                        Pin to top
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setDeleteOpen(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSave(true)}
                disabled={!title.trim() || saving}
                className="h-9"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Check className="h-4 w-4 sm:mr-1.5" />
                    <span className="hidden sm:inline">Done</span>
                  </>
                )}
              </Button>
              <Button
                onClick={() => handleSave(false)}
                disabled={!title.trim() || saving}
                size="sm"
                className="h-9"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 mx-auto w-full max-w-3xl px-3 sm:px-6 py-4 sm:py-8">
          <NoteEditor
            title={title}
            body={body}
            color={color}
            onTitleChange={setTitle}
            onBodyChange={setBody}
            onColorChange={setColor}
          />
          {timeAgo && (
            <p className="mt-4 text-xs text-muted-foreground/70">
              Last updated {timeAgo}
            </p>
          )}
        </div>
      </div>

      <NotesSidebar
        notes={allNotes}
        currentId={id}
        onPin={handlePin}
        onDelete={handleDelete}
      />

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={() => handleDelete()}
        loading={deleting}
      />
    </div>
  );
}
