export const DAILY_KCAL_REF = 2000;

export type MacroTotals = {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
};

export function sumMacros(
  lines: Array<MacroTotals & { qty?: number }>,
): MacroTotals {
  return lines.reduce(
    (acc, line) => {
      const qty = line.qty ?? 1;
      acc.calories += line.calories * qty;
      acc.protein_g += line.protein_g * qty;
      acc.carbs_g += line.carbs_g * qty;
      acc.fat_g += line.fat_g * qty;
      return acc;
    },
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
  );
}

export function kcalShare(calories: number, ref = DAILY_KCAL_REF): number {
  if (ref <= 0) return 0;
  return Math.min(100, Math.round((calories / ref) * 100));
}

export function kcalFromMacros(protein_g: number, carbs_g: number, fat_g: number): number {
  return protein_g * 4 + carbs_g * 4 + fat_g * 9;
}
