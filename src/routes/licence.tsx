import { createFileRoute } from "@tanstack/react-router";
import { LicenceBoard } from "@/components/licence-board";
import { getKitchen } from "@/lib/kitchen/server";

export const Route = createFileRoute("/licence")({
  loader: async () => ({ kitchen: await getKitchen() }),
  component: LicencePage,
});

function LicencePage() {
  const { kitchen } = Route.useLoaderData();
  const licenceKitchen = {
    ...kitchen,
    kitchen_name: "Garaunda Rasoi",
    address_line: "Eternity Ecstasy, Flat No -225, Mylsandra Road, Begur Post",
    city: "Bangalore, Karnataka",
    pincode: "560068",
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
        Mandatory display
      </p>
      <h1 className="mt-2 font-display text-4xl">Food licence</h1>
      <p className="mt-2 text-muted">
        Garaunda Rasoi is a registered petty food business operating from a
        residential kitchen. The licence is displayed here and on the premises.
      </p>
      <div className="mt-8">
        <LicenceBoard kitchen={licenceKitchen} framed />
      </div>
      <p className="mt-6 text-sm text-muted">
        Authority: {kitchen.licence_authority}. Questions: {kitchen.phone}.
      </p>
    </div>
  );
}
