import type { Metadata } from "next";
import { PageLegale } from "@/components/marketing/page-legale";
import { AvertissementModele } from "@/components/marketing/avertissement-modele";

export const metadata: Metadata = { title: "Mentions légales — ArtisanRDV" };

export default function MentionsLegalesPage() {
  return (
    <PageLegale titre="Mentions légales" maj="8 novembre 2026">
      <AvertissementModele>
        Il manque encore l’adresse de l’entreprise et votre régime de TVA (indiqués entre
        crochets ci-dessous) — à compléter, puis à faire valider par un professionnel du droit
        avant un usage commercial à grande échelle.
      </AvertissementModele>

      <h2>Éditeur du site</h2>
      <p>
        Le site ArtisanRDV est édité par Dimitri Pelcy, entrepreneur individuel exerçant sous le
        nom commercial « ArtisanRDV », immatriculé au Registre National des Entreprises (RNE) sous
        le numéro SIRET 993400811, domicilié [adresse à compléter].
        <br />
        Régime de TVA : [à préciser — par exemple « TVA non applicable, article 293 B du Code
        général des impôts » si vous êtes en franchise en base].
        <br />
        Directeur de la publication : Dimitri Pelcy.
        <br />
        Contact : contact@artisanrdv.com — 07 70 05 84 16.
      </p>

      <h2>Hébergement</h2>
      <p>
        Le site est hébergé par Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis
        (support : vercel.com/support). La base de données et les fonctions serveur sont hébergées
        par Supabase, sur un centre de données situé à Paris (France).
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        L’ensemble des éléments présents sur le site ArtisanRDV (textes, graphismes, logo,
        interface) sont la propriété exclusive de l’éditeur mentionné ci-dessus, sauf mention
        contraire, et sont protégés par le droit de la propriété intellectuelle. Toute reproduction
        ou représentation, totale ou partielle, sans autorisation préalable, est interdite.
      </p>

      <h2>Responsabilité</h2>
      <p>
        ArtisanRDV met à disposition des entreprises clientes un outil de prise de rendez-vous en
        ligne. Chaque entreprise reste seule responsable des informations qu’elle publie sur sa
        page (prestations, tarifs, disponibilités) et de la bonne exécution des prestations
        réservées par ses clients.
      </p>
    </PageLegale>
  );
}
