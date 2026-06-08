"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NoteEditor } from "@/components/NoteEditor";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { useToast } from "@/hooks/use-toast";
import type { Note } from "@/types/note";

export default function NoteDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { toast } = useToast();

  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNote = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data } = await supabase
        .from("notes")
        .select("*")
        .eq("id", id)
        .single();

      if (!data || data.user_id !== user.id) {
        router.push("/dashboard");
        return;
      }

      setNote(data);
      setTitle(data.title);
      setBody(data.body);
      setLoading(false);
    };

    fetchNote();
  }, [id, router]);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("notes")
      .update({ title: title.trim(), body })
      .eq("id", id);

    if (error) {
      setSaving(false);
      return;
    }

    setSaving(false);
    toast({ description: "Note saved" });
  };

  const handleDelete = async () => {
    setDeleting(true);

    const supabase = createClient();
    await supabase.from("notes").delete().eq("id", id);

    router.push("/dashboard");
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
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteOpen(true)}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Delete
            </Button>
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
                "Save Changes"
              )}
            </Button>
          </div>
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
        {timeAgo && (
          <p className="mt-6 text-xs text-muted-foreground/70">
            Last updated {timeAgo}
          </p>
        )}
      </div>

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
