import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SITE_NAME } from "@/lib/kitchen/format";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="mx-auto grid min-h-[70vh] max-w-md place-items-center px-4 py-12">
      <Card className="w-full space-y-5 p-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
            {SITE_NAME}
          </p>
          <h1 className="mt-2 font-display text-3xl">
            {mode === "in" ? "Sign in" : "Create account"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            Orders, subscriptions and kitchen tools need a signed-in table.
          </p>
        </div>
        {authEnabled ? (
          <>
            <div className="space-y-2">
              {GROK_PROVIDERS.map((p) => (
                <Button
                  key={p.providerId}
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => signIn(p.providerId, { callbackURL: "/" })}
                >
                  Continue with {p.label}
                </Button>
              ))}
            </div>
            <p className="text-center text-xs uppercase tracking-[0.16em] text-subtle">
              or email
            </p>
            <form
              className="space-y-3"
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                setError(null);
                try {
                  if (mode === "up") {
                    const res = await authClient.signUp.email({
                      email,
                      password,
                      name: name || email.split("@")[0],
                      callbackURL: "/",
                    });
                    if (res.error) throw new Error(res.error.message);
                  } else {
                    const res = await authClient.signIn.email({
                      email,
                      password,
                      callbackURL: "/",
                    });
                    if (res.error) throw new Error(res.error.message);
                  }
                  window.location.href = "/";
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Sign-in failed");
                } finally {
                  setBusy(false);
                }
              }}
            >
              {mode === "up" && (
                <div className="space-y-1.5">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              {error && <p className="text-sm text-primary">{error}</p>}
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Please wait…" : mode === "in" ? "Sign in with email" : "Create account"}
              </Button>
            </form>
            <button
              type="button"
              className="text-sm text-muted underline-offset-4 hover:underline"
              onClick={() => setMode(mode === "in" ? "up" : "in")}
            >
              {mode === "in" ? "Need an account? Create one" : "Have an account? Sign in"}
            </button>
          </>
        ) : (
          <p className="text-sm text-muted">Sign-in is disabled.</p>
        )}
        <Link to="/" className="block text-sm text-muted underline-offset-4 hover:underline">
          Back to the kitchen
        </Link>
      </Card>
    </div>
  );
}
