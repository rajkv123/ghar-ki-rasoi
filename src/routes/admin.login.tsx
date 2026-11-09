import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient, authEnabled } from "@/lib/auth/client";
import { SITE_NAME } from "@/lib/kitchen/format";
import { getKitchenRole } from "@/lib/kitchen/server";

export const Route = createFileRoute("/admin/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    role: search.role === "staff" ? "staff" : "owner",
  }),
  component: AdminLogin,
});

function AdminLogin() {
  const { role } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="mx-auto grid min-h-[70vh] max-w-md place-items-center px-4 py-12">
      <Card className="w-full space-y-5 p-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
            {SITE_NAME} · Kitchen
          </p>
          <h1 className="mt-2 font-display text-3xl">
            Kitchen {role === "owner" ? "owner" : "staff"} sign in
          </h1>
          <p className="mt-1 text-sm text-muted">
            Sign in with an existing {role === "owner" ? "owner" : "staff"} account. This choice
            does not grant kitchen access; access is checked against your assigned role.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/admin/login"
            search={{ role: "owner" }}
            aria-current={role === "owner" ? "page" : undefined}
            className={`grid min-h-11 flex-1 place-items-center rounded-md px-3 text-sm font-medium ${
              role === "owner" ? "bg-primary text-primary-fg" : "bg-fg/6 text-muted"
            }`}
          >
            Kitchen Owner
          </Link>
          <Link
            to="/admin/login"
            search={{ role: "staff" }}
            aria-current={role === "staff" ? "page" : undefined}
            className={`grid min-h-11 flex-1 place-items-center rounded-md px-3 text-sm font-medium ${
              role === "staff" ? "bg-primary text-primary-fg" : "bg-fg/6 text-muted"
            }`}
          >
            Kitchen Staff
          </Link>
        </div>
        {authEnabled ? (
          <form
            className="space-y-3"
            onSubmit={async (event) => {
              event.preventDefault();
              setBusy(true);
              setError(null);
              try {
                const result = await authClient.signIn.email({
                  email,
                  password,
                  callbackURL: "/kitchen",
                });
                if (result.error) throw new Error(result.error.message);
                const kitchenAccess = await getKitchenRole();
                const hasExpectedRole =
                  role === "owner"
                    ? kitchenAccess.role === "owner" || kitchenAccess.canClaim
                    : kitchenAccess.role === "staff";
                if (!hasExpectedRole) {
                  throw new Error(
                    role === "owner"
                      ? "This account is not the kitchen owner. Use the staff option or contact the owner."
                      : "This account is not assigned kitchen staff access. Ask the kitchen owner to grant staff access.",
                  );
                }
                window.location.href = "/kitchen";
              } catch (err) {
                setError(err instanceof Error ? err.message : "Kitchen sign-in failed");
              } finally {
                setBusy(false);
              }
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="kitchen-email">Admin email</Label>
              <Input
                id="kitchen-email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="kitchen-password">Password</Label>
              <Input
                id="kitchen-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            {error && (
              <p className="text-sm text-primary" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Signing in…" : "Sign in to kitchen"}
            </Button>
          </form>
        ) : (
          <p className="text-sm text-muted" role="status">
            Admin sign-in is unavailable because account sign-in is disabled.
          </p>
        )}
        <Link to="/login" search={{ redirectTo: "/" }} className="block text-sm underline">
          Choose customer sign in
        </Link>
      </Card>
    </div>
  );
}
