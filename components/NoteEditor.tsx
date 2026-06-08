"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ImagePlus,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NoteColorPicker } from "@/components/NoteColorPicker";
import { createClient } from "@/lib/supabase/client";
import { uploadNoteImage } from "@/lib/supabase/storage";
import { getNoteColorStyle } from "@/lib/note-utils";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface NoteEditorProps {
  title: string;
  body: string;
  color: string | null;
  onTitleChange: (value: string) => void;
  onBodyChange: (value: string) => void;
  onColorChange: (value: string | null) => void;
  titlePlaceholder?: string;
  bodyPlaceholder?: string;
}

export function NoteEditor({
  title,
  body,
  color,
  onTitleChange,
  onBodyChange,
  onColorChange,
  titlePlaceholder = "Note title...",
  bodyPlaceholder = "Start writing...",
}: NoteEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const colorStyle = getNoteColorStyle(color);

  useEffect(() => {
    const el = editorRef.current;
    if (!el || document.activeElement === el) return;
    if (el.innerHTML !== body) {
      el.innerHTML = body || "";
    }
  }, [body]);

  const syncBody = useCallback(() => {
    const html = editorRef.current?.innerHTML ?? "";
    onBodyChange(html);
  }, [onBodyChange]);

  const execFormat = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    syncBody();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        description: "Please select an image file.",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        description: "Image must be under 5 MB.",
      });
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setUploading(false);
      toast({ variant: "destructive", description: "Please log in to attach images." });
      return;
    }

    const url = await uploadNoteImage(supabase, user.id, file);
    setUploading(false);

    if (!url) {
      toast({
        variant: "destructive",
        description: "Failed to upload image. Check storage setup.",
      });
      return;
    }

    editorRef.current?.focus();
    document.execCommand(
      "insertHTML",
      false,
      `<img src="${url}" alt="Attached image" class="note-image" />`
    );
    syncBody();
  };

  const toolbarBtn =
    "h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground";

  return (
    <div
      className="rounded-xl border transition-colors"
      style={{
        background: colorStyle.background,
        borderColor: colorStyle.border,
      }}
    >
      {/* Formatting toolbar */}
      <div className="flex items-center gap-0.5 overflow-x-auto border-b px-2 py-1.5 scrollbar-none"
        style={{ borderColor: colorStyle.border }}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={toolbarBtn}
          onClick={() => execFormat("bold")}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={toolbarBtn}
          onClick={() => execFormat("italic")}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={toolbarBtn}
          onClick={() => execFormat("underline")}
          title="Underline"
        >
          <Underline className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={toolbarBtn}
          onClick={() => execFormat("strikeThrough")}
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={toolbarBtn}
          onClick={() => execFormat("insertUnorderedList")}
          title="Bullet list"
        >
          <List className="h-4 w-4" />
        </Button>

        <div className="mx-1 h-5 w-px bg-border shrink-0" />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={toolbarBtn}
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          title="Attach image"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImagePlus className="h-4 w-4" />
          )}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />

        <div className="ml-auto shrink-0">
          <NoteColorPicker value={color} onChange={onColorChange} compact />
        </div>
      </div>

      {/* Editor content */}
      <div className="px-4 sm:px-6 py-4 sm:py-6">
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder={titlePlaceholder}
          className="w-full bg-transparent text-2xl sm:text-3xl font-semibold placeholder:text-muted-foreground/50 focus:outline-none ring-0 border-0 px-0 py-2"
        />
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={syncBody}
          data-placeholder={bodyPlaceholder}
          className={cn(
            "note-editor min-h-[50vh] sm:min-h-[55vh] text-base leading-relaxed",
            "focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/50"
          )}
        />
      </div>
    </div>
  );
}
