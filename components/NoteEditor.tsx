"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import {
  Bold, Italic, Underline, Strikethrough, List, ImagePlus, Loader2,
  FileText, Mic, MicOff, Music2, StickyNote, Table, X, GripVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NoteColorPicker } from "@/components/NoteColorPicker";
import { createClient } from "@/lib/supabase/client";
import { uploadNoteImage, uploadNotePDF, uploadNoteAudio } from "@/lib/supabase/storage";
import { getNoteColorStyle, getNoteStyleCSS, isLightColor } from "@/lib/note-utils";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface NoteEditorProps {
  title: string;
  body: string;
  color: string | null;
  noteStyle?: string;
  readMode?: boolean;
  editorRef?: React.RefObject<HTMLDivElement | null>;
  onTitleChange: (value: string) => void;
  onBodyChange: (value: string) => void;
  onColorChange: (value: string | null) => void;
  titlePlaceholder?: string;
  bodyPlaceholder?: string;
}

interface StickyNoteWidget {
  id: string;
  text: string;
  color: string;
  x: number;
  y: number;
}

// ── Sticky note <-> body HTML helpers ──────────────────────────────────────
const STICKY_DATA_REGEX = /<script type="application\/json" id="sticky-notes-data">([\s\S]*?)<\/script>/;

function extractStickyNotes(html: string): StickyNoteWidget[] {
  const match = html.match(STICKY_DATA_REGEX);
  if (!match) return [];
  try {
    const parsed = JSON.parse(match[1]);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // ignore malformed data
  }
  return [];
}

function stripStickyData(html: string): string {
  return html.replace(STICKY_DATA_REGEX, "");
}

function injectStickyNotes(html: string, stickies: StickyNoteWidget[]): string {
  const stripped = stripStickyData(html);
  if (stickies.length === 0) return stripped;
  return `${stripped}<script type="application/json" id="sticky-notes-data">${JSON.stringify(
    stickies
  )}</script>`;
}

export function NoteEditor({
  title, body, color, noteStyle = "blank", readMode = false, editorRef,
  onTitleChange, onBodyChange, onColorChange,
  titlePlaceholder = "Note title...",
  bodyPlaceholder = "Start writing...",
}: NoteEditorProps) {
  const internalRef = useRef<HTMLDivElement>(null);
  const editorElRef = (editorRef ?? internalRef) as React.RefObject<HTMLDivElement | null>;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [stickyNotes, setStickyNotes] = useState<StickyNoteWidget[]>([]);
  const [draggingSticky, setDraggingSticky] = useState<string | null>(null);
  const stickiesInitialized = useRef(false);
  const isFirstStickyRender = useRef(true);
  const { toast } = useToast();

  const light = isLightColor(color);
  const colorStyle = getNoteColorStyle(color);
  const styleCSS = getNoteStyleCSS(noteStyle, light);

  // Sync incoming body -> contentEditable element
  useEffect(() => {
    const el = editorElRef.current;
    if (!el || document.activeElement === el) return;
    if (el.innerHTML !== body) el.innerHTML = body || "";
  }, [body, editorElRef, readMode]);

  // Load sticky notes embedded in the saved body (runs once, on first load)
  useEffect(() => {
    if (stickiesInitialized.current) return;
    if (!body) return;
    const parsed = extractStickyNotes(body);
    if (parsed.length > 0) setStickyNotes(parsed);
    stickiesInitialized.current = true;
  }, [body]);

  // Whenever sticky notes change (add/edit/move/delete/recolor), embed them
  // back into the body so they get saved with the note.
  useEffect(() => {
    if (isFirstStickyRender.current) {
      isFirstStickyRender.current = false;
      return;
    }
    const currentHtml = editorElRef.current?.innerHTML ?? body;
    const newBody = injectStickyNotes(currentHtml, stickyNotes);
    if (newBody !== body) onBodyChange(newBody);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stickyNotes]);

  const syncBody = useCallback(() => {
    onBodyChange(editorElRef.current?.innerHTML ?? "");
  }, [editorElRef, onBodyChange]);

  const execFormat = (command: string, value?: string) => {
    if (readMode) return;
    editorElRef.current?.focus();
    document.execCommand(command, false, value);
    syncBody();
  };

  // ── Image upload ──────────────────────────────────────────────────────────
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    if (!file.type.startsWith("image/")) {
      toast({ variant: "destructive", description: "Please select an image file." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: "destructive", description: "Image must be under 5 MB." });
      return;
    }
    setUploading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setUploading(false); return; }
    const url = await uploadNoteImage(supabase, user.id, file);
    setUploading(false);
    if (!url) {
      toast({ variant: "destructive", description: "Failed to upload image." });
      return;
    }
    editorElRef.current?.focus();
    document.execCommand("insertHTML", false, `<img src="${url}" alt="Attached image" class="note-image" />`);
    syncBody();
  };

  // ── PDF upload ────────────────────────────────────────────────────────────
  const handlePDFUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    if (file.type !== "application/pdf") {
      toast({ variant: "destructive", description: "Please select a PDF file." });
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast({ variant: "destructive", description: "PDF must be under 20 MB." });
      return;
    }
    setUploading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setUploading(false); return; }
    const result = await uploadNotePDF(supabase, user.id, file);
    setUploading(false);
    if (!result) {
      toast({ variant: "destructive", description: "Failed to upload PDF." });
      return;
    }
    editorElRef.current?.focus();
    document.execCommand(
      "insertHTML", false,
      `<div class="pdf-attachment"><a href="${result.url}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:8px;padding:8px 12px;background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.3);border-radius:8px;text-decoration:none;color:inherit;font-size:14px">📄 ${result.name}</a></div>`
    );
    syncBody();
  };

  // ── Audio file upload ─────────────────────────────────────────────────────
  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setUploading(false); return; }
    const result = await uploadNoteAudio(supabase, user.id, file);
    setUploading(false);
    if (!result) {
      toast({ variant: "destructive", description: "Failed to upload audio." });
      return;
    }
    editorElRef.current?.focus();
    document.execCommand(
      "insertHTML", false,
      `<div class="audio-attachment" style="margin:8px 0"><audio controls style="width:100%;max-width:400px"><source src="${result.url}" /></audio><p style="font-size:11px;opacity:0.6;margin:2px 0">🎵 ${result.name}</p></div>`
    );
    syncBody();
  };

  // ── Voice recording ───────────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      audioChunksRef.current = [];
      mr.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setUploading(true);
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setUploading(false); return; }
        const result = await uploadNoteAudio(supabase, user.id, blob);
        setUploading(false);
        if (result) {
          editorElRef.current?.focus();
          document.execCommand(
            "insertHTML", false,
            `<div class="audio-attachment" style="margin:8px 0"><audio controls style="width:100%;max-width:400px"><source src="${result.url}" type="audio/webm" /></audio><p style="font-size:11px;opacity:0.6;margin:2px 0">🎙️ ${result.name}</p></div>`
          );
          syncBody();
        }
      };
      mr.start();
      setRecording(true);
    } catch {
      toast({ variant: "destructive", description: "Microphone access denied." });
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  // ── Insert table ──────────────────────────────────────────────────────────
  const insertTable = () => {
    if (readMode) return;
    editorElRef.current?.focus();
    const tableHTML = `<table border="1" cellpadding="8" style="width:100%;border-collapse:collapse;margin:8px 0"><thead><tr><th style="background:rgba(99,102,241,0.1)">Header 1</th><th style="background:rgba(99,102,241,0.1)">Header 2</th><th style="background:rgba(99,102,241,0.1)">Header 3</th></tr></thead><tbody><tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr><tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr><tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr></tbody></table><p></p>`;
    document.execCommand("insertHTML", false, tableHTML);
    syncBody();
  };

  // ── Add sticky note ───────────────────────────────────────────────────────
  const addStickyNote = () => {
    setStickyNotes((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text: "Sticky note...", color: "#fef08a", x: 20, y: 20 },
    ]);
  };

  const STICKY_COLORS = ["#fef08a", "#86efac", "#93c5fd", "#f9a8d4", "#fed7aa"];

  const toolbarBtn = "h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground";

  return (
    <div
      className="rounded-xl border transition-colors relative"
      style={{ background: colorStyle.background, borderColor: colorStyle.border, ...styleCSS }}
    >
      {/* Sticky notes overlay */}
      {stickyNotes.map((sticky) => (
        <div
          key={sticky.id}
          className="absolute z-20 w-44 rounded-lg shadow-lg p-2"
          style={{ background: sticky.color, left: sticky.x, top: sticky.y, cursor: draggingSticky === sticky.id ? "grabbing" : "grab" }}
          onMouseDown={(e) => {
            const startX = e.clientX - sticky.x;
            const startY = e.clientY - sticky.y;
            setDraggingSticky(sticky.id);
            const onMove = (ev: MouseEvent) => {
              setStickyNotes((prev) =>
                prev.map((s) =>
                  s.id === sticky.id ? { ...s, x: ev.clientX - startX, y: ev.clientY - startY } : s
                )
              );
            };
            const onUp = () => {
              setDraggingSticky(null);
              document.removeEventListener("mousemove", onMove);
              document.removeEventListener("mouseup", onUp);
            };
            document.addEventListener("mousemove", onMove);
            document.addEventListener("mouseup", onUp);
          }}
        >
          <div className="flex items-center justify-between mb-1">
            <GripVertical className="h-3 w-3 text-gray-500" />
            <div className="flex gap-1">
              {STICKY_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() =>
                    setStickyNotes((prev) => prev.map((s) => s.id === sticky.id ? { ...s, color: c } : s))
                  }
                  className="w-3 h-3 rounded-full border border-gray-300"
                  style={{ background: c }}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setStickyNotes((prev) => prev.filter((s) => s.id !== sticky.id))}
            >
              <X className="h-3 w-3 text-gray-500" />
            </button>
          </div>
          <textarea
            value={sticky.text}
            onChange={(e) =>
              setStickyNotes((prev) =>
                prev.map((s) => s.id === sticky.id ? { ...s, text: e.target.value } : s)
              )
            }
            className="w-full bg-transparent resize-none text-xs text-gray-700 border-none outline-none"
            rows={4}
            style={{ cursor: "text" }}
            onMouseDown={(e) => e.stopPropagation()}
          />
        </div>
      ))}

      {/* Formatting toolbar */}
      {!readMode && (
        <div
          className="flex items-center gap-0.5 overflow-x-auto border-b px-2 py-1.5 scrollbar-none"
          style={{ borderColor: colorStyle.border }}
        >
          <Button type="button" variant="ghost" size="icon" className={toolbarBtn} onClick={() => execFormat("bold")} title="Bold">
            <Bold className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className={toolbarBtn} onClick={() => execFormat("italic")} title="Italic">
            <Italic className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className={toolbarBtn} onClick={() => execFormat("underline")} title="Underline">
            <Underline className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className={toolbarBtn} onClick={() => execFormat("strikeThrough")} title="Strikethrough">
            <Strikethrough className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className={toolbarBtn} onClick={() => execFormat("insertUnorderedList")} title="Bullet list">
            <List className="h-4 w-4" />
          </Button>

          <div className="mx-1 h-5 w-px bg-border shrink-0" />

          {/* Image */}
          <Button type="button" variant="ghost" size="icon" className={toolbarBtn} onClick={() => fileInputRef.current?.click()} disabled={uploading} title="Attach image">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          </Button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

          {/* PDF */}
          <Button type="button" variant="ghost" size="icon" className={toolbarBtn} onClick={() => pdfInputRef.current?.click()} disabled={uploading} title="Attach PDF">
            <FileText className="h-4 w-4" />
          </Button>
          <input ref={pdfInputRef} type="file" accept=".pdf" className="hidden" onChange={handlePDFUpload} />

          {/* Audio file */}
          <Button type="button" variant="ghost" size="icon" className={toolbarBtn} onClick={() => audioInputRef.current?.click()} disabled={uploading} title="Attach audio">
            <Music2 className="h-4 w-4" />
          </Button>
          <input ref={audioInputRef} type="file" accept="audio/*" className="hidden" onChange={handleAudioUpload} />

          {/* Voice record */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(toolbarBtn, recording && "text-red-500 animate-pulse")}
            onClick={recording ? stopRecording : startRecording}
            disabled={uploading}
            title={recording ? "Stop recording" : "Record voice"}
          >
            {recording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>

          <div className="mx-1 h-5 w-px bg-border shrink-0" />

          {/* Sticky note */}
          <Button type="button" variant="ghost" size="icon" className={toolbarBtn} onClick={addStickyNote} title="Add sticky note">
            <StickyNote className="h-4 w-4" />
          </Button>

          {/* Table */}
          <Button type="button" variant="ghost" size="icon" className={toolbarBtn} onClick={insertTable} title="Insert table">
            <Table className="h-4 w-4" />
          </Button>

          <div className="ml-auto shrink-0">
            <NoteColorPicker value={color} onChange={onColorChange} compact />
          </div>
        </div>
      )}

      {/* Editor content */}
      <div className={cn("px-4 sm:px-6 py-4 sm:py-6", light && "text-gray-800")}>
        {readMode ? (
          <h1
            className={cn(
              "text-2xl sm:text-3xl font-semibold mb-4",
              light ? "text-gray-800" : "text-foreground"
            )}
          >
            {title}
          </h1>
        ) : (
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder={titlePlaceholder}
            className={cn(
              "w-full bg-transparent text-2xl sm:text-3xl font-semibold placeholder:text-muted-foreground/50 focus:outline-none ring-0 border-0 px-0 py-2",
              light && "text-gray-800"
            )}
          />
        )}

        {readMode ? (
          <div
            className={cn("note-editor text-base leading-relaxed", light && "text-gray-700")}
            dangerouslySetInnerHTML={{ __html: stripStickyData(body) }}
          />
        ) : (
          <div
            ref={editorElRef as React.RefObject<HTMLDivElement>}
            contentEditable
            suppressContentEditableWarning
            onInput={syncBody}
            data-placeholder={bodyPlaceholder}
            className={cn(
              "note-editor min-h-[50vh] sm:min-h-[55vh] text-base leading-relaxed",
              "focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/50",
              light && "text-gray-800"
            )}
          />
        )}
      </div>
    </div>
  );
}