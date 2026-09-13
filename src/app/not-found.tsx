import Link from "next/link";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center bg-surface px-4 py-20">
        <div className="text-center">
          <p className="text-sm font-semibold text-brand">Erreur 404</p>
          <h1 className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl">
            Cette page n’existe pas ou n’est plus disponible
          </h1>
          <p className="mt-2 text-muted">
            Vérifiez le lien, ou repartez depuis l’accueil.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button asChild>
              <Link href="/">Retour à l’accueil</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/recherche">Trouver un artisan</Link>
            </Button>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
