"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowLeft, Loader2, Check, MoreVertical, Pin, PinOff, Trash2,
  Eye, Edit3, Heart, Printer, Search, FunctionSquare, CheckSquare,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NoteEditor } from "@/components/NoteEditor";
import { NotesSidebar } from "@/components/NotesSidebar";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { AutoSaveIndicator } from "@/components/AutoSaveIndicator";
import { FindInNote } from "@/components/FindInNote";
import { NoteStylePicker } from "@/components/NoteStylePicker";
import { ExportMenu } from "@/components/ExportMenu";
import { TodoNote } from "@/components/TodoNote";
import { useAutoSaveNote } from "@/hooks/use-auto-save-note";
import { useToast } from "@/hooks/use-toast";
import { sortNotes, isLightColor, getNoteStyleTemplate } from "@/lib/note-utils";
import type { Note } from "@/types/note";
import { cn } from "@/lib/utils";

// Simple math evaluator
function evalMath(expr: string): string {
  try {
    const sanitized = expr.replace(/[^0-9+\-*/().%, ]/g, "").trim();
    if (!sanitized) return "";
    // eslint-disable-next-line no-new-func
    const result = new Function(`return ${sanitized}`)();
    if (typeof result === "number" && !isNaN(result)) return String(result);
    return "Invalid";
  } catch {
    return "Error";
  }
}

function normalizeNote(raw: Record<string, unknown>): Note {
  return {
    id: raw.id as string,
    user_id: raw.user_id as string,
    title: raw.title as string,
    body: (raw.body as string) ?? "",
    color: (raw.color as string | null) ?? null,
    is_pinned: Boolean(raw.is_pinned),
    is_favorite: Boolean(raw.is_favorite),
    note_style: (raw.note_style as string) ?? "blank",
    note_type: (raw.note_type as "note" | "todo") ?? "note",
    note_order: (raw.note_order as number) ?? 0,
    created_at: raw.created_at as string,
    updated_at: raw.updated_at as string,
  };
}

export default function NoteDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { toast } = useToast();
  const editorRef = useRef<HTMLDivElement>(null);

  const [note, setNote] = useState<Note | null>(null);
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [color, setColor] = useState<string | null>(null);
  const [isPinned, setIsPinned] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [noteStyle, setNoteStyle] = useState("blank");
  const [noteType, setNoteType] = useState<"note" | "todo">("note");

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);

  // UI state
  const [readMode, setReadMode] = useState(false);
  const [findOpen, setFindOpen] = useState(false);
  const [mathMode, setMathMode] = useState(false);
  const [mathExpr, setMathExpr] = useState("");
  const [mathResult, setMathResult] = useState("");

  const { status: autoSaveStatus, markSaved } = useAutoSaveNote({
    noteId: id,
    title,
    body,
    color,
    isPinned,
    enabled: autoSaveEnabled && !loading && noteType === "note",
  });

  const fetchNotes = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

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
    setIsFavorite(normalized.is_favorite);
    setNoteStyle(normalized.note_style);
    setNoteType(normalized.note_type);
    setAllNotes(sortNotes((allData ?? []).map(normalizeNote)));
    setLoading(false);
  }, [id, router]);

  useEffect(() => {
    if (!loading && note) {
      markSaved({ title: note.title, body: note.body, color: note.color, isPinned: note.is_pinned });
      setAutoSaveEnabled(true);
    }
  }, [loading, note, markSaved]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Keyboard shortcut: Ctrl+F for find
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        setFindOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleSave = async (redirectToDashboard = false) => {
    if (!title.trim()) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("notes").update({
      title: title.trim(), body, color,
      is_pinned: isPinned, is_favorite: isFavorite,
      note_style: noteStyle, note_type: noteType,
    }).eq("id", id);
    setSaving(false);
    if (error) { toast({ variant: "destructive", description: "Could not save note." }); return; }
    markSaved({ title, body, color, isPinned });
    toast({ description: "Note saved" });
    if (redirectToDashboard) router.push("/dashboard");
  };

  const handleFavorite = async () => {
    const next = !isFavorite;
    setIsFavorite(next);
    const supabase = createClient();
    await supabase.from("notes").update({ is_favorite: next }).eq("id", id);
    toast({ description: next ? "Added to favorites ❤️" : "Removed from favorites" });
  };

  const handlePin = async (noteId: string, pinned: boolean) => {
    const supabase = createClient();
    const { error } = await supabase.from("notes").update({ is_pinned: pinned }).eq("id", noteId);
    if (error) { toast({ variant: "destructive", description: "Could not update pin." }); return; }
    if (noteId === id) { setIsPinned(pinned); markSaved({ title, body, color, isPinned: pinned }); }
    setAllNotes((prev) => sortNotes(prev.map((n) => (n.id === noteId ? { ...n, is_pinned: pinned } : n))));
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

  const handleApplyStyle = async (style: string, template: string | null) => {
    setNoteStyle(style);
    if (template) {
      if (body.trim() && !confirm("This template will replace your current note content. Continue?")) return;
      const templateTitle = style.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
      setTitle(templateTitle);
      setBody(template);
    }
    const supabase = createClient();
    await supabase.from("notes").update({ note_style: style }).eq("id", id);
    toast({ description: "Style applied" });
  };

  const handleApplyStyleToAll = async (style: string) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("notes").update({ note_style: style }).eq("user_id", user.id);
    setNoteStyle(style);
    setAllNotes((prev) => prev.map((n) => ({ ...n, note_style: style })));
    toast({ description: "Style applied to all notes" });
  };

  const handleToggleTodo = async () => {
    const next = noteType === "note" ? "todo" : "note";
    setNoteType(next);
    const supabase = createClient();
    await supabase.from("notes").update({ note_type: next }).eq("id", id);
    toast({ description: next === "todo" ? "Switched to To-do mode" : "Switched to Note mode" });
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const timeAgo = note ? formatDistanceToNow(new Date(note.updated_at), { addSuffix: true }) : "";
  const light = isLightColor(color);

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Print stylesheet */}
      <style>{`@media print{.no-print{display:none!important}.print-content{display:block!important}}`}</style>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm no-print">
          <div className="mx-auto max-w-3xl flex items-center justify-between gap-2 px-3 sm:px-6 h-14">
            <a href="/dashboard" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </a>

            <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap justify-end">
              <AutoSaveIndicator status={autoSaveStatus} />

              {/* Find in note */}
              {findOpen ? (
                <FindInNote
                  editorRef={editorRef as React.RefObject<HTMLDivElement>}
                  onClose={() => setFindOpen(false)}
                />
              ) : (
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setFindOpen(true)} title="Find in note (Ctrl+F)">
                  <Search className="h-4 w-4" />
                </Button>
              )}

              {/* Read/Write toggle */}
              <Button
                variant={readMode ? "default" : "ghost"}
                size="sm"
                className="h-9 gap-1.5"
                onClick={() => setReadMode(!readMode)}
                title={readMode ? "Switch to Edit mode" : "Switch to Read mode"}
              >
                {readMode ? <Edit3 className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span className="hidden sm:inline text-xs">{readMode ? "Edit" : "Read"}</span>
              </Button>

              {/* Note Style Picker */}
              <div className="no-print">
                <NoteStylePicker
                  currentStyle={noteStyle}
                  onApplyToNote={handleApplyStyle}
                  onApplyToAll={handleApplyStyleToAll}
                />
              </div>

              {/* Export */}
              <div className="no-print">
                <ExportMenu
                  title={title}
                  body={body}
                  editorRef={editorRef as React.RefObject<HTMLDivElement>}
                />
              </div>

              {/* More menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 no-print">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handlePin(id, !isPinned)}>
                    {isPinned ? <><PinOff className="h-4 w-4 mr-2" />Unpin</> : <><Pin className="h-4 w-4 mr-2" />Pin to top</>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleFavorite}>
                    <Heart className={cn("h-4 w-4 mr-2", isFavorite && "fill-red-500 text-red-500")} />
                    {isFavorite ? "Remove from favorites" : "Add to favorites"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleToggleTodo}>
                    {noteType === "todo" ? <><FileText className="h-4 w-4 mr-2" />Switch to Note</> : <><CheckSquare className="h-4 w-4 mr-2" />Switch to To-do</>}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setMathMode(!mathMode)}>
                    <FunctionSquare className="h-4 w-4 mr-2" />
                    {mathMode ? "Turn Off Math Solver" : "Turn On Math Solver"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handlePrint}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setDeleteOpen(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {!readMode && (
                <>
                  <Button variant="outline" size="sm" onClick={() => handleSave(true)} disabled={!title.trim() || saving} className="h-9 no-print">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4 sm:mr-1.5" /><span className="hidden sm:inline">Done</span></>}
                  </Button>
                  <Button onClick={() => handleSave(false)} disabled={!title.trim() || saving} size="sm" className="h-9 no-print">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Math Solver Panel */}
        {mathMode && (
          <div className="no-print mx-auto w-full max-w-3xl px-3 sm:px-6 pt-4">
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
              <div className="flex items-center gap-2 mb-2">
                <FunctionSquare className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Math Solver</span>
              </div>
              <div className="flex gap-2">
                <input
                  className="flex-1 bg-background border rounded-md px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="e.g. 2 + 2 * 5, Math.sqrt(16)"
                  value={mathExpr}
                  onChange={(e) => {
                    setMathExpr(e.target.value);
                    setMathResult(e.target.value ? evalMath(e.target.value) : "");
                  }}
                />
                {mathResult && (
                  <div className="flex items-center gap-2 bg-background border rounded-md px-3 py-1.5">
                    <span className="text-xs text-muted-foreground">= </span>
                    <span className="text-sm font-mono font-semibold text-primary">{mathResult}</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                Supports: +, -, *, /, %, (), Math.sqrt(), Math.pow(), Math.PI, etc.
              </p>
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 mx-auto w-full max-w-3xl px-3 sm:px-6 py-4 sm:py-8 print-content">
          {noteType === "todo" ? (
            <div className="rounded-xl border p-4" style={{ background: note?.color ? undefined : undefined }}>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="List title..."
                className="w-full bg-transparent text-2xl sm:text-3xl font-semibold placeholder:text-muted-foreground/50 focus:outline-none ring-0 border-0 px-0 py-2 mb-4"
              />
              <TodoNote noteId={id} isLight={light} />
            </div>
          ) : (
            <NoteEditor
              title={title}
              body={body}
              color={color}
              noteStyle={noteStyle}
              readMode={readMode}
              editorRef={editorRef}
              onTitleChange={setTitle}
              onBodyChange={setBody}
              onColorChange={setColor}
            />
          )}
          {timeAgo && (
            <p className="mt-4 text-xs text-muted-foreground/70 no-print">
              Last updated {timeAgo}
              {isFavorite && <span className="ml-2">❤️</span>}
            </p>
          )}
        </div>
      </div>

      <div className="no-print">
        <NotesSidebar
          notes={allNotes}
          currentId={id}
          onPin={handlePin}
          onDelete={handleDelete}
        />
      </div>

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={() => handleDelete()}
        loading={deleting}
      />
    </div>
  );
}