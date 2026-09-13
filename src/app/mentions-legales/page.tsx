import type { Metadata } from "next";
import { PageLegale } from "@/components/marketing/page-legale";
import { AvertissementModele } from "@/components/marketing/avertissement-modele";

export const metadata: Metadata = { title: "Mentions légales — ArtisanRDV" };

export default function MentionsLegalesPage() {
  return (
    <PageLegale titre="Mentions légales" maj="à compléter">
      <AvertissementModele />

      <h2>Éditeur du site</h2>
      <p>
        Le site ArtisanRDV est édité par [Raison sociale], [forme juridique] au capital de
        [montant] €, immatriculée au Registre du Commerce et des Sociétés de [ville] sous le
        numéro [SIREN/SIRET], dont le siège social est situé [adresse complète].
        <br />
        Numéro de TVA intracommunautaire : [numéro].
        <br />
        Directeur de la publication : [nom, prénom, qualité].
        <br />
        Contact : [adresse e-mail] — [numéro de téléphone].
      </p>

      <h2>Hébergement</h2>
      <p>
        Le site est hébergé par Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis.
        La base de données et les fonctions serveur sont hébergées par Supabase Inc.
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        L’ensemble des éléments présents sur le site ArtisanRDV (textes, graphismes, logo,
        interface) sont la propriété exclusive de [Raison sociale], sauf mention contraire, et
        sont protégés par le droit de la propriété intellectuelle. Toute reproduction ou
        représentation, totale ou partielle, sans autorisation préalable, est interdite.
      </p>

      <h2>Responsabilité</h2>
      <p>
        ArtisanRDV met à disposition des entreprises clientes un outil de prise de rendez-vous en
        ligne. Chaque entreprise reste seule responsable des informations qu’elle publie sur sa
        page (prestations, tarifs, disponibilités) et de la bonne exécution des prestations
        réservées par ses clients.
      </p>

      <h2>Médiation de la consommation</h2>
      <p>
        Conformément à l’article L.616-1 du Code de la consommation, [Raison sociale] propose un
        dispositif de médiation de la consommation. L’entité de médiation retenue est [nom du
        médiateur]. En cas de litige, vous pouvez déposer votre réclamation sur son site : [lien].
      </p>
    </PageLegale>
  );
}
