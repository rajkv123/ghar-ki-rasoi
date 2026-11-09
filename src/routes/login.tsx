import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SITE_NAME } from "@/lib/kitchen/format";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => {
    const redirectTo = typeof search.redirectTo === "string" ? search.redirectTo : "/";
    return {
      redirectTo:
        redirectTo === "/kitchen" || /^\/orders\/\d+$/.test(redirectTo) ? redirectTo : "/",
    };
  },
  component: Login,
});

function Login() {
  const { redirectTo } = Route.useSearch();
  const [audience, setAudience] = useState<"choose" | "customer">("choose");
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
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">{SITE_NAME}</p>
          <h1 className="mt-2 font-display text-3xl">
            {audience === "choose"
              ? "Choose your sign-in"
              : mode === "in"
                ? "Customer sign in"
                : "Create customer account"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {audience === "choose"
              ? "Choose the account type you use."
              : "Customer accounts are for ordering meals and managing subscriptions."}
          </p>
        </div>
        {audience === "choose" ? (
          <div className="grid gap-3">
            <Button className="min-h-12" onClick={() => setAudience("customer")}>
              Customer
            </Button>
            <Link
              to="/admin/login"
              search={{ role: "owner" }}
              className="grid min-h-12 place-items-center rounded-md border border-border px-4 text-sm font-medium hover:bg-fg/5"
            >
              Kitchen Owner
            </Link>
            <Link
              to="/admin/login"
              search={{ role: "staff" }}
              className="grid min-h-12 place-items-center rounded-md border border-border px-4 text-sm font-medium hover:bg-fg/5"
            >
              Kitchen Staff
            </Link>
          </div>
        ) : authEnabled ? (
          <>
            <div className="space-y-2">
              {GROK_PROVIDERS.map((p) => (
                <Button
                  key={p.providerId}
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => signIn(p.providerId, { callbackURL: redirectTo })}
                >
                  Continue with {p.label}
                </Button>
              ))}
            </div>
            <p className="text-center text-xs uppercase tracking-[0.16em] text-subtle">or email</p>
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
                      callbackURL: redirectTo,
                    });
                    if (res.error) throw new Error(res.error.message);
                  } else {
                    const res = await authClient.signIn.email({
                      email,
                      password,
                      callbackURL: redirectTo,
                    });
                    if (res.error) throw new Error(res.error.message);
                  }
                  window.location.href = redirectTo;
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
            <button
              type="button"
              className="block text-sm text-muted underline-offset-4 hover:underline"
              onClick={() => {
                setAudience("choose");
                setError(null);
                setMode("in");
              }}
            >
              Choose a different account type
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
