import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="ArtisanRDV — accueil">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-muted md:flex">
          <Link href="/recherche" className="transition-colors hover:text-foreground">
            Trouver un artisan
          </Link>
          <Link href="/pour-les-artisans" className="transition-colors hover:text-foreground">
            Pour les artisans
          </Link>
          <Link href="/tarifs" className="transition-colors hover:text-foreground">
            Tarifs
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <Button asChild size="sm">
              <Link href="/dashboard">Tableau de bord</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href="/connexion">Connexion</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/inscription">Essai gratuit</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
