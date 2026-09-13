import type { Metadata } from "next";
import { PageLegale } from "@/components/marketing/page-legale";
import { AvertissementModele } from "@/components/marketing/avertissement-modele";

export const metadata: Metadata = { title: "CGU / CGV — ArtisanRDV" };

export default function CguCgvPage() {
  return (
    <PageLegale titre="Conditions générales d’utilisation et de vente" maj="à compléter">
      <AvertissementModele />

      <h2>Objet</h2>
      <p>
        Les présentes conditions régissent l’accès et l’utilisation du service ArtisanRDV, une
        plateforme de prise de rendez-vous en ligne éditée par [Raison sociale], à destination des
        artisans et entreprises de services (ci-après « le Client »).
      </p>

      <h2>Description du service</h2>
      <p>
        ArtisanRDV permet au Client de créer une page de réservation en ligne, de gérer son
        agenda, son équipe et ses prestations, et de recevoir des rendez-vous de la part de ses
        propres clients, y compris via un widget intégrable sur son propre site internet.
      </p>

      <h2>Inscription et essai gratuit</h2>
      <p>
        L’inscription donne accès à une période d’essai gratuite de 14 jours, sans engagement ni
        moyen de paiement requis. À l’issue de cette période, l’accès aux fonctionnalités peut
        être limité jusqu’à la souscription d’un abonnement payant.
      </p>

      <h2>Tarifs et paiement</h2>
      <p>
        Les tarifs en vigueur sont ceux affichés sur la page [artisanrdv.com/tarifs] au moment de
        la souscription. L’abonnement est mensuel, sans engagement de durée, résiliable à tout
        moment depuis l’espace client. Le paiement est traité par Stripe ; le Client autorise le
        prélèvement récurrent du montant de son abonnement.
      </p>

      <h2>Obligations du Client</h2>
      <p>
        Le Client est seul responsable de l’exactitude des informations publiées sur sa page
        (prestations, tarifs, disponibilités) et de la bonne exécution des rendez-vous pris par
        ses clients. Le Client s’engage à ne pas utiliser le service à des fins illicites.
      </p>

      <h2>Disponibilité et responsabilité</h2>
      <p>
        [Raison sociale] met en œuvre les moyens raisonnables pour assurer la disponibilité du
        service, sans garantie de continuité absolue. La responsabilité de [Raison sociale] ne
        saurait être engagée en cas de dommage indirect résultant de l’utilisation du service.
      </p>

      <h2>Résiliation</h2>
      <p>
        Le Client peut résilier son abonnement à tout moment depuis son espace de gestion. La
        résiliation prend effet à la fin de la période de facturation en cours. [Raison sociale]
        peut suspendre ou résilier un compte en cas de manquement grave aux présentes conditions.
      </p>

      <h2>Droit applicable</h2>
      <p>
        Les présentes conditions sont soumises au droit français. Tout litige relatif à leur
        interprétation ou leur exécution relève de la compétence exclusive des tribunaux du
        ressort de [ville du siège social], sauf disposition légale contraire applicable aux
        consommateurs.
      </p>
    </PageLegale>
  );
}
