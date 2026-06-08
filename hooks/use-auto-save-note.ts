"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export type AutoSaveStatus = "idle" | "saving" | "saved" | "error";

interface UseAutoSaveNoteOptions {
  noteId: string | null;
  title: string;
  body: string;
  color: string | null;
  isPinned?: boolean;
  enabled: boolean;
  debounceMs?: number;
  onCreated?: (id: string) => void;
}

function toSnapshot(
  title: string,
  body: string,
  color: string | null,
  isPinned: boolean
) {
  return JSON.stringify({
    title: title.trim(),
    body,
    color,
    isPinned,
  });
}

export function useAutoSaveNote({
  noteId,
  title,
  body,
  color,
  isPinned = false,
  enabled,
  debounceMs = 1500,
  onCreated,
}: UseAutoSaveNoteOptions) {
  const [status, setStatus] = useState<AutoSaveStatus>("idle");
  const baseline = useRef<string | null>(null);
  const onCreatedRef = useRef(onCreated);
  onCreatedRef.current = onCreated;

  const markSaved = useCallback(
    (snapshot: {
      title: string;
      body: string;
      color: string | null;
      isPinned?: boolean;
    }) => {
      baseline.current = toSnapshot(
        snapshot.title,
        snapshot.body,
        snapshot.color,
        snapshot.isPinned ?? false
      );
      setStatus("idle");
    },
    []
  );

  useEffect(() => {
    if (!enabled || !title.trim()) return;

    const current = toSnapshot(title, body, color, isPinned);
    if (baseline.current === current) return;

    setStatus("saving");

    const timer = setTimeout(async () => {
      const supabase = createClient();
      const payload = {
        title: title.trim(),
        body,
        color,
        is_pinned: isPinned,
      };

      if (noteId) {
        const { error } = await supabase
          .from("notes")
          .update(payload)
          .eq("id", noteId);

        if (error) {
          setStatus("error");
          return;
        }
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setStatus("error");
          return;
        }

        const { data, error } = await supabase
          .from("notes")
          .insert({ ...payload, user_id: user.id })
          .select("id")
          .single();

        if (error || !data) {
          setStatus("error");
          return;
        }

        onCreatedRef.current?.(data.id);
      }

      baseline.current = current;
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [noteId, title, body, color, isPinned, enabled, debounceMs]);

  return { status, markSaved };
}
