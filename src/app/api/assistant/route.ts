import { NextResponse } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { planEffectif, accesOutilsCalcul } from "@/lib/stripe";
import { getAnthropic, assistantConfigure, MODELE_ASSISTANT } from "@/lib/assistant/client";
import { OUTILS_DEFINITIONS, executerOutil } from "@/lib/assistant/outils";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_TOURS_OUTILS = 5;
const MAX_MESSAGES_HISTORIQUE = 20;
const MAX_APPELS_PAR_MINUTE = 20;

/**
 * Outils qui créent, modifient ou envoient quelque chose de réel (document,
 * e-mail, rendez-vous...) : l'IA ne les exécute jamais directement, elle
 * s'arrête et attend une confirmation explicite de l'artisan dans le chat.
 */
const OUTILS_CONFIRMATION_REQUISE = new Set([
  "creer_devis",
  "creer_facture",
  "convertir_devis_en_facture",
  "relancer_document",
  "envoyer_email_client",
  "bloquer_creneau",
  "modifier_statut_rendez_vous",
  "changer_statut_document",
  "enregistrer_depense",
  "ajouter_absence",
]);

const SEUIL_MONTANT_ELEVE_DOCUMENT_EUROS = 20_000;
const SEUIL_MONTANT_ELEVE_DEPENSE_EUROS = 5_000;

function totalApproximatifTTC(lignes: unknown): number {
  if (!Array.isArray(lignes)) return 0;
  return lignes.reduce((somme: number, l) => {
    const ligne = l as { quantite?: number; prix_unitaire_euros?: number; taux_tva?: number };
    const ht = (Number(ligne.quantite) || 0) * (Number(ligne.prix_unitaire_euros) || 0);
    const tva = ligne.taux_tva ?? 20;
    return somme + ht * (1 + tva / 100);
  }, 0);
}

/** Résumé en français de l'action en attente, montré à l'artisan avant qu'il ne confirme ou annule. */
function resumeAction(nom: string, input: Record<string, unknown>): string {
  const texte = (v: unknown) => (typeof v === "string" ? v : "");
  switch (nom) {
    case "creer_devis":
    case "creer_facture": {
      const total = totalApproximatifTTC(input.lignes);
      const alerte = total > SEUIL_MONTANT_ELEVE_DOCUMENT_EUROS ? " ⚠️ Montant important, vérifie-le bien avant de confirmer." : "";
      return `Créer un ${nom === "creer_devis" ? "devis" : "facture"} d'environ ${total.toFixed(2)} € TTC pour ${texte(input.client_nom) || "ce client"}.${alerte}`;
    }
    case "convertir_devis_en_facture":
      return `Convertir le devis ${texte(input.numero_devis)} en facture.`;
    case "relancer_document":
      return `Envoyer une relance par e-mail pour le document ${texte(input.numero)}.`;
    case "envoyer_email_client":
      return `Envoyer un e-mail à ${texte(input.client_nom)} — objet : « ${texte(input.objet)} ».`;
    case "bloquer_creneau":
      return `Bloquer un créneau le ${texte(input.date)} à ${texte(input.heure)} pour ${texte(input.client_nom)}.`;
    case "modifier_statut_rendez_vous":
      return `Changer le statut du rendez-vous vers « ${texte(input.nouveau_statut)} ».`;
    case "changer_statut_document":
      return `Changer le statut du document ${texte(input.numero)} vers « ${texte(input.nouveau_statut)} ».`;
    case "enregistrer_depense": {
      const montant = Number(input.montant_euros) || 0;
      const alerte = montant > SEUIL_MONTANT_ELEVE_DEPENSE_EUROS ? " ⚠️ Montant important, vérifie-le bien avant de confirmer." : "";
      return `Enregistrer une dépense de ${montant.toFixed(2)} € (${texte(input.categorie)}).${alerte}`;
    }
    case "ajouter_absence":
      return `Marquer une absence du ${texte(input.date_debut)} au ${texte(input.date_fin)}.`;
    default:
      return `Exécuter l'action « ${nom} ».`;
  }
}

type BlocOutilAttente = { id: string; name: string; input: Record<string, unknown> };

type EntreeConfirmation = {
  approuve: boolean;
  suite: Anthropic.MessageParam[];
  resultatsSurs: Anthropic.ToolResultBlockParam[];
  blocsEnAttente: BlocOutilAttente[];
};

async function contexteRequete() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership } = await supabase
    .from("memberships")
    .select("role, entreprise:entreprises(id, nom, metier, nb_salaries)")
    .eq("profile_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!membership || !membership.entreprise) return null;

  const { data: abonnement } = await supabase
    .from("abonnements")
    .select("plan")
    .eq("entreprise_id", membership.entreprise.id)
    .maybeSingle();

  return {
    userId: user.id,
    role: membership.role,
    entreprise: membership.entreprise,
    plan: planEffectif(abonnement?.plan, membership.entreprise.nb_salaries),
  };
}

function dateDuJourParis(): { iso: string; libelle: string } {
  const maintenant = new Date();
  const iso = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(maintenant);
  const libelle = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(maintenant);
  return { iso, libelle };
}

function systemPrompt(entreprise: { nom: string; metier: string | null }): string {
  const { iso, libelle } = dateDuJourParis();
  return `Tu es l'assistant IA d'ArtisanRDV, intégré au tableau de bord de l'entreprise "${entreprise.nom}"${entreprise.metier ? ` (métier : ${entreprise.metier})` : ""}.

Nous sommes le ${libelle} (${iso}, heure de Paris). Utilise cette date comme référence pour "aujourd'hui", "demain", "la semaine prochaine", etc. — ne la demande jamais à l'utilisateur.

Tu aides un artisan indépendant ou une petite entreprise du bâtiment/services en France avec :
- des questions administratives, juridiques, techniques et réglementaires (TVA et taux applicables, mentions obligatoires sur devis/factures, assurance décennale et RC pro, statut juridique, URSSAF, auto-entrepreneur, RGE, garanties légales, DTU, normes du métier...) ;
- des actions concrètes dans l'application, quelle que soit la taille de l'entreprise (un artisan seul ou une équipe de plusieurs salariés), via les outils à ta disposition :
  - Facturation : bilan_mensuel (CA, encaissé, charges, résultat net), lister_clients, rechercher_client (coordonnées + historique d'un client précis), lister_documents_recents, creer_devis, creer_facture (facture directe, sans devis), convertir_devis_en_facture (transforme un devis accepté en facture avec les mêmes lignes), changer_statut_document (marquer payée, accepté, refusé...), lister_documents_impayes (factures en retard de paiement), relancer_document (relance un devis sans réponse ou une facture impayée, par e-mail automatique si configuré), envoyer_email_client (envoie un e-mail libre à un client déjà enregistré, pour toute autre demande — ex. informer d'un retard, confirmer un rendez-vous, répondre à une question), enregistrer_depense, lister_depenses (résumé des charges par catégorie, détail, et notes de frais de salariés en attente de validation).
  - Planning : lister_rendez_vous, bloquer_creneau (créer un rendez-vous confirmé), modifier_statut_rendez_vous (annuler, marquer honoré/absent).
  - Équipe : lister_salaries, ajouter_absence (congé/indisponibilité), lister_prestations.
  - Outils de calcul (Premium) : lister_modules_calcul, creer_module_calcul (crée un module sur mesure — champs + formules — à partir d'une description libre de l'artisan), calculer_etude (calcule immédiatement avec un module existant, et enregistre le résultat comme étude si un client est précisé).

Règles générales :
- Réponds en français, de façon directe et concise (c'est un chat, pas un rapport). Pas de blabla avant d'agir : si une demande est claire et complète, exécute l'action directement puis confirme ce qui a été fait.
- Utilise un outil dès qu'une question porte sur des données réelles de l'entreprise (chiffre d'affaires, clients, factures, planning, équipe) ou qu'on te demande de créer, modifier ou annuler quelque chose — ne réponds jamais "je ne sais pas" sur ces sujets sans avoir essayé l'outil correspondant, et n'invente jamais un chiffre, un numéro de document ou un identifiant : tout ce qui vient de l'application doit venir d'un outil.
- Ne redemande jamais une information que tu peux déjà déduire du contexte (date du jour, historique de la conversation, résultat d'un outil précédent dans le même échange).
- Quand on te demande un résumé des dépenses/charges (pour soi ou pour le comptable), utilise lister_depenses : donne le total et le détail par catégorie, signale s'il y a des notes de frais de salariés en attente de validation (et leur montant), et rappelle que la page /dashboard/depenses propose un bouton "Imprimer / Enregistrer en PDF" pour obtenir un document à transmettre au comptable.

Précision et zéro erreur :
- Avant toute action qui modifie des données (créer, annuler, changer un statut, enregistrer une dépense, bloquer un créneau), vérifie que tu as bien toutes les informations obligatoires de l'outil correspondant ; s'il en manque une, pose une question ciblée au lieu de supposer une valeur par défaut hasardeuse (un montant, un nom, une date ne se devinent jamais).
- Si un outil renvoie un champ "erreur", ne le cache pas et n'invente pas de résultat de remplacement : explique le problème à l'utilisateur en français clair et, si c'est pertinent, propose la correction (ex. reformuler une date, choisir parmi une liste).
- Si un outil te répond qu'il faut préciser quel salarié, quel client, quelle prestation ou quel document (plusieurs possibilités existent, ou aucune ne correspond), pose la question à l'utilisateur avec la liste proposée au lieu de deviner ou d'inventer un identifiant.
- Dans une entreprise avec plusieurs salariés, ne choisis jamais à qui affecter un rendez-vous ou une absence sans que ce soit clair dans la demande ou confirmé par l'utilisateur.
- Pour créer un devis ou une facture, si une information indispensable manque (nom du client, au moins une ligne avec désignation/quantité/prix), demande-la avant d'appeler l'outil. Si le client est déjà connu (nom déjà utilisé précédemment), inutile de redemander son adresse ou son téléphone : l'outil le retrouve automatiquement.
- Pour transformer un devis en facture, utilise toujours convertir_devis_en_facture avec son numéro plutôt que de recréer une facture de zéro — ça évite les ressaisies et les erreurs de montant.
- Pour bloquer un créneau ou poser une absence, il faut au minimum un client (pour un rendez-vous) ou une période de dates (pour une absence) ; demande ces informations si elles manquent.
- Chaque métier a ses propres formules : n'impose jamais un module tout fait si l'artisan décrit les siennes, crée-les exactement comme demandé avec creer_module_calcul. Ne calcule jamais un résultat chiffré toi-même de tête : passe toujours par calculer_etude, qui fait le calcul réel côté application — si l'outil renvoie une erreur sur une formule (identifiant inconnu, mauvais ordre), corrige et réessaie sans redemander à l'utilisateur de reformuler lui-même sa demande.
- Pour annuler ou modifier un rendez-vous ou un devis/une facture dont tu n'as pas déjà l'identifiant ou le numéro exact, retrouve-le d'abord via lister_rendez_vous ou lister_documents_recents/rechercher_client, puis agis avec l'identifiant obtenu — ne demande jamais à l'utilisateur de te donner lui-même un identifiant technique.
- Pour une demande de relance (devis sans réponse, facture impayée), utilise relancer_document. Pour toute autre demande d'e-mail à un client (informer, confirmer, répondre), utilise envoyer_email_client en rédigeant toi-même un objet et un message clairs et professionnels adaptés à la demande. Dans les deux cas, le champ "envoye" de la réponse de l'outil te dit si l'e-mail a réellement été envoyé : si envoye vaut true, confirme-le à l'utilisateur ; si c'est false (envoi non configuré ou échec), donne-lui quand même le message complet pour qu'il puisse le copier-coller et l'envoyer lui-même. Ne dis jamais avoir "envoyé" un e-mail quand le résultat de l'outil indique le contraire.
- Avant d'envoyer un e-mail à un client avec envoyer_email_client, si le contenu n'est pas évident à déduire de la demande (ton, informations précises à inclure), reformule brièvement ton intention à l'utilisateur plutôt que d'envoyer directement un message que tu as inventé de toutes pièces.
- Sur les questions juridiques, fiscales ou réglementaires : donne une réponse utile et concrète, mais rappelle que les taux, seuils et obligations évoluent et que les décisions importantes (montants engageants, litiges, choix de statut) méritent une confirmation par un comptable ou un professionnel du droit. Ne l'affirme pas à chaque message, seulement quand c'est pertinent.`;
}

type MessageEntrant = { role: "user" | "assistant"; content: string };

export async function POST(request: Request) {
  const contexte = await contexteRequete();
  if (!contexte) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }
  if (!accesOutilsCalcul(contexte.plan)) {
    return NextResponse.json({ error: "L'assistant IA nécessite la formule Premium." }, { status: 403 });
  }
  if (!assistantConfigure()) {
    return NextResponse.json({ error: "L'assistant IA n'est pas encore configuré sur cette instance ArtisanRDV." }, { status: 501 });
  }
  const anthropic = getAnthropic()!;

  const admin = createAdminClient();
  if (admin) {
    const { data: compteur } = await admin.rpc("verifier_limite_assistant", {
      p_entreprise_id: contexte.entreprise.id,
      p_max: MAX_APPELS_PAR_MINUTE,
      p_fenetre_secondes: 60,
    });
    if (typeof compteur === "number" && compteur > MAX_APPELS_PAR_MINUTE) {
      return NextResponse.json({ error: "Trop de messages envoyés d'affilée, réessaie dans une minute." }, { status: 429 });
    }
  }

  let corps: { messages?: MessageEntrant[]; confirmation?: EntreeConfirmation };
  try {
    corps = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const ctxOutils = { entrepriseId: contexte.entreprise.id as string, userId: contexte.userId, role: contexte.role };

  let messages: Anthropic.MessageParam[];
  if (corps.confirmation) {
    const { approuve, suite, resultatsSurs, blocsEnAttente } = corps.confirmation;
    if (!Array.isArray(suite) || !Array.isArray(blocsEnAttente)) {
      return NextResponse.json({ error: "Requête de confirmation invalide." }, { status: 400 });
    }
    const resultatsAttente: Anthropic.ToolResultBlockParam[] = [];
    for (const bloc of blocsEnAttente) {
      if (approuve) {
        const resultat = await executerOutil(ctxOutils, bloc.name, bloc.input);
        resultatsAttente.push({ type: "tool_result", tool_use_id: bloc.id, content: JSON.stringify(resultat) });
      } else {
        resultatsAttente.push({
          type: "tool_result",
          tool_use_id: bloc.id,
          content: JSON.stringify({
            annule: true,
            message: "L'utilisateur a annulé cette action. Ne la relance pas sans qu'il le redemande explicitement.",
          }),
        });
      }
    }
    messages = [...suite, { role: "user", content: [...(resultatsSurs ?? []), ...resultatsAttente] }];
  } else {
    let messagesEntrants = corps.messages;
    if (!Array.isArray(messagesEntrants)) {
      return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
    }
    messagesEntrants = messagesEntrants.slice(-MAX_MESSAGES_HISTORIQUE);
    messages = messagesEntrants.map((m) => ({ role: m.role, content: m.content }));
  }

  try {
    for (let tour = 0; tour < MAX_TOURS_OUTILS; tour++) {
      const reponse = await anthropic.messages.create({
        model: MODELE_ASSISTANT,
        max_tokens: 1536,
        system: systemPrompt(contexte.entreprise),
        tools: OUTILS_DEFINITIONS,
        messages,
      });

      const blocsOutils = reponse.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");

      if (blocsOutils.length === 0 || reponse.stop_reason !== "tool_use") {
        const texte = reponse.content
          .filter((b): b is Anthropic.TextBlock => b.type === "text")
          .map((b) => b.text)
          .join("\n")
          .trim();
        return NextResponse.json({ reply: texte || "Désolé, je n'ai pas pu formuler de réponse." });
      }

      messages.push({ role: "assistant", content: reponse.content });

      const blocsGates = blocsOutils.filter((b) => OUTILS_CONFIRMATION_REQUISE.has(b.name));
      if (blocsGates.length > 0) {
        const blocsSurs = blocsOutils.filter((b) => !OUTILS_CONFIRMATION_REQUISE.has(b.name));
        const resultatsSurs: Anthropic.ToolResultBlockParam[] = [];
        for (const bloc of blocsSurs) {
          const resultat = await executerOutil(ctxOutils, bloc.name, bloc.input);
          resultatsSurs.push({ type: "tool_result", tool_use_id: bloc.id, content: JSON.stringify(resultat) });
        }
        return NextResponse.json({
          confirmation: { resume: blocsGates.map((b) => resumeAction(b.name, b.input as Record<string, unknown>)).join("\n") },
          suite: messages,
          resultatsSurs,
          blocsEnAttente: blocsGates.map((b) => ({ id: b.id, name: b.name, input: b.input as Record<string, unknown> })),
        });
      }

      const resultats: Anthropic.ToolResultBlockParam[] = [];
      for (const bloc of blocsOutils) {
        const resultat = await executerOutil(ctxOutils, bloc.name, bloc.input);
        resultats.push({ type: "tool_result", tool_use_id: bloc.id, content: JSON.stringify(resultat) });
      }
      messages.push({ role: "user", content: resultats });
    }

    return NextResponse.json({ reply: "Je n'ai pas réussi à finaliser la réponse, peux-tu reformuler ta demande ?" });
  } catch (err) {
    console.error("Erreur assistant IA:", err);
    return NextResponse.json({ error: "L'assistant a rencontré une erreur. Réessaie dans un instant." }, { status: 500 });
  }
}
