"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NoteEditor } from "@/components/NoteEditor";
import { AutoSaveIndicator } from "@/components/AutoSaveIndicator";
import { useAutoSaveNote } from "@/hooks/use-auto-save-note";

export default function NewNotePage() {
  const [noteId, setNoteId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [color, setColor] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

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
    enabled: title.trim().length > 0,
    onCreated: handleCreated,
  });

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

  return (
    <div className="min-h-screen bg-background flex flex-col">
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
      </div>
    </div>
  );
}
