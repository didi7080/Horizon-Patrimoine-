import { CheckCircle2, XCircle } from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 0;

export default async function DesabonnementPage({ params }: PageProps<"/desabonnement/[token]">) {
  const { token } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("desabonner_client_public", { p_token: token });
  const resultat = data as { client_nom: string; entreprise_nom: string } | null;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 bg-surface py-16">
        <div className="mx-auto max-w-md px-4 sm:px-6">
          {resultat && !error ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-background p-10 text-center">
              <CheckCircle2 className="size-8 text-success" />
              <p className="font-medium text-foreground">Vous êtes désabonné(e)</p>
              <p className="text-sm text-muted">
                Vous ne recevrez plus d&apos;actualités par e-mail de {resultat.entreprise_nom}.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-background p-10 text-center">
              <XCircle className="size-8 text-muted-foreground" />
              <p className="font-medium text-foreground">Lien invalide</p>
              <p className="text-sm text-muted">Ce lien de désabonnement n&apos;est plus valide.</p>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
