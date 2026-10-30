import type Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculerTotaux, type LigneDocument } from "@/lib/documents/types";
import { calculerBilanMensuel, bornesMois, moisCourant, libelleMois } from "@/lib/bilan/types";
import { creerDocument, enregistrerLignesDocument, changerStatutDocument } from "@/app/dashboard/documents/actions";

export const OUTILS_DEFINITIONS: Anthropic.Tool[] = [
  {
    name: "bilan_mensuel",
    description:
      "Calcule le bilan de facturation (chiffre d'affaires) d'un mois donné : total facturé, encaissé, en attente, devis émis. Utilise ceci pour répondre à toute question sur le CA, les factures ou les devis d'une période.",
    input_schema: {
      type: "object",
      properties: {
        mois: {
          type: "string",
          description: "Mois au format AAAA-MM (ex. 2026-09). Si absent, utilise le mois en cours.",
        },
      },
    },
  },
  {
    name: "lister_clients",
    description: "Liste les clients enregistrés de l'entreprise, avec un lien d'export CSV complet.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "lister_documents_recents",
    description: "Liste les devis et factures les plus récents de l'entreprise (par défaut les 10 derniers).",
    input_schema: {
      type: "object",
      properties: {
        limite: { type: "integer", description: "Nombre de documents à renvoyer (par défaut 10, max 50)." },
      },
    },
  },
  {
    name: "creer_devis",
    description:
      "Crée un nouveau devis dans ArtisanRDV pour un client, avec ses lignes de prestation, et renvoie le lien du devis créé. Si le client n'existe pas encore, il est automatiquement ajouté au fichier clients.",
    input_schema: {
      type: "object",
      properties: {
        client_nom: { type: "string", description: "Nom du client." },
        client_adresse: { type: "string" },
        client_telephone: { type: "string" },
        client_email: { type: "string" },
        notes: { type: "string", description: "Conditions particulières ou notes pour le client." },
        lignes: {
          type: "array",
          description: "Lignes du devis.",
          items: {
            type: "object",
            properties: {
              designation: { type: "string" },
              unite: { type: "string", description: "Ex. heure, forfait, u, m². Par défaut 'u'." },
              quantite: { type: "number" },
              prix_unitaire_euros: { type: "number", description: "Prix unitaire HT en euros (pas en centimes)." },
              taux_tva: { type: "number", description: "0, 5.5, 10 ou 20. Par défaut 20." },
            },
            required: ["designation", "quantite", "prix_unitaire_euros"],
          },
        },
      },
      required: ["client_nom", "lignes"],
    },
  },
  {
    name: "bloquer_creneau",
    description:
      "Bloque un créneau de rendez-vous dans le planning, directement confirmé (sans passer par la réservation publique). Si le client n'existe pas encore, il est ajouté au fichier clients. Si plusieurs salariés ou prestations existent et qu'il faut préciser lequel, l'outil renvoie la liste des choix possibles au lieu de deviner.",
    input_schema: {
      type: "object",
      properties: {
        client_nom: { type: "string", description: "Nom du client pour qui ce rendez-vous est bloqué." },
        client_adresse: { type: "string" },
        client_telephone: { type: "string" },
        client_email: { type: "string" },
        salarie_nom: {
          type: "string",
          description: "Nom de la personne de l'entreprise à qui affecter ce créneau. Optionnel s'il n'y a qu'un seul salarié.",
        },
        prestation_nom: {
          type: "string",
          description: "Type d'intervention, si elle correspond à une prestation existante de l'entreprise.",
        },
        date: { type: "string", description: "Date au format AAAA-MM-JJ." },
        heure: { type: "string", description: "Heure de début au format HH:MM (24h), heure de Paris." },
        duree_minutes: {
          type: "integer",
          description: "Durée en minutes si aucune prestation ne correspond au type d'intervention. Par défaut 60.",
        },
        notes: { type: "string" },
      },
      required: ["client_nom", "date", "heure"],
    },
  },
  {
    name: "lister_rendez_vous",
    description:
      "Liste les rendez-vous du planning sur une période (aujourd'hui, les 7 prochains jours ou les 30 prochains jours), avec leur identifiant exact (nécessaire pour les annuler ou changer leur statut avec modifier_statut_rendez_vous).",
    input_schema: {
      type: "object",
      properties: {
        periode: {
          type: "string",
          enum: ["aujourd_hui", "semaine", "mois"],
          description: "Période à lister, par défaut 'semaine' (7 prochains jours).",
        },
        salarie_nom: { type: "string", description: "Filtre optionnel sur le nom du salarié." },
        statut: {
          type: "string",
          enum: ["confirme", "demande", "annule", "honore", "absent"],
          description: "Filtre optionnel sur le statut. Par défaut : confirme et demande (rendez-vous actifs).",
        },
      },
    },
  },
  {
    name: "modifier_statut_rendez_vous",
    description:
      "Change le statut d'un rendez-vous existant (par exemple pour l'annuler, le marquer honoré ou absent). Nécessite l'identifiant exact du rendez-vous, obtenu via lister_rendez_vous.",
    input_schema: {
      type: "object",
      properties: {
        rendez_vous_id: { type: "string" },
        nouveau_statut: { type: "string", enum: ["confirme", "annule", "honore", "absent"] },
      },
      required: ["rendez_vous_id", "nouveau_statut"],
    },
  },
  {
    name: "ajouter_absence",
    description:
      "Marque un salarié indisponible sur une période (congé, maladie, rendez-vous personnel...). Les rendez-vous déjà prévus sur cette période ne sont pas annulés automatiquement : l'outil signale ceux en conflit pour que tu puisses les traiter.",
    input_schema: {
      type: "object",
      properties: {
        salarie_nom: { type: "string", description: "Optionnel s'il n'y a qu'un seul salarié dans l'entreprise." },
        date_debut: { type: "string", description: "Date de début au format AAAA-MM-JJ." },
        date_fin: { type: "string", description: "Date de fin (incluse) au format AAAA-MM-JJ." },
        motif: { type: "string" },
      },
      required: ["date_debut", "date_fin"],
    },
  },
  {
    name: "lister_salaries",
    description: "Liste les membres de l'équipe (salariés actifs) de l'entreprise.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "lister_prestations",
    description: "Liste les prestations (types d'intervention) proposées par l'entreprise, avec durée et prix.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "changer_statut_document",
    description:
      "Change le statut d'un devis ou d'une facture existant·e (ex. marquer une facture comme payée, un devis comme accepté), en le retrouvant par son numéro (ex. F-2026-0001).",
    input_schema: {
      type: "object",
      properties: {
        numero: { type: "string", description: "Numéro exact du document, ex. F-2026-0001 ou D-2026-0001." },
        nouveau_statut: {
          type: "string",
          enum: ["brouillon", "envoye", "envoyee", "accepte", "refuse", "payee"],
          description: "Pour un devis : brouillon/envoye/accepte/refuse. Pour une facture : brouillon/envoyee/payee.",
        },
      },
      required: ["numero", "nouveau_statut"],
    },
  },
  {
    name: "enregistrer_depense",
    description: "Enregistre une nouvelle dépense professionnelle (charge) pour l'entreprise : matériel, carburant, assurance, etc.",
    input_schema: {
      type: "object",
      properties: {
        categorie: { type: "string", description: "Ex. Matériel & fournitures, Véhicule & carburant, Assurance, Outillage, Autre." },
        montant_euros: { type: "number", description: "Montant TTC en euros." },
        date: { type: "string", description: "Date au format AAAA-MM-JJ. Par défaut aujourd'hui." },
        description: { type: "string" },
      },
      required: ["categorie", "montant_euros"],
    },
  },
];

type ContexteOutils = { entrepriseId: string; userId: string };
type AdminClient = NonNullable<ReturnType<typeof createAdminClient>>;

/** Retrouve un salarié actif par nom approximatif ; renseigne les choix possibles en cas d'ambiguïté. */
async function resoudreSalarie(
  admin: AdminClient,
  entrepriseId: string,
  salarieNom: string | undefined,
): Promise<{ id: string } | { erreur: string; salaries_disponibles: string[] }> {
  const { data: salaries } = await admin.from("salaries").select("id, nom").eq("entreprise_id", entrepriseId).eq("actif", true);
  const liste = salaries ?? [];
  if (salarieNom?.trim()) {
    const correspondants = liste.filter((s) => s.nom.toLowerCase().includes(salarieNom.trim().toLowerCase()));
    if (correspondants.length === 0) {
      return { erreur: "Aucun salarié ne correspond à ce nom.", salaries_disponibles: liste.map((s) => s.nom) };
    }
    if (correspondants.length > 1) {
      return { erreur: "Plusieurs salariés correspondent, précise lequel.", salaries_disponibles: correspondants.map((s) => s.nom) };
    }
    return { id: correspondants[0].id };
  }
  if (liste.length === 1) return { id: liste[0].id };
  return { erreur: "Précise à quel salarié te référer.", salaries_disponibles: liste.map((s) => s.nom) };
}

function estErreurResolution(resultat: { id: string } | { erreur: string; salaries_disponibles: string[] }): resultat is {
  erreur: string;
  salaries_disponibles: string[];
} {
  return "erreur" in resultat;
}

async function outilBilanMensuel(ctx: ContexteOutils, input: { mois?: string }) {
  const mois = input.mois?.trim() || moisCourant();
  const { debut, fin } = bornesMois(mois);
  const admin = createAdminClient();
  if (!admin) return { erreur: "Base de données non configurée." };

  const [{ data: documents, error }, { data: depenses, error: erreurDepenses }] = await Promise.all([
    admin
      .from("documents")
      .select("id, type, numero, client_nom, date_emission, statut, lignes")
      .eq("entreprise_id", ctx.entrepriseId)
      .gte("date_emission", debut)
      .lt("date_emission", fin),
    admin.from("depenses").select("montant_cents").eq("entreprise_id", ctx.entrepriseId).gte("date", debut).lt("date", fin),
  ]);
  if (error) return { erreur: error.message };
  if (erreurDepenses) return { erreur: erreurDepenses.message };

  const bilan = calculerBilanMensuel(mois, documents ?? [], depenses ?? []);
  return {
    mois,
    libelle: libelleMois(mois),
    total_facture_ttc_euros: bilan.totalFactureTTC / 100,
    total_encaisse_ttc_euros: bilan.totalEncaisseTTC / 100,
    total_en_attente_ttc_euros: bilan.totalEnAttenteTTC / 100,
    nombre_factures: bilan.factures.length,
    nombre_devis_emis: bilan.nbDevisEmis,
    total_devis_ttc_euros: bilan.totalDevisTTC / 100,
    total_charges_euros: bilan.totalCharges / 100,
    resultat_net_euros: bilan.resultatNet / 100,
    lien_rapport_pdf: `/dashboard/bilan?mois=${mois}`,
  };
}

async function outilListerClients(ctx: ContexteOutils) {
  const admin = createAdminClient();
  if (!admin) return { erreur: "Base de données non configurée." };
  const { data, error } = await admin
    .from("clients")
    .select("nom, email, telephone, adresse")
    .eq("entreprise_id", ctx.entrepriseId)
    .order("nom");
  if (error) return { erreur: error.message };
  return { nombre_clients: data?.length ?? 0, clients: data ?? [], lien_export_csv: "/api/export/clients" };
}

async function outilListerDocumentsRecents(ctx: ContexteOutils, input: { limite?: number }) {
  const limite = Math.min(Math.max(input.limite ?? 10, 1), 50);
  const admin = createAdminClient();
  if (!admin) return { erreur: "Base de données non configurée." };
  const { data, error } = await admin
    .from("documents")
    .select("id, type, numero, client_nom, date_emission, statut, lignes")
    .eq("entreprise_id", ctx.entrepriseId)
    .order("created_at", { ascending: false })
    .limit(limite);
  if (error) return { erreur: error.message };
  return (data ?? []).map((d) => {
    const totaux = calculerTotaux((d.lignes as LigneDocument[] | null) ?? []);
    return {
      type: d.type,
      numero: d.numero,
      client: d.client_nom,
      date_emission: d.date_emission,
      statut: d.statut,
      total_ttc_euros: totaux.totalTTC / 100,
      lien: `/dashboard/documents/${d.id}`,
    };
  });
}

type LigneEntree = {
  designation: string;
  unite?: string;
  quantite: number;
  prix_unitaire_euros: number;
  taux_tva?: number;
};

async function outilCreerDevis(
  ctx: ContexteOutils,
  input: {
    client_nom: string;
    client_adresse?: string;
    client_telephone?: string;
    client_email?: string;
    notes?: string;
    lignes: LigneEntree[];
  },
) {
  if (!input.client_nom?.trim()) return { erreur: "Le nom du client est requis." };
  if (!input.lignes || input.lignes.length === 0) return { erreur: "Au moins une ligne est requise." };

  const formData = new FormData();
  formData.set("clientNom", input.client_nom);
  if (input.client_adresse) formData.set("clientAdresse", input.client_adresse);
  if (input.client_telephone) formData.set("clientTelephone", input.client_telephone);
  if (input.client_email) formData.set("clientEmail", input.client_email);

  const documentId = await creerDocument("devis", formData);

  const lignes: LigneDocument[] = input.lignes.map((l, i) => ({
    id: `ia_${i}_${Math.random().toString(36).slice(2, 8)}`,
    designation: l.designation,
    unite: l.unite?.trim() || "u",
    quantite: l.quantite,
    prixUnitaireCents: Math.round(l.prix_unitaire_euros * 100),
    tauxTva: l.taux_tva ?? 20,
  }));

  await enregistrerLignesDocument(documentId, JSON.stringify(lignes), {
    clientNom: input.client_nom,
    clientAdresse: input.client_adresse ?? "",
    clientTelephone: input.client_telephone ?? "",
    clientEmail: input.client_email ?? "",
    dateValidite: "",
    dateEcheance: "",
    datePrestation: "",
    notes: input.notes ?? "",
  });

  const totaux = calculerTotaux(lignes);
  return {
    cree: true,
    total_ttc_euros: totaux.totalTTC / 100,
    lien: `/dashboard/documents/${documentId}`,
  };
}

async function outilEnregistrerDepense(
  ctx: ContexteOutils,
  input: { categorie: string; montant_euros: number; date?: string; description?: string },
) {
  if (!input.categorie?.trim()) return { erreur: "La catégorie est requise." };
  if (!Number.isFinite(input.montant_euros) || input.montant_euros <= 0) {
    return { erreur: "Le montant doit être supérieur à 0." };
  }
  const admin = createAdminClient();
  if (!admin) return { erreur: "Base de données non configurée." };
  const { error } = await admin.from("depenses").insert({
    entreprise_id: ctx.entrepriseId,
    categorie: input.categorie.trim(),
    montant_cents: Math.round(input.montant_euros * 100),
    date: input.date?.trim() || new Date().toISOString().slice(0, 10),
    description: input.description?.trim() || null,
  });
  if (error) return { erreur: error.message };
  return { enregistre: true, lien: "/dashboard/depenses" };
}

/** Convertit une date+heure locale (Europe/Paris) en ISO avec décalage horaire explicite. */
export function parisVersIso(date: string, heure: string): string {
  const reference = new Date(`${date}T${heure}:00Z`);
  const partieDecalage = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Paris",
    timeZoneName: "shortOffset",
  })
    .formatToParts(reference)
    .find((p) => p.type === "timeZoneName");
  const correspondance = partieDecalage?.value.match(/GMT([+-]\d+)/);
  const decalage = correspondance ? Number(correspondance[1]) : 1;
  const signe = decalage >= 0 ? "+" : "-";
  return `${date}T${heure}:00${signe}${String(Math.abs(decalage)).padStart(2, "0")}:00`;
}

async function outilListerRendezVous(ctx: ContexteOutils, input: { periode?: string; salarie_nom?: string; statut?: string }) {
  const admin = createAdminClient();
  if (!admin) return { erreur: "Base de données non configurée." };

  let salarieId: string | undefined;
  if (input.salarie_nom?.trim()) {
    const resolution = await resoudreSalarie(admin, ctx.entrepriseId, input.salarie_nom);
    if (estErreurResolution(resolution)) return resolution;
    salarieId = resolution.id;
  }

  const maintenant = new Date();
  const horizonJours = input.periode === "aujourd_hui" ? 1 : input.periode === "mois" ? 30 : 7;
  const fin = new Date(maintenant.getTime() + horizonJours * 24 * 60 * 60 * 1000);

  let requete = admin
    .from("rendez_vous")
    .select("id, debut, fin, statut, adresse_client, clients(nom), salaries(nom), prestations(nom)")
    .eq("entreprise_id", ctx.entrepriseId)
    .gte("debut", maintenant.toISOString())
    .lt("debut", fin.toISOString());
  if (salarieId) requete = requete.eq("salarie_id", salarieId);
  requete = input.statut
    ? requete.eq("statut", input.statut as "confirme" | "demande" | "annule" | "honore" | "absent")
    : requete.in("statut", ["confirme", "demande"]);

  const { data, error } = await requete.order("debut");
  if (error) return { erreur: error.message };

  type RdvJoint = {
    id: string;
    debut: string;
    fin: string;
    statut: string;
    adresse_client: string | null;
    clients: { nom: string } | null;
    salaries: { nom: string } | null;
    prestations: { nom: string } | null;
  };
  return ((data ?? []) as unknown as RdvJoint[]).map((r) => ({
    id: r.id,
    debut: r.debut,
    fin: r.fin,
    statut: r.statut,
    client: r.clients?.nom ?? null,
    salarie: r.salaries?.nom ?? null,
    prestation: r.prestations?.nom ?? null,
    adresse: r.adresse_client,
  }));
}

const STATUTS_RDV_VALIDES = new Set(["confirme", "annule", "honore", "absent"]);

async function outilModifierStatutRendezVous(ctx: ContexteOutils, input: { rendez_vous_id: string; nouveau_statut: string }) {
  if (!input.rendez_vous_id) return { erreur: "L'identifiant du rendez-vous est requis." };
  if (!STATUTS_RDV_VALIDES.has(input.nouveau_statut)) return { erreur: "Statut invalide." };
  const admin = createAdminClient();
  if (!admin) return { erreur: "Base de données non configurée." };
  const { data, error } = await admin
    .from("rendez_vous")
    .update({ statut: input.nouveau_statut as "confirme" | "annule" | "honore" | "absent" })
    .eq("id", input.rendez_vous_id)
    .eq("entreprise_id", ctx.entrepriseId)
    .select("id");
  if (error) return { erreur: error.message };
  if (!data || data.length === 0) return { erreur: "Rendez-vous introuvable." };
  return { modifie: true, lien: "/dashboard/rendez-vous" };
}

async function outilAjouterAbsence(
  ctx: ContexteOutils,
  input: { salarie_nom?: string; date_debut: string; date_fin: string; motif?: string },
) {
  if (!input.date_debut || !input.date_fin) return { erreur: "Les dates de début et de fin sont requises." };
  const admin = createAdminClient();
  if (!admin) return { erreur: "Base de données non configurée." };

  const resolution = await resoudreSalarie(admin, ctx.entrepriseId, input.salarie_nom);
  if (estErreurResolution(resolution)) return resolution;
  const salarieId = resolution.id;

  const debut = new Date(parisVersIso(input.date_debut, "00:00"));
  const fin = new Date(parisVersIso(input.date_fin, "23:59"));
  if (Number.isNaN(debut.getTime()) || Number.isNaN(fin.getTime()) || fin <= debut) {
    return { erreur: "Dates invalides." };
  }

  const { error } = await admin.from("absences").insert({
    salarie_id: salarieId,
    debut: debut.toISOString(),
    fin: fin.toISOString(),
    motif: input.motif?.trim() || null,
  });
  if (error) return { erreur: error.message };

  const { data: rdvConflits } = await admin
    .from("rendez_vous")
    .select("id, debut, clients(nom)")
    .eq("salarie_id", salarieId)
    .in("statut", ["confirme", "demande"])
    .gte("debut", debut.toISOString())
    .lte("debut", fin.toISOString());

  type RdvConflit = { id: string; debut: string; clients: { nom: string } | null };
  return {
    enregistre: true,
    rendez_vous_en_conflit: ((rdvConflits ?? []) as unknown as RdvConflit[]).map((r) => ({
      id: r.id,
      debut: r.debut,
      client: r.clients?.nom ?? null,
    })),
    lien: "/dashboard/equipe",
  };
}

async function outilListerSalaries(ctx: ContexteOutils) {
  const admin = createAdminClient();
  if (!admin) return { erreur: "Base de données non configurée." };
  const { data, error } = await admin
    .from("salaries")
    .select("nom, fonction")
    .eq("entreprise_id", ctx.entrepriseId)
    .eq("actif", true)
    .order("nom");
  if (error) return { erreur: error.message };
  return { salaries: data ?? [] };
}

async function outilListerPrestations(ctx: ContexteOutils) {
  const admin = createAdminClient();
  if (!admin) return { erreur: "Base de données non configurée." };
  const { data, error } = await admin
    .from("prestations")
    .select("nom, duree_min, prix_cents")
    .eq("entreprise_id", ctx.entrepriseId)
    .eq("actif", true)
    .order("nom");
  if (error) return { erreur: error.message };
  return {
    prestations: (data ?? []).map((p) => ({
      nom: p.nom,
      duree_minutes: p.duree_min,
      prix_euros: p.prix_cents !== null ? p.prix_cents / 100 : null,
    })),
  };
}

async function outilChangerStatutDocument(ctx: ContexteOutils, input: { numero: string; nouveau_statut: string }) {
  if (!input.numero?.trim()) return { erreur: "Le numéro du document est requis." };
  const admin = createAdminClient();
  if (!admin) return { erreur: "Base de données non configurée." };
  const { data: document, error } = await admin
    .from("documents")
    .select("id")
    .eq("entreprise_id", ctx.entrepriseId)
    .eq("numero", input.numero.trim())
    .maybeSingle();
  if (error) return { erreur: error.message };
  if (!document) return { erreur: "Aucun document avec ce numéro." };
  try {
    await changerStatutDocument(document.id, input.nouveau_statut);
  } catch (err) {
    return { erreur: err instanceof Error ? err.message : "Erreur lors du changement de statut." };
  }
  return { modifie: true, lien: `/dashboard/documents/${document.id}` };
}

async function outilBloquerCreneau(
  ctx: ContexteOutils,
  input: {
    client_nom: string;
    client_adresse?: string;
    client_telephone?: string;
    client_email?: string;
    salarie_nom?: string;
    prestation_nom?: string;
    date: string;
    heure: string;
    duree_minutes?: number;
    notes?: string;
  },
) {
  if (!input.client_nom?.trim()) return { erreur: "Le nom du client est requis." };
  if (!input.date || !input.heure) return { erreur: "La date et l'heure sont requises." };

  const admin = createAdminClient();
  if (!admin) return { erreur: "Base de données non configurée." };

  const resolutionSalarie = await resoudreSalarie(admin, ctx.entrepriseId, input.salarie_nom);
  if (estErreurResolution(resolutionSalarie)) return resolutionSalarie;
  const salarieId = resolutionSalarie.id;

  let prestationId: string | null = null;
  let dureeMinutes = input.duree_minutes ?? 60;
  if (input.prestation_nom?.trim()) {
    const { data: prestations } = await admin
      .from("prestations")
      .select("id, nom, duree_min")
      .eq("entreprise_id", ctx.entrepriseId)
      .eq("actif", true);
    const correspondantes = (prestations ?? []).filter((p) =>
      p.nom.toLowerCase().includes(input.prestation_nom!.trim().toLowerCase()),
    );
    if (correspondantes.length === 1) {
      prestationId = correspondantes[0].id;
      dureeMinutes = correspondantes[0].duree_min;
    }
    // Sinon (aucune ou plusieurs correspondances) : on continue sans lier de prestation, avec la durée fournie.
  }

  const debutIso = parisVersIso(input.date, input.heure);
  const debut = new Date(debutIso);
  if (Number.isNaN(debut.getTime())) return { erreur: "Date ou heure invalide." };
  const fin = new Date(debut.getTime() + dureeMinutes * 60_000);

  const { data: entrepriseRow } = await admin.from("entreprises").select("battement_min").eq("id", ctx.entrepriseId).maybeSingle();
  const battementMs = (entrepriseRow?.battement_min ?? 0) * 60_000;

  const { data: rdvExistants } = await admin
    .from("rendez_vous")
    .select("debut, fin")
    .eq("salarie_id", salarieId)
    .in("statut", ["confirme", "demande"]);
  const chevaucheRdv = (rdvExistants ?? []).some(
    (r) => new Date(r.debut).getTime() - battementMs < fin.getTime() && new Date(r.fin).getTime() + battementMs > debut.getTime(),
  );
  if (chevaucheRdv) return { erreur: "Ce créneau chevauche un rendez-vous déjà prévu pour ce salarié." };

  const { data: absencesExistantes } = await admin.from("absences").select("debut, fin").eq("salarie_id", salarieId);
  const chevaucheAbsence = (absencesExistantes ?? []).some(
    (a) => new Date(a.debut).getTime() < fin.getTime() && new Date(a.fin).getTime() > debut.getTime(),
  );
  if (chevaucheAbsence) return { erreur: "Le salarié est marqué absent sur ce créneau." };

  let clientId: string | null = null;
  if (input.client_email?.trim()) {
    const { data: client } = await admin
      .from("clients")
      .select("id")
      .eq("entreprise_id", ctx.entrepriseId)
      .ilike("email", input.client_email.trim())
      .maybeSingle();
    clientId = client?.id ?? null;
  }
  if (!clientId) {
    const { data: nouveauClient, error: erreurClient } = await admin
      .from("clients")
      .insert({
        entreprise_id: ctx.entrepriseId,
        nom: input.client_nom.trim(),
        adresse: input.client_adresse?.trim() || null,
        telephone: input.client_telephone?.trim() || null,
        email: input.client_email?.trim() || null,
      })
      .select("id")
      .single();
    if (erreurClient) return { erreur: erreurClient.message };
    clientId = nouveauClient.id;
  }

  const { error } = await admin.from("rendez_vous").insert({
    entreprise_id: ctx.entrepriseId,
    salarie_id: salarieId,
    prestation_id: prestationId,
    client_id: clientId,
    debut: debut.toISOString(),
    fin: fin.toISOString(),
    statut: "confirme",
    notes: input.notes?.trim() || null,
    cree_par: ctx.userId,
    adresse_client: input.client_adresse?.trim() || null,
  });
  if (error) return { erreur: error.message };

  return {
    bloque: true,
    debut: debut.toISOString(),
    fin: fin.toISOString(),
    duree_minutes: dureeMinutes,
    lien: "/dashboard/rendez-vous",
  };
}

export async function executerOutil(ctx: ContexteOutils, nom: string, input: unknown): Promise<unknown> {
  const entree = (input ?? {}) as Record<string, unknown>;
  switch (nom) {
    case "bilan_mensuel":
      return outilBilanMensuel(ctx, entree as { mois?: string });
    case "lister_clients":
      return outilListerClients(ctx);
    case "lister_documents_recents":
      return outilListerDocumentsRecents(ctx, entree as { limite?: number });
    case "creer_devis":
      return outilCreerDevis(ctx, entree as Parameters<typeof outilCreerDevis>[1]);
    case "enregistrer_depense":
      return outilEnregistrerDepense(ctx, entree as Parameters<typeof outilEnregistrerDepense>[1]);
    case "bloquer_creneau":
      return outilBloquerCreneau(ctx, entree as Parameters<typeof outilBloquerCreneau>[1]);
    case "lister_rendez_vous":
      return outilListerRendezVous(ctx, entree as Parameters<typeof outilListerRendezVous>[1]);
    case "modifier_statut_rendez_vous":
      return outilModifierStatutRendezVous(ctx, entree as Parameters<typeof outilModifierStatutRendezVous>[1]);
    case "ajouter_absence":
      return outilAjouterAbsence(ctx, entree as Parameters<typeof outilAjouterAbsence>[1]);
    case "lister_salaries":
      return outilListerSalaries(ctx);
    case "lister_prestations":
      return outilListerPrestations(ctx);
    case "changer_statut_document":
      return outilChangerStatutDocument(ctx, entree as Parameters<typeof outilChangerStatutDocument>[1]);
    default:
      return { erreur: `Outil inconnu : ${nom}` };
  }
}
