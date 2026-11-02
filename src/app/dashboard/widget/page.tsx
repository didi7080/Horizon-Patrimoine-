import { headers } from "next/headers";
import { Download, MapPin, MessageCircle, Share2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WidgetCodeBlock } from "@/components/dashboard/widget-code-block";
import { WidgetEnvoyerEmail } from "@/components/dashboard/widget-envoyer-email";
import { WidgetDomainePersonnalise } from "@/components/dashboard/widget-domaine-personnalise";
import { getEntrepriseContext } from "@/lib/dashboard/context";
import { genererQrCodeDataUrl } from "@/lib/qrcode";
import { emailConfigure } from "@/lib/email/client";
import { codeBoutonWidget, lienReservation } from "@/lib/widget";
import { vercelConfigure } from "@/lib/vercel-domains";

export const revalidate = 0;

export default async function WidgetPage() {
  const { entreprise } = await getEntrepriseContext();
  const h = await headers();
  const origine = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;

  const lien = lienReservation(origine, entreprise.slug);
  const qrCode = await genererQrCodeDataUrl(lien);
  const peutEnvoyerParEmail = emailConfigure();
  const peutDomainePersonnalise = vercelConfigure();

  const codeBouton = codeBoutonWidget(origine, entreprise.slug, entreprise.couleur);
  const codeInline = `<div data-artisanrdv-inline="${entreprise.slug}"></div>\n<script src="${origine}/widget.js" async></script>`;
  const codeIframe = `<iframe src="${origine}/embed/${entreprise.slug}" style="width:100%;border:0;min-height:480px" title="Prendre rendez-vous"></iframe>`;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Widget & site web</h1>
        <p className="mt-1 text-muted">
          Permettez à vos clients de réserver en ligne, où qu&apos;ils vous trouvent — même sans site
          internet ni connaissances techniques.
        </p>
      </div>

      <Card className="space-y-4 p-6">
        <div>
          <h2 className="font-semibold text-foreground">Le plus simple : votre lien de réservation</h2>
          <p className="mt-1 text-sm text-muted">
            Un seul lien, à coller partout où vos clients vous trouvent déjà — pas besoin de site
            internet ni de code.
          </p>
        </div>
        <WidgetCodeBlock code={lien} />
        <div className="grid gap-2 text-sm text-muted sm:grid-cols-3">
          <p className="flex items-start gap-1.5">
            <MapPin className="mt-0.5 size-3.5 shrink-0 text-brand" /> Dans le champ « Site web » de
            votre fiche Google (Google Maps / Google Business Profile)
          </p>
          <p className="flex items-start gap-1.5">
            <Share2 className="mt-0.5 size-3.5 shrink-0 text-brand" /> Dans le bouton « Réserver »
            de votre page Facebook ou Instagram
          </p>
          <p className="flex items-start gap-1.5">
            <MessageCircle className="mt-0.5 size-3.5 shrink-0 text-brand" /> Par SMS ou e-mail,
            directement à un client
          </p>
        </div>
      </Card>

      <Card className="space-y-4 p-6">
        <div>
          <h2 className="font-semibold text-foreground">Un QR code à imprimer</h2>
          <p className="mt-1 text-sm text-muted">
            À coller sur votre camion, votre devanture ou vos cartes de visite. Vos clients le
            scannent avec l&apos;appareil photo de leur téléphone et arrivent directement sur votre page
            de réservation.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element -- data URL générée côté serveur, pas une image optimisable par next/image */}
          <img src={qrCode} alt="QR code vers la page de réservation" className="size-40 rounded-lg border border-border" />
          <Button asChild variant="outline">
            <a href={qrCode} download={`qr-code-${entreprise.slug}.png`}>
              <Download className="size-4" /> Télécharger le QR code
            </a>
          </Button>
        </div>
      </Card>

      <div>
        <h2 className="font-semibold text-foreground">Vous avez un site internet ?</h2>
        <p className="mt-1 text-sm text-muted">
          Si vous ne savez pas comment ajouter du code à votre site, pas de souci : chaque bloc
          ci-dessous peut être envoyé par e-mail à la personne qui s&apos;occupe de votre site (un
          prestataire, un proche...), elle saura où le placer.
        </p>
      </div>

      <Card className="space-y-3 p-6">
        <h3 className="font-semibold text-foreground">Bouton flottant sur votre site</h3>
        <p className="text-sm text-muted">
          Un bouton « Prendre rendez-vous » apparaît en bas de vos pages et ouvre la réservation
          dans une fenêtre, sans quitter votre site. À coller avant la balise{" "}
          <code className="rounded bg-surface px-1 py-0.5">{"</body>"}</code>.
        </p>
        <WidgetCodeBlock code={codeBouton} />
        {peutEnvoyerParEmail && <WidgetEnvoyerEmail titre="Bouton flottant ArtisanRDV" code={codeBouton} />}
      </Card>

      <Card className="space-y-3 p-6">
        <h3 className="font-semibold text-foreground">Bloc intégré dans une page</h3>
        <p className="text-sm text-muted">
          Affiche la réservation directement à l’endroit choisi de votre page (ex. une page
          « Contact » ou « Rendez-vous »).
        </p>
        <WidgetCodeBlock code={codeInline} />
        {peutEnvoyerParEmail && <WidgetEnvoyerEmail titre="Bloc intégré ArtisanRDV" code={codeInline} />}
      </Card>

      <Card className="space-y-3 p-6">
        <h3 className="font-semibold text-foreground">Iframe classique</h3>
        <p className="text-sm text-muted">
          Pour les créateurs de site qui n’acceptent pas les scripts personnalisés (certains
          constructeurs de site imposent cette limite).
        </p>
        <WidgetCodeBlock code={codeIframe} />
        {peutEnvoyerParEmail && <WidgetEnvoyerEmail titre="Iframe ArtisanRDV" code={codeIframe} />}
      </Card>

      {peutDomainePersonnalise && (
        <Card className="space-y-3 p-6">
          <div>
            <h3 className="font-semibold text-foreground">Aller plus loin : votre propre nom de domaine</h3>
            <p className="mt-1 text-sm text-muted">
              Totalement optionnel — les options ci-dessus suffisent largement pour la plupart des
              artisans. Celle-ci affiche votre page de réservation sous votre propre nom de domaine
              (ex. rdv.mon-site.fr) au lieu d&apos;artisanrdv.com. Elle demande une petite
              manipulation technique (DNS), qu&apos;on peut transférer à qui gère votre site.
            </p>
          </div>
          <WidgetDomainePersonnalise
            domaineActuel={entreprise.domaine_personnalise}
            peutEnvoyerParEmail={peutEnvoyerParEmail}
          />
        </Card>
      )}
    </div>
  );
}
