import { Label } from "@/components/ui/label";
import { useRef, useState } from "react";

export async function compressImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  const max = 960;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not read this image");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  let quality = 0.82;
  let url = canvas.toDataURL("image/jpeg", quality);
  while (url.length > 380_000 && quality > 0.5) {
    quality -= 0.08;
    url = canvas.toDataURL("image/jpeg", quality);
  }
  return url;
}

export function ImageUpload({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        {value ? (
          <img src={value} alt="" className="size-16 rounded-md object-cover" />
        ) : (
          <div className="grid size-16 place-items-center rounded-md bg-fg/8 text-xs text-muted">
            Photo
          </div>
        )}
        <button
          type="button"
          className="text-sm font-medium underline-offset-4 hover:underline"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          {busy ? "Compressing…" : value ? "Replace photo" : "Upload photo"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            setBusy(true);
            setError(null);
            try {
              onChange(await compressImage(file));
            } catch {
              setError("Could not read that photo");
            } finally {
              setBusy(false);
            }
          }}
        />
      </div>
      {error && <p className="text-xs text-primary">{error}</p>}
    </div>
  );
}
