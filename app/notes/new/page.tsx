"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft, Loader2, Check, MoreVertical, Pin, PinOff, Heart,
  Eye, Edit3, Search, FunctionSquare, Printer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NoteEditor } from "@/components/NoteEditor";
import { AutoSaveIndicator } from "@/components/AutoSaveIndicator";
import { FindInNote } from "@/components/FindInNote";
import { NoteStylePicker } from "@/components/NoteStylePicker";
import { ExportMenu } from "@/components/ExportMenu";
import { useAutoSaveNote } from "@/hooks/use-auto-save-note";
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

export default function NewNotePage() {
  const [noteId, setNoteId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [color, setColor] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const editorRef = useRef<HTMLDivElement>(null);

  // UI state — same controls as the note detail page
  const [readMode, setReadMode] = useState(false);
  const [findOpen, setFindOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [noteStyle, setNoteStyle] = useState("blank");
  const [mathMode, setMathMode] = useState(false);
  const [mathExpr, setMathExpr] = useState("");
  const [mathResult, setMathResult] = useState("");

  const handleCreated = useCallback(
    (id: string) => {
      setNoteId(id);
      router.replace(`/notes/${id}`);
    },
    [router]
  );

  const { status: autoSaveStatus, markSaved } = useAutoSaveNote({
    noteId,
    title,
    body,
    color,
    isPinned,
    enabled: title.trim().length > 0,
    onCreated: handleCreated,
  });

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
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const payload = {
      title: title.trim(),
      body,
      color,
      is_pinned: isPinned,
      is_favorite: isFavorite,
      note_style: noteStyle,
    };

    if (noteId) {
      const { error } = await supabase
        .from("notes")
        .update(payload)
        .eq("id", noteId);

      if (error) {
        setSaving(false);
        return;
      }
    } else {
      const { data, error } = await supabase
        .from("notes")
        .insert({ ...payload, user_id: user.id })
        .select()
        .single();

      if (error) {
        setSaving(false);
        return;
      }

      setNoteId(data.id);
      router.replace(`/notes/${data.id}`);
    }

    markSaved({ title, body, color });
    setSaving(false);

    if (redirectToDashboard) {
      router.push("/dashboard");
    }
  };

  const handleApplyStyle = (style: string, template: string | null) => {
    setNoteStyle(style);
    if (template) {
      if (body.trim() && !confirm("This template will replace your current note content. Continue?")) return;
      const templateTitle = style.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
      setTitle(templateTitle);
      setBody(template);
    }
  };

  const handleApplyStyleToAll = async (style: string) => {
    setNoteStyle(style);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("notes").update({ note_style: style }).eq("user_id", user.id);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <style>{`@media print{.no-print{display:none!important}}`}</style>

      <div className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm no-print">
        <div className="mx-auto max-w-3xl flex items-center justify-between gap-2 px-3 sm:px-6 h-14">
          <a
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
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
            <NoteStylePicker
              currentStyle={noteStyle}
              onApplyToNote={handleApplyStyle}
              onApplyToAll={handleApplyStyleToAll}
            />

            {/* Export */}
            <ExportMenu
              title={title || "Untitled"}
              body={body}
              editorRef={editorRef as React.RefObject<HTMLDivElement>}
            />

            {/* More menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsPinned(!isPinned)}>
                  {isPinned ? <><PinOff className="h-4 w-4 mr-2" />Unpin</> : <><Pin className="h-4 w-4 mr-2" />Pin to top</>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsFavorite(!isFavorite)}>
                  <Heart className={cn("h-4 w-4 mr-2", isFavorite && "fill-red-500 text-red-500")} />
                  {isFavorite ? "Remove from favorites" : "Add to favorites"}
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
              </DropdownMenuContent>
            </DropdownMenu>

            {!readMode && (
              <>
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

      <div className="flex-1 mx-auto w-full max-w-3xl px-3 sm:px-6 py-4 sm:py-8">
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
        {isFavorite && (
          <p className="mt-4 text-xs text-muted-foreground/70 no-print">❤️ Marked as favorite</p>
        )}
      </div>
    </div>
  );
}