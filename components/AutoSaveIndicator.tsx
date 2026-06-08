import { Loader2, Check, AlertCircle } from "lucide-react";
import type { AutoSaveStatus } from "@/hooks/use-auto-save-note";
import { cn } from "@/lib/utils";

export function AutoSaveIndicator({ status }: { status: AutoSaveStatus }) {
  if (status === "idle") return null;

  return (
    <span
      className={cn(
        "flex items-center gap-1 text-xs text-muted-foreground",
        status === "error" && "text-destructive"
      )}
    >
      {status === "saving" && (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
          <span className="hidden sm:inline">Saving...</span>
        </>
      )}
      {status === "saved" && (
        <>
          <Check className="h-3 w-3 text-primary" />
          <span className="hidden sm:inline">Saved</span>
        </>
      )}
      {status === "error" && (
        <>
          <AlertCircle className="h-3 w-3" />
          <span className="hidden sm:inline">Save failed</span>
        </>
      )}
    </span>
  );
}
