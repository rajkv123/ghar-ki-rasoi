import { DAILY_KCAL_REF, kcalShare, type MacroTotals } from "@/lib/kitchen/calories";
import { formatKcal } from "@/lib/kitchen/format";
import { cn } from "@/lib/utils";

export function CalorieMeter({
  macros,
  compact,
}: {
  macros: MacroTotals;
  compact?: boolean;
}) {
  const share = kcalShare(macros.calories);
  return (
    <div className={cn("space-y-2", compact && "space-y-1.5")}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium tabular-nums">{formatKcal(macros.calories)}</p>
        <p className="text-xs text-muted tabular-nums">
          {share}% of {DAILY_KCAL_REF.toLocaleString("en-IN")} kcal
        </p>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-fg/10">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
          style={{ width: `${share}%` }}
        />
      </div>
      {!compact && (
        <dl className="grid grid-cols-3 gap-2 text-xs text-muted tabular-nums">
          <div>
            <dt className="text-subtle">Protein</dt>
            <dd className="font-medium text-fg">{macros.protein_g} g</dd>
          </div>
          <div>
            <dt className="text-subtle">Carbs</dt>
            <dd className="font-medium text-fg">{macros.carbs_g} g</dd>
          </div>
          <div>
            <dt className="text-subtle">Fat</dt>
            <dd className="font-medium text-fg">{macros.fat_g} g</dd>
          </div>
        </dl>
      )}
    </div>
  );
}
