"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Layers, Loader2, ArrowLeft, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-background">
      <Card className="w-full max-w-md border-border/50">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-3">
            <a
              href="/"
              className="flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity"
            >
              <Layers className="h-7 w-7 text-primary" />
              <span className="text-xl font-semibold tracking-tight">
                NoteStack
              </span>
            </a>
          </div>
          <CardTitle className="text-2xl">Reset password</CardTitle>
          <CardDescription>
            {sent
              ? "Check your inbox for a reset link"
              : "Enter your email and we'll send you a reset link"}
          </CardDescription>
        </CardHeader>

        {sent ? (
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="h-7 w-7 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground max-w-xs">
                We sent a password reset link to{" "}
                <span className="font-medium text-foreground">{email}</span>.
                Click the link in the email to set a new password.
              </p>
            </div>
            <Button variant="outline" className="w-full" asChild>
              <a href="/login">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to login
              </a>
            </Button>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send reset link"
                )}
              </Button>
              <Button variant="ghost" className="w-full" asChild>
                <a href="/login">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to login
                </a>
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}
