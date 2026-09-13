import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Logo } from "@/components/logo";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getEntrepriseContext } from "@/lib/dashboard/context";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const { entreprise, role } = await getEntrepriseContext();

  return (
    <div className="min-h-screen bg-surface lg:flex">
      <aside className="border-b border-border bg-background lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r">
        <div className="flex h-16 items-center justify-between px-4 lg:px-5">
          <Link href="/dashboard">
            <Logo />
          </Link>
        </div>
        <div className="hidden px-5 pb-2 lg:block">
          <div className="flex items-center gap-2">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: entreprise.couleur }}
            />
            <p className="truncate text-sm font-medium text-foreground">{entreprise.nom}</p>
          </div>
          <Badge variant="neutral" className="mt-2 capitalize">
            {role === "owner" ? "Propriétaire" : role === "admin" ? "Administrateur" : "Salarié"}
          </Badge>
        </div>
        <DashboardNav />
      </aside>

      <div className="flex-1">
        <header className="flex h-16 items-center justify-between border-b border-border bg-background px-4 lg:px-8">
          <p className="text-sm text-muted lg:hidden">{entreprise.nom}</p>
          <div className="ml-auto flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/e/${entreprise.slug}`} target="_blank">
                Voir ma page publique <ExternalLink className="size-3.5" />
              </Link>
            </Button>
            <form action="/deconnexion" method="post">
              <Button variant="ghost" size="sm" type="submit">
                Déconnexion
              </Button>
            </form>
          </div>
        </header>
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
