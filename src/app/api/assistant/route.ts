import { NextResponse } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { planEffectif, accesOutilsCalcul } from "@/lib/stripe";
import { getAnthropic, assistantConfigure, MODELE_ASSISTANT } from "@/lib/assistant/client";
import { OUTILS_DEFINITIONS, executerOutil } from "@/lib/assistant/outils";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_TOURS_OUTILS = 5;
const MAX_MESSAGES_HISTORIQUE = 20;

async function contexteRequete() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership } = await supabase
    .from("memberships")
    .select("entreprise:entreprises(id, nom, metier, nb_salaries)")
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
  - Facturation : bilan_mensuel (CA, encaissé, charges, résultat net), lister_clients, rechercher_client (coordonnées + historique d'un client précis), lister_documents_recents, creer_devis, creer_facture (facture directe, sans devis), convertir_devis_en_facture (transforme un devis accepté en facture avec les mêmes lignes), changer_statut_document (marquer payée, accepté, refusé...), lister_documents_impayes (factures en retard de paiement), relancer_document (prépare un message de relance pour un devis sans réponse ou une facture impayée), enregistrer_depense.
  - Planning : lister_rendez_vous, bloquer_creneau (créer un rendez-vous confirmé), modifier_statut_rendez_vous (annuler, marquer honoré/absent).
  - Équipe : lister_salaries, ajouter_absence (congé/indisponibilité), lister_prestations.

Règles générales :
- Réponds en français, de façon directe et concise (c'est un chat, pas un rapport). Pas de blabla avant d'agir : si une demande est claire et complète, exécute l'action directement puis confirme ce qui a été fait.
- Utilise un outil dès qu'une question porte sur des données réelles de l'entreprise (chiffre d'affaires, clients, factures, planning, équipe) ou qu'on te demande de créer, modifier ou annuler quelque chose — ne réponds jamais "je ne sais pas" sur ces sujets sans avoir essayé l'outil correspondant, et n'invente jamais un chiffre, un numéro de document ou un identifiant : tout ce qui vient de l'application doit venir d'un outil.
- Ne redemande jamais une information que tu peux déjà déduire du contexte (date du jour, historique de la conversation, résultat d'un outil précédent dans le même échange).

Précision et zéro erreur :
- Avant toute action qui modifie des données (créer, annuler, changer un statut, enregistrer une dépense, bloquer un créneau), vérifie que tu as bien toutes les informations obligatoires de l'outil correspondant ; s'il en manque une, pose une question ciblée au lieu de supposer une valeur par défaut hasardeuse (un montant, un nom, une date ne se devinent jamais).
- Si un outil renvoie un champ "erreur", ne le cache pas et n'invente pas de résultat de remplacement : explique le problème à l'utilisateur en français clair et, si c'est pertinent, propose la correction (ex. reformuler une date, choisir parmi une liste).
- Si un outil te répond qu'il faut préciser quel salarié, quel client, quelle prestation ou quel document (plusieurs possibilités existent, ou aucune ne correspond), pose la question à l'utilisateur avec la liste proposée au lieu de deviner ou d'inventer un identifiant.
- Dans une entreprise avec plusieurs salariés, ne choisis jamais à qui affecter un rendez-vous ou une absence sans que ce soit clair dans la demande ou confirmé par l'utilisateur.
- Pour créer un devis ou une facture, si une information indispensable manque (nom du client, au moins une ligne avec désignation/quantité/prix), demande-la avant d'appeler l'outil. Si le client est déjà connu (nom déjà utilisé précédemment), inutile de redemander son adresse ou son téléphone : l'outil le retrouve automatiquement.
- Pour transformer un devis en facture, utilise toujours convertir_devis_en_facture avec son numéro plutôt que de recréer une facture de zéro — ça évite les ressaisies et les erreurs de montant.
- Pour bloquer un créneau ou poser une absence, il faut au minimum un client (pour un rendez-vous) ou une période de dates (pour une absence) ; demande ces informations si elles manquent.
- Pour annuler ou modifier un rendez-vous ou un devis/une facture dont tu n'as pas déjà l'identifiant ou le numéro exact, retrouve-le d'abord via lister_rendez_vous ou lister_documents_recents/rechercher_client, puis agis avec l'identifiant obtenu — ne demande jamais à l'utilisateur de te donner lui-même un identifiant technique.
- Pour une demande de relance (devis sans réponse, facture impayée), utilise relancer_document : il te donne un message prêt à l'emploi et les coordonnées du client. Si l'outil indique que l'envoi automatique n'est pas configuré, donne quand même le message complet à l'utilisateur pour qu'il puisse le copier-coller et l'envoyer lui-même ; ne dis jamais que tu as "envoyé" un e-mail que tu n'as pas réellement envoyé.
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

  let messagesEntrants: MessageEntrant[];
  try {
    const corps = await request.json();
    messagesEntrants = corps.messages;
    if (!Array.isArray(messagesEntrants)) throw new Error();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }
  messagesEntrants = messagesEntrants.slice(-MAX_MESSAGES_HISTORIQUE);

  const messages: Anthropic.MessageParam[] = messagesEntrants.map((m) => ({ role: m.role, content: m.content }));
  const ctxOutils = { entrepriseId: contexte.entreprise.id as string, userId: contexte.userId };

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
