import Link from "next/link";
import { Check, Circle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Etape = { label: string; fait: boolean; href: string };

export function OnboardingChecklist({ etapes }: { etapes: Etape[] }) {
  if (etapes.every((e) => e.fait)) return null;

  return (
    <Card className="p-5">
      <p className="font-semibold text-foreground">Finalisez la mise en place de votre page</p>
      <p className="mt-1 text-sm text-muted">
        Quelques étapes pour commencer à recevoir des rendez-vous.
      </p>
      <ul className="mt-4 space-y-2">
        {etapes.map((etape) => (
          <li key={etape.label}>
            <Link
              href={etape.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-surface",
                etape.fait ? "text-muted-foreground line-through" : "text-foreground",
              )}
            >
              {etape.fait ? (
                <Check className="size-4 shrink-0 text-success" />
              ) : (
                <Circle className="size-4 shrink-0 text-border-strong" />
              )}
              {etape.label}
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
