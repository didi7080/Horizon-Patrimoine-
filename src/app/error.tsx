"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-danger-light text-danger">
        <AlertTriangle className="size-7" />
      </div>
      <h1 className="mt-4 text-xl font-semibold text-foreground">Une erreur est survenue</h1>
      <p className="mt-2 max-w-sm text-sm text-muted">
        Le problème a été enregistré. Vous pouvez réessayer ou revenir à l’accueil.
      </p>
      <div className="mt-6 flex gap-3">
        <Button onClick={reset}>Réessayer</Button>
        <Button asChild variant="outline">
          <Link href="/">Accueil</Link>
        </Button>
      </div>
    </div>
  );
}
