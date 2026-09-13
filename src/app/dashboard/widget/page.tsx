import { headers } from "next/headers";
import { Card } from "@/components/ui/card";
import { WidgetCodeBlock } from "@/components/dashboard/widget-code-block";
import { getEntrepriseContext } from "@/lib/dashboard/context";

export const revalidate = 0;

export default async function WidgetPage() {
  const { entreprise } = await getEntrepriseContext();
  const h = await headers();
  const origine = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;

  const codeBouton = `<script src="${origine}/widget.js" data-artisanrdv="${entreprise.slug}" data-color="${entreprise.couleur}" data-label="Prendre rendez-vous" async></script>`;
  const codeInline = `<div data-artisanrdv-inline="${entreprise.slug}"></div>\n<script src="${origine}/widget.js" async></script>`;
  const codeIframe = `<iframe src="${origine}/embed/${entreprise.slug}" style="width:100%;border:0;min-height:480px" title="Prendre rendez-vous"></iframe>`;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Widget & site web</h1>
        <p className="mt-1 text-muted">
          Ajoutez la prise de rendez-vous directement sur votre propre site internet.
        </p>
      </div>

      <Card className="space-y-3 p-6">
        <h2 className="font-semibold text-foreground">Votre page de réservation</h2>
        <p className="text-sm text-muted">
          Le lien à partager par SMS, e-mail ou sur vos réseaux sociaux :
        </p>
        <WidgetCodeBlock code={`${origine}/e/${entreprise.slug}`} />
      </Card>

      <Card className="space-y-3 p-6">
        <h2 className="font-semibold text-foreground">Bouton flottant sur votre site</h2>
        <p className="text-sm text-muted">
          Un bouton « Prendre rendez-vous » apparaît en bas de vos pages et ouvre la réservation
          dans une fenêtre, sans quitter votre site. À coller avant la balise{" "}
          <code className="rounded bg-surface px-1 py-0.5">{"</body>"}</code>.
        </p>
        <WidgetCodeBlock code={codeBouton} />
      </Card>

      <Card className="space-y-3 p-6">
        <h2 className="font-semibold text-foreground">Bloc intégré dans une page</h2>
        <p className="text-sm text-muted">
          Affiche la réservation directement à l’endroit choisi de votre page (ex. une page
          « Contact » ou « Rendez-vous »).
        </p>
        <WidgetCodeBlock code={codeInline} />
      </Card>

      <Card className="space-y-3 p-6">
        <h2 className="font-semibold text-foreground">Iframe classique</h2>
        <p className="text-sm text-muted">
          Pour les créateurs de site qui n’acceptent pas les scripts personnalisés (certains
          constructeurs de site imposent cette limite).
        </p>
        <WidgetCodeBlock code={codeIframe} />
      </Card>
    </div>
  );
}
