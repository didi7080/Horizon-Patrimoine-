import type { Metadata } from "next";
import Link from "next/link";
import { PageLegale } from "@/components/marketing/page-legale";
import { AvertissementModele } from "@/components/marketing/avertissement-modele";

export const metadata: Metadata = { title: "Confidentialité — ArtisanRDV" };

export default function ConfidentialitePage() {
  return (
    <PageLegale titre="Politique de confidentialité" maj="8 novembre 2026">
      <AvertissementModele>
        L’identité complète de l’éditeur (SIRET, adresse) doit encore être complétée sur la page
        des mentions légales — à faire valider par un professionnel du droit avant un usage
        commercial à grande échelle.
      </AvertissementModele>

      <h2>Responsable du traitement</h2>
      <p>
        ArtisanRDV (voir l’identité complète sur les{" "}
        <Link href="/mentions-legales">mentions légales</Link>) est responsable du traitement des
        données personnelles décrites ci-dessous, au sens du Règlement général sur la protection
        des données (RGPD). Pour toute question, contactez contact@artisanrdv.com.
      </p>

      <h2>Données collectées</h2>
      <ul>
        <li>
          <strong>Compte artisan</strong> : nom, e-mail, téléphone, informations de l’entreprise
          (nom, adresse, métier).
        </li>
        <li>
          <strong>Prise de rendez-vous</strong> : nom, e-mail, téléphone et, le cas échéant,
          adresse d’intervention du client final, saisis lors d’une réservation.
        </li>
        <li>
          <strong>Assistant IA</strong> (formule Premium) : les questions posées et les documents
          générés via l’assistant sont transmis à Anthropic, fournisseur du modèle d’intelligence
          artificielle, pour produire la réponse.
        </li>
        <li>
          <strong>Facturation</strong> : les informations de paiement sont traitées directement
          par Stripe, qui agit en tant que sous-traitant ; ArtisanRDV ne stocke aucune donnée de
          carte bancaire.
        </li>
        <li>
          <strong>Cookies</strong> : uniquement des cookies strictement nécessaires au
          fonctionnement du service (maintien de la session de connexion, protection anti-robot
          Cloudflare Turnstile). Aucun cookie publicitaire ou de mesure d’audience tiers n’est
          déposé à ce jour.
        </li>
      </ul>

      <h2>Finalités et base légale</h2>
      <p>
        Ces données sont traitées pour permettre la prise de rendez-vous, la gestion de la
        relation entre l’artisan et ses clients, l’envoi de rappels et de notifications liés aux
        rendez-vous, et la facturation de l’abonnement. Le traitement repose sur l’exécution du
        contrat conclu avec l’entreprise cliente et, pour les clients finaux, sur l’intérêt
        légitime lié à la bonne exécution du rendez-vous demandé.
      </p>

      <h2>Sous-traitants</h2>
      <p>
        Les données sont hébergées et traitées par les prestataires suivants, chacun lié par un
        contrat de sous-traitance conforme au RGPD : Supabase (base de données et authentification,
        hébergées à Paris, France), Vercel (hébergement de l’application), Resend (envoi des
        e-mails transactionnels), Stripe (paiement et facturation), Cloudflare (protection
        anti-robot Turnstile), Google (synchronisation d’agenda, uniquement si l’artisan l’active),
        et Anthropic (assistant IA, formule Premium uniquement).
      </p>

      <h2>Durée de conservation</h2>
      <p>
        Les données sont conservées pendant toute la durée de la relation contractuelle avec
        l’entreprise cliente, puis archivées pendant les durées légales applicables (notamment en
        matière comptable), avant suppression ou anonymisation.
      </p>

      <h2>Vos droits</h2>
      <p>
        Conformément au RGPD, vous disposez d’un droit d’accès, de rectification, d’effacement,
        de limitation, d’opposition et de portabilité sur vos données. Pour l’exercer, contactez
        contact@artisanrdv.com. Vous disposez également du droit d’introduire une réclamation
        auprès de la CNIL (www.cnil.fr).
      </p>
    </PageLegale>
  );
}
