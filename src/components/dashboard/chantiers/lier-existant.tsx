"use client";

import { useState, useTransition } from "react";
import { Loader2, Link2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Resultat = { ok: true } | { ok: false; erreur: string };

export function LierExistant({
  items,
  placeholder,
  onLier,
}: {
  items: { id: string; label: string }[];
  placeholder: string;
  onLier: (id: string) => Promise<Resultat>;
}) {
  const [selection, setSelection] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (items.length === 0) return null;

  function lier() {
    if (!selection) return;
    startTransition(async () => {
      const resultat = await onLier(selection);
      if (!resultat.ok) {
        toast.error(resultat.erreur);
        return;
      }
      setSelection(null);
    });
  }

  return (
    <div className="flex gap-2">
      <Select value={selection ?? undefined} onValueChange={setSelection}>
        <SelectTrigger className="h-9">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.id} value={item.id}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button type="button" size="sm" variant="outline" disabled={!selection || pending} onClick={lier}>
        {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Link2 className="size-3.5" />}
      </Button>
    </div>
  );
}
