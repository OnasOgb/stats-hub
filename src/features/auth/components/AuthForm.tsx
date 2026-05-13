"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Trophy, Mail, Loader2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import * as Sentry from "@sentry/nextjs";
import { getSupabase } from "@/shared/lib/supabase";

function GoogleButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <Button
      variant="outline"
      className="w-full"
      onClick={onClick}
      disabled={disabled}
    >
      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </svg>
      Continue with Google
    </Button>
  );
}

function Divider() {
  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-border" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-card px-2 text-muted-foreground">
          or continue with email
        </span>
      </div>
    </div>
  );
}

export function AuthForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const options: { emailRedirectTo: string; data?: { full_name: string } } = {
      emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
    };

    if (activeTab === "signup") {
      options.data = { full_name: displayName.trim() };
    }

    const { error } = await getSupabase().auth.signInWithOtp({
      email,
      options,
    });

    if (error) {
      Sentry.captureException(error, { extra: { context: "AuthForm: OTP sign-in" } });
      setError(error.message);
      setLoading(false);
    } else {
      setSent(true);
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError("");

    const { error } = await getSupabase().auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (error) {
      Sentry.captureException(error, { extra: { context: "AuthForm: Google OAuth" } });
      setError(error.message);
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm space-y-8 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Check your email</h1>
            <p className="text-sm text-muted-foreground">
              We sent a magic link to <strong>{email}</strong>. Click the link
              to sign in.
            </p>
          </div>
          <Button
            variant="ghost"
            className="text-sm text-muted-foreground"
            onClick={() => setSent(false)}
          >
            Use a different email
          </Button>
        </div>
      </div>
    );
  }

  const isSignInDisabled = loading || !email;
  const isSignUpDisabled = loading || !email || displayName.trim().length < 2;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15">
            <Trophy className="h-8 w-8 text-primary" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold">
              {activeTab === "signin" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {activeTab === "signin"
                ? "Sign in to your StatsHub account"
                : "Sign up to track your football stats"}
            </p>
          </div>
        </div>

        <Card className="border-border">
          <CardContent className="pt-6 space-y-6">
            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Tabs
              value={activeTab}
              onValueChange={(v) => {
                setActiveTab(v as "signin" | "signup");
                setError("");
              }}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              {/* Sign In Tab */}
              <TabsContent value="signin" className="space-y-6 mt-6">
                <GoogleButton onClick={handleGoogle} disabled={loading} />
                <Divider />
                <form onSubmit={handleMagicLink} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSignInDisabled}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send Magic Link"
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Sign Up Tab */}
              <TabsContent value="signup" className="space-y-6 mt-6">
                <GoogleButton onClick={handleGoogle} disabled={loading} />
                <Divider />
                <form onSubmit={handleMagicLink} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      type="text"
                      placeholder="Your name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                      minLength={2}
                      maxLength={30}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSignUpDisabled}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send Magic Link"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
