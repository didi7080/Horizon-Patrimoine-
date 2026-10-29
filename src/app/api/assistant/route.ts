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

  return { entreprise: membership.entreprise, plan: planEffectif(abonnement?.plan, membership.entreprise.nb_salaries) };
}

function systemPrompt(entreprise: { nom: string; metier: string | null }): string {
  return `Tu es l'assistant IA d'ArtisanRDV, intégré au tableau de bord de l'entreprise "${entreprise.nom}"${entreprise.metier ? ` (métier : ${entreprise.metier})` : ""}.

Tu aides un artisan indépendant ou une petite entreprise du bâtiment/services en France avec :
- des questions administratives, juridiques, techniques et réglementaires (TVA et taux applicables, mentions obligatoires sur devis/factures, assurance décennale et RC pro, statut juridique, URSSAF, auto-entrepreneur, RGE, garanties légales, DTU, normes du métier...) ;
- des actions concrètes dans l'application, via les outils à ta disposition : consulter le chiffre d'affaires et les factures d'un mois (bilan_mensuel), lister les clients (lister_clients), lister les devis/factures récents (lister_documents_recents), créer un nouveau devis (creer_devis).

Règles :
- Réponds en français, de façon directe et concise (c'est un chat, pas un rapport).
- Utilise un outil dès qu'une question porte sur des données réelles de l'entreprise (chiffre d'affaires, clients, factures) ou qu'on te demande de créer un document — ne réponds jamais "je ne sais pas" sur ces sujets sans avoir essayé l'outil correspondant.
- Pour créer un devis, si une information indispensable manque (nom du client, au moins une ligne avec désignation/quantité/prix), demande-la avant d'appeler l'outil.
- Sur les questions juridiques, fiscales ou réglementaires : donne une réponse utile et concrète, mais rappelle que les taux, seuils et obligations évoluent et que les décisions importantes (montants engageants, litiges, choix de statut) méritent une confirmation par un comptable ou un professionnel du droit. Ne l'affirme pas à chaque message, seulement quand c'est pertinent.
- N'invente jamais de chiffres : s'ils proviennent de l'application, ils doivent venir d'un outil.`;
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
  const ctxOutils = { entrepriseId: contexte.entreprise.id as string };

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
