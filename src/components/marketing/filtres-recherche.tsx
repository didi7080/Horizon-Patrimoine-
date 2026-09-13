"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { METIERS } from "@/lib/metiers";

export function FiltresRecherche() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [metier, setMetier] = useState(searchParams.get("metier") ?? "");
  const [ville, setVille] = useState(searchParams.get("ville") ?? "");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (metier.trim()) params.set("metier", metier.trim());
    if (ville.trim()) params.set("ville", ville.trim());
    router.push(`/recherche${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-2 rounded-2xl border border-border bg-background p-2 shadow-sm sm:flex-row sm:items-center"
    >
      <div className="flex flex-1 items-center gap-2 px-2">
        <Search className="size-4 shrink-0 text-muted" />
        <Select value={metier} onValueChange={setMetier}>
          <SelectTrigger className="h-11 border-none px-0 shadow-none focus-visible:ring-0">
            <SelectValue placeholder="Tous les métiers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value=" ">Tous les métiers</SelectItem>
            {METIERS.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="hidden h-8 w-px bg-border sm:block" />
      <div className="flex flex-1 items-center gap-2 px-2">
        <MapPin className="size-4 shrink-0 text-muted" />
        <Input
          value={ville}
          onChange={(e) => setVille(e.target.value)}
          placeholder="Ville ou code postal"
          className="h-11 border-none px-0 shadow-none focus-visible:ring-0"
        />
      </div>
      <Button type="submit" size="lg" className="sm:w-auto">
        <Search className="size-4" />
        Rechercher
      </Button>
    </form>
  );
}
