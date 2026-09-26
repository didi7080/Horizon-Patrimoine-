import Link from "next/link";
import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAdminContext } from "@/lib/admin/context";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const { email } = await getAdminContext();

  return (
    <div className="min-h-screen bg-surface">
      <header className="flex h-16 items-center justify-between border-b border-border bg-background px-4 lg:px-8">
        <div className="flex items-center gap-3">
          <Link href="/admin">
            <Logo />
          </Link>
          <Badge variant="info">Espace plateforme</Badge>
        </div>
        <div className="flex items-center gap-3">
          <p className="hidden text-sm text-muted sm:block">{email}</p>
          <form action="/deconnexion" method="post">
            <Button variant="ghost" size="sm" type="submit">
              Déconnexion
            </Button>
          </form>
        </div>
      </header>
      <main className="p-4 lg:p-8">{children}</main>
    </div>
  );
}
