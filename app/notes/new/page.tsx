"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NoteEditor } from "@/components/NoteEditor";

export default function NewNotePage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
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

    const { data, error } = await supabase
      .from("notes")
      .insert({ title: title.trim(), body, user_id: user.id })
      .select()
      .single();

    if (error) {
      setSaving(false);
      return;
    }

    router.push(`/notes/${data.id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Toolbar */}
      <div className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl flex items-center justify-between px-4 sm:px-6 h-14">
          <a
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to notes
          </a>
          <Button
            onClick={handleSave}
            disabled={!title.trim() || saving}
            size="sm"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Note"
            )}
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
        <NoteEditor
          title={title}
          body={body}
          onTitleChange={setTitle}
          onBodyChange={setBody}
        />
      </div>
    </div>
  );
}
