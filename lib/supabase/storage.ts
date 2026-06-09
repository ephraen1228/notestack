import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "note-attachments";

const ALLOWED_IMAGE_EXTS = ["jpg", "jpeg", "png", "gif", "webp"];
const ALLOWED_AUDIO_EXTS = ["mp3", "wav", "ogg", "m4a", "webm"];
const ALLOWED_PDF_EXTS = ["pdf"];

export async function uploadNoteImage(
  supabase: SupabaseClient,
  userId: string,
  file: File
): Promise<string | null> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  if (!ALLOWED_IMAGE_EXTS.includes(ext)) return null;
  return uploadFile(supabase, userId, file, ext, "img");
}

export async function uploadNotePDF(
  supabase: SupabaseClient,
  userId: string,
  file: File
): Promise<{ url: string; name: string } | null> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "pdf";
  if (!ALLOWED_PDF_EXTS.includes(ext)) return null;
  const url = await uploadFile(supabase, userId, file, ext, "pdf");
  if (!url) return null;
  return { url, name: file.name };
}

export async function uploadNoteAudio(
  supabase: SupabaseClient,
  userId: string,
  file: File | Blob,
  fileName?: string
): Promise<{ url: string; name: string } | null> {
  const ext =
    file instanceof File
      ? file.name.split(".").pop()?.toLowerCase() || "webm"
      : "webm";
  if (file instanceof File && !ALLOWED_AUDIO_EXTS.includes(ext)) return null;
  const name = fileName || (file instanceof File ? file.name : `recording-${Date.now()}.${ext}`);
  const path = `${userId}/audio-${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file instanceof Blob ? "audio/webm" : file.type,
  });
  if (error) {
    console.error("Audio upload failed:", error.message);
    return null;
  }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, name };
}

async function uploadFile(
  supabase: SupabaseClient,
  userId: string,
  file: File,
  ext: string,
  prefix: string
): Promise<string | null> {
  const path = `${userId}/${prefix}-${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) {
    console.error("Upload failed:", error.message);
    return null;
  }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}