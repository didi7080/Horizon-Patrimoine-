"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

export function WidgetCodeBlock({ code }: { code: string }) {
  const [copie, setCopie] = useState(false);

  async function copier() {
    try {
      await navigator.clipboard.writeText(code);
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch {
      // Presse-papier indisponible : le code reste sélectionnable manuellement.
    }
  }

  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-lg bg-foreground p-4 text-xs text-background">
        <code>{code}</code>
      </pre>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={copier}
        className="absolute right-2 top-2 bg-background"
      >
        {copie ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        {copie ? "Copié" : "Copier"}
      </Button>
    </div>
  );
}
