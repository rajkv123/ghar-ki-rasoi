import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShoppingBag } from "lucide-react";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { SignedIn, SignedOut, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { cartCount, useCart } from "@/lib/cart";
import { SITE_LOCATION, SITE_NAME } from "@/lib/kitchen/format";
import { getKitchenRole } from "@/lib/kitchen/server";
import { cn } from "@/lib/utils";
import { useEffect, useState, type ReactNode } from "react";

const NAV = [
  { to: "/menu", label: "Daily board" },
  { to: "/specials", label: "A la carte" },
  { to: "/subscribe", label: "Subscribe" },
  { to: "/licence", label: "Licence" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const lines = useCart((s) => s.lines);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const count = mounted ? cartCount(lines) : 0;
  const { user, isPending } = useCurrentUserState();
  const kitchenRoleQ = useQuery({
    queryKey: ["kitchen-role"],
    queryFn: () => getKitchenRole(),
    enabled: !!user,
  });
  const hasKitchenAccess = Boolean(kitchenRoleQ.data?.role);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-bg/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5 text-fg">
            <img src="/favicon.svg" alt="" className="size-10 rounded-xl shadow-sm" />
            <span className="font-display text-lg leading-none tracking-tight">{SITE_NAME}</span>
          </Link>
          <nav className="ml-4 hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "rounded-md px-3 py-2 text-sm transition-colors duration-150",
                  pathname === item.to || pathname.startsWith(`${item.to}/`)
                    ? "bg-fg/8 font-medium"
                    : "text-muted hover:bg-fg/5 hover:text-fg",
                )}
              >
                {item.label}
              </Link>
            ))}
            {hasKitchenAccess && (
              <Link
                to="/kitchen"
                className={cn(
                  "rounded-md px-3 py-2 text-sm transition-colors duration-150",
                  pathname.startsWith("/kitchen")
                    ? "bg-fg/8 font-medium"
                    : "text-muted hover:bg-fg/5 hover:text-fg",
                )}
              >
                Kitchen
              </Link>
            )}
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <ThemeSwitcher />
            <Link
              to="/cart"
              aria-label={`Bag, ${count} items`}
              className="relative grid size-11 place-items-center rounded-md hover:bg-fg/5"
            >
              <ShoppingBag className="size-5" />
              {count > 0 && (
                <span className="absolute right-1.5 top-1.5 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-medium tabular-nums text-primary-fg">
                  {count}
                </span>
              )}
            </Link>
            {isPending ? (
              <div className="h-8 w-24 animate-pulse rounded-full bg-fg/8" />
            ) : user ? (
              <div className="hidden max-w-[14rem] truncate sm:block">
                <UserButton />
              </div>
            ) : (
              <SignedOut>
                <Link
                  to="/login"
                  search={{ redirectTo: "/" }}
                  className="rounded-md px-3 py-2 text-sm font-medium hover:bg-fg/5"
                >
                  Sign in
                </Link>
              </SignedOut>
            )}
            <SignedIn>
              <Link
                to="/account"
                className="hidden rounded-md px-3 py-2 text-sm text-muted hover:text-fg lg:inline"
              >
                Account
              </Link>
            </SignedIn>
          </div>
        </div>
        <nav className="no-scrollbar flex gap-1 overflow-x-auto border-t border-border px-3 py-1 md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "shrink-0 rounded-full px-3 py-2 text-sm",
                pathname === item.to ? "bg-fg/8 font-medium" : "text-muted",
              )}
            >
              {item.label}
            </Link>
          ))}
          {hasKitchenAccess && (
            <Link
              to="/kitchen"
              className={cn(
                "shrink-0 rounded-full px-3 py-2 text-sm",
                pathname.startsWith("/kitchen") ? "bg-fg/8 font-medium" : "text-muted",
              )}
            >
              Kitchen
            </Link>
          )}
        </nav>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 sm:px-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-display text-xl">{SITE_NAME}</p>
            <p className="mt-1 text-sm text-muted">Home kitchen · {SITE_LOCATION}</p>
          </div>
          <p className="max-w-sm text-sm text-muted">
            Food licence on display. Calories counted per plate. UPI on every order. Built to feed a
            thousand tables from one hearth.
          </p>
          <Link
            to="/admin/login"
            search={{ role: "owner" }}
            className="text-sm text-muted underline-offset-4 hover:text-fg hover:underline"
          >
            Kitchen staff sign in
          </Link>
        </div>
      </footer>
    </div>
  );
}
