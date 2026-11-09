import { createFileRoute, Link, Navigate, Outlet, useRouterState } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { claimKitchen, getKitchenRole } from "@/lib/kitchen/server";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/kitchen")({
  component: KitchenLayout,
});

const LINKS = [
  { to: "/kitchen", label: "Today", exact: true },
  { to: "/kitchen/menu", label: "Menu", exact: false },
  { to: "/kitchen/orders", label: "Orders", exact: false },
  { to: "/kitchen/settings", label: "Kitchen", exact: false },
] as const;

function KitchenLayout() {
  const { user, isPending } = useCurrentUserState();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const roleQ = useQuery({
    queryKey: ["kitchen-role"],
    queryFn: () => getKitchenRole(),
    enabled: !!user,
  });
  const claim = useMutation({
    mutationFn: () => claimKitchen(),
    onSuccess: () => roleQ.refetch(),
  });

  if (isPending) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <Skeleton className="h-10 w-48" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" search={{ redirectTo: "/kitchen" }} />;

  const role = roleQ.data;
  if (roleQ.isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (role && !role.role && role.canClaim) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <Card className="space-y-4 p-6">
          <h1 className="font-display text-3xl">Claim this kitchen</h1>
          <p className="text-sm text-muted">
            The first signed-in cook becomes the Gharaunda Rasoi owner — daily menus, licence, UPI
            and orders live here.
          </p>
          <Button onClick={() => claim.mutate()} disabled={claim.isPending}>
            {claim.isPending ? "Claiming…" : "I cook here"}
          </Button>
        </Card>
      </div>
    );
  }

  if (!role?.role) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <Card className="p-6">
          <h1 className="font-display text-3xl">Kitchen staff only</h1>
          <p className="mt-2 text-sm text-muted">
            This hearth already has an owner. Order from the daily board instead.
          </p>
          <Button asChild className="mt-4">
            <Link to="/menu">Daily board</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
        {role.role === "owner" ? "Owner desk" : "Kitchen desk"}
      </p>
      <h1 className="mt-1 font-display text-3xl">Gharaunda Rasoi</h1>
      <nav className="mt-5 flex flex-wrap gap-2">
        {LINKS.map((l) => {
          const active = l.exact ? pathname === l.to : pathname.startsWith(l.to);
          return (
            <Link
              key={l.to}
              to={l.to}
              className={cn(
                "min-h-11 rounded-full px-4 py-2 text-sm font-medium",
                active ? "bg-primary text-primary-fg" : "bg-fg/6",
              )}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-8">
        <Outlet />
      </div>
    </div>
  );
}
