"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Hammer } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Resultat = { ok: true } | { ok: false; erreur: string };

export function ChantierLien({
  chantiers,
  chantierActuel,
  onChange,
}: {
  chantiers: { id: string; titre: string }[];
  chantierActuel: { id: string; titre: string } | null;
  onChange: (chantierId: string | null) => Promise<Resultat>;
}) {
  const [pending, startTransition] = useTransition();

  if (chantiers.length === 0 && !chantierActuel) return null;

  function changer(valeur: string) {
    startTransition(async () => {
      const resultat = await onChange(valeur === "aucun" ? null : valeur);
      if (!resultat.ok) toast.error(resultat.erreur);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Hammer className="size-3.5 shrink-0 text-muted-foreground" />
      <Select value={chantierActuel?.id ?? "aucun"} onValueChange={changer} disabled={pending}>
        <SelectTrigger className="h-8 w-auto gap-1.5 border-none bg-transparent px-1.5 text-xs shadow-none hover:bg-surface">
          <SelectValue placeholder="Aucun chantier" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="aucun">Aucun chantier</SelectItem>
          {chantiers.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.titre}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {chantierActuel && (
        <Link href={`/dashboard/chantiers/${chantierActuel.id}`} className="text-xs text-muted hover:text-brand hover:underline">
          Voir
        </Link>
      )}
    </div>
  );
}
