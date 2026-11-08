import type Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculerTotaux, type LigneDocument } from "@/lib/documents/types";
import { calculerBilanMensuel, bornesMois, moisCourant, libelleMois } from "@/lib/bilan/types";
import { creerDocument, enregistrerLignesDocument, changerStatutDocument, convertirDevisEnFacture } from "@/app/dashboard/documents/actions";
import { synchroniserRdvGoogle } from "@/lib/google-calendar/sync";
import { emailConfigure, envoyerEmail } from "@/lib/email/client";
import { evaluerFormule, ErreurFormule } from "@/lib/calculs/evaluateur";
import type { Champ, Formule, DonneesEtude } from "@/lib/calculs/types";
import { resoudreOuCreerClient } from "@/lib/clients/resoudre";

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
    name: "creer_facture",
    description:
      "Crée directement une nouvelle facture (sans passer par un devis) pour un client, avec ses lignes de prestation, et renvoie le lien de la facture créée. Si le client n'existe pas encore, il est automatiquement ajouté au fichier clients. Si un devis a déjà été fait pour ce travail, utilise plutôt convertir_devis_en_facture.",
    input_schema: {
      type: "object",
      properties: {
        client_nom: { type: "string", description: "Nom du client." },
        client_adresse: { type: "string" },
        client_telephone: { type: "string" },
        client_email: { type: "string" },
        date_echeance: { type: "string", description: "Date limite de paiement au format AAAA-MM-JJ. Optionnel." },
        notes: { type: "string", description: "Conditions particulières ou notes pour le client." },
        lignes: {
          type: "array",
          description: "Lignes de la facture.",
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
    name: "convertir_devis_en_facture",
    description:
      "Transforme un devis existant en facture : reprend automatiquement les mêmes lignes, le même client, et marque le devis comme accepté. Utilise ceci quand on te demande de facturer un devis déjà fait plutôt que de ressaisir les lignes.",
    input_schema: {
      type: "object",
      properties: {
        numero_devis: { type: "string", description: "Numéro exact du devis, ex. D-2026-0001." },
      },
      required: ["numero_devis"],
    },
  },
  {
    name: "rechercher_client",
    description: "Recherche un client par nom (ou partie du nom) et renvoie ses coordonnées (téléphone, e-mail, adresse) et son historique de documents.",
    input_schema: {
      type: "object",
      properties: {
        nom: { type: "string", description: "Nom ou partie du nom du client à rechercher." },
      },
      required: ["nom"],
    },
  },
  {
    name: "lister_documents_impayes",
    description:
      "Liste les factures envoyées mais non payées, avec leur date d'échéance et le nombre de jours de retard éventuel. Utilise ceci pour toute question sur les impayés, les relances à faire, ou les factures en retard.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "relancer_document",
    description:
      "Relance un client au sujet d'un devis en attente de réponse ou d'une facture impayée : envoie automatiquement un e-mail de relance au client (si l'envoi d'e-mails est configuré sur cette instance), sinon renvoie le message prêt à l'emploi pour que l'artisan l'envoie lui-même.",
    input_schema: {
      type: "object",
      properties: {
        numero: { type: "string", description: "Numéro exact du document à relancer, ex. F-2026-0001 ou D-2026-0001." },
      },
      required: ["numero"],
    },
  },
  {
    name: "envoyer_email_client",
    description:
      "Envoie un e-mail libre à un client déjà enregistré (ex. informer d'un retard, confirmer une intervention, répondre à une question). Retrouve le client par son nom ; s'il y a ambiguïté ou que le client n'a pas d'e-mail enregistré, l'outil le signale au lieu d'envoyer. Pour relancer un devis ou une facture précis·e, utilise plutôt relancer_document qui prépare le texte automatiquement.",
    input_schema: {
      type: "object",
      properties: {
        client_nom: { type: "string", description: "Nom (ou partie du nom) du client destinataire." },
        objet: { type: "string", description: "Objet de l'e-mail." },
        message: { type: "string", description: "Corps du message, rédigé par toi selon la demande de l'artisan." },
      },
      required: ["client_nom", "objet", "message"],
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
    description:
      "Enregistre une nouvelle dépense professionnelle (charge) pour l'entreprise : matériel, carburant, assurance, etc. Si c'est un salarié (pas le gérant) qui demande, la dépense est mise en attente de validation par le gérant — dis-le-lui si le résultat renvoie en_attente_de_validation.",
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
  {
    name: "lister_modules_calcul",
    description:
      "Liste les modules de calcul personnalisés déjà créés par l'entreprise (outils de calcul, Premium), avec leurs champs et formules. Utilise ceci avant calculer_etude si tu ne connais pas déjà les identifiants exacts des champs d'un module.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "creer_module_calcul",
    description:
      "Crée un module de calcul personnalisé (champs à remplir + formules) pour chiffrer des études chantier, à partir d'une description libre de l'artisan (ex. « crée-moi un module pour calculer la quantité de peinture : surface des murs moins les ouvertures, divisée par le rendement du pot »). Choisis toi-même des identifiants de champs clairs en français sans accent ni espace (ex. surface_murs, nb_fenetres). Chaque formule ne peut utiliser QUE : les identifiants des champs de type nombre, les identifiants d'autres formules placées AVANT elle dans la liste (une formule ne peut pas utiliser le résultat d'une formule qui vient après), les opérateurs + - * / ^, des parenthèses, et les fonctions min/max/round/abs/sqrt/pow/floor/ceil — rien d'autre. Le module est vérifié automatiquement avant d'être enregistré : si une formule est invalide (identifiant inconnu, mauvais ordre...), la création échoue et l'erreur exacte est renvoyée pour que tu corriges et réessaies toi-même sans redemander à l'utilisateur.",
    input_schema: {
      type: "object",
      properties: {
        nom: { type: "string", description: "Nom du module, ex. « Peinture — calcul de quantité »." },
        champs: {
          type: "array",
          description: "Les informations à saisir pour faire le calcul.",
          items: {
            type: "object",
            properties: {
              id: { type: "string", description: "Identifiant technique : lettres minuscules, chiffres, underscore, sans accent ni espace. Ex. surface_murs." },
              label: { type: "string", description: "Libellé affiché à l'artisan, ex. « Surface des murs »." },
              type: { type: "string", enum: ["nombre", "texte", "select", "booleen"] },
              unite: { type: "string", description: "Ex. m², ml, u, h. Optionnel." },
              options: { type: "array", items: { type: "string" }, description: "Uniquement pour le type select : liste des choix possibles." },
              defaut: { description: "Valeur par défaut optionnelle." },
              aide: { type: "string", description: "Texte d'aide optionnel affiché sous le champ." },
            },
            required: ["id", "label", "type"],
          },
        },
        formules: {
          type: "array",
          description: "Les calculs à effectuer, dans l'ordre : chacune peut utiliser les champs nombre et les formules précédentes.",
          items: {
            type: "object",
            properties: {
              id: { type: "string", description: "Identifiant technique, même règles que pour un champ." },
              label: { type: "string", description: "Libellé du résultat, ex. « Surface nette à peindre »." },
              expression: { type: "string", description: "Ex. surface_murs - (nb_fenetres * surface_fenetre)." },
              unite: { type: "string" },
              decimales: { type: "integer", description: "Nombre de décimales à afficher, par défaut arrondi naturel." },
            },
            required: ["id", "label", "expression"],
          },
        },
      },
      required: ["nom", "champs", "formules"],
    },
  },
  {
    name: "calculer_etude",
    description:
      "Calcule immédiatement les résultats d'un module de calcul existant à partir des valeurs fournies par l'artisan (ex. « calcule-moi ça : surface 20m², 2 fenêtres de 1m² »). Renvoie chaque résultat de formule avec sa valeur réelle, calculée par l'application (jamais par toi-même de tête). Si un nom de client ou un titre est fourni, le calcul est aussi enregistré comme une étude consultable et imprimable dans l'application ; sinon c'est juste une estimation rapide, non enregistrée.",
    input_schema: {
      type: "object",
      properties: {
        module_nom: { type: "string", description: "Nom exact (ou très proche) du module de calcul à utiliser." },
        valeurs: {
          type: "object",
          description: "Valeurs des champs du module, par identifiant. Ex. { \"surface_murs\": 20, \"nb_fenetres\": 2 }.",
          additionalProperties: true,
        },
        client_nom: { type: "string", description: "Optionnel : si fourni, le calcul est enregistré comme étude pour ce client." },
        titre: { type: "string", description: "Optionnel : titre de l'étude si elle doit être enregistrée." },
      },
      required: ["module_nom", "valeurs"],
    },
  },
  {
    name: "lister_depenses",
    description:
      "Résume les dépenses d'un mois donné (total, détail par catégorie, liste des dépenses validées) et signale les notes de frais envoyées par les salariés qui attendent encore une validation. Utilise ceci pour toute question sur les charges, les dépenses, ou pour préparer le point à envoyer au comptable.",
    input_schema: {
      type: "object",
      properties: {
        mois: { type: "string", description: "Mois au format AAAA-MM (ex. 2026-09). Si absent, utilise le mois en cours." },
      },
    },
  },
];

type ContexteOutils = { entrepriseId: string; userId: string; role: "owner" | "admin" | "salarie" };
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

/** E-mail du compte artisan à l'origine de la demande, utilisé comme adresse de réponse. */
async function emailArtisan(admin: AdminClient, userId: string): Promise<string | null> {
  const { data } = await admin.auth.admin.getUserById(userId);
  return data.user?.email ?? null;
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
    admin
      .from("depenses")
      .select("montant_cents")
      .eq("entreprise_id", ctx.entrepriseId)
      .eq("statut", "validee")
      .gte("date", debut)
      .lt("date", fin),
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

type EntreeDocument = {
  client_nom: string;
  client_adresse?: string;
  client_telephone?: string;
  client_email?: string;
  date_echeance?: string;
  notes?: string;
  lignes: LigneEntree[];
};

const TAUX_TVA_VALIDES = new Set([0, 5.5, 10, 20]);

function validerLignes(lignes: LigneEntree[]): string | null {
  for (const ligne of lignes) {
    if (!ligne.designation?.trim()) return "Chaque ligne doit avoir une désignation.";
    if (!Number.isFinite(ligne.quantite) || ligne.quantite <= 0) return `Quantité invalide pour "${ligne.designation}" : elle doit être supérieure à 0.`;
    if (!Number.isFinite(ligne.prix_unitaire_euros) || ligne.prix_unitaire_euros < 0) {
      return `Prix unitaire invalide pour "${ligne.designation}" : il ne peut pas être négatif.`;
    }
    if (ligne.taux_tva !== undefined && !TAUX_TVA_VALIDES.has(ligne.taux_tva)) {
      return `Taux de TVA invalide pour "${ligne.designation}" : utilise 0, 5.5, 10 ou 20.`;
    }
  }
  return null;
}

async function creerDevisOuFacture(ctx: ContexteOutils, type: "devis" | "facture", input: EntreeDocument) {
  if (!input.client_nom?.trim()) return { erreur: "Le nom du client est requis." };
  if (!input.lignes || input.lignes.length === 0) return { erreur: "Au moins une ligne est requise." };
  const erreurLignes = validerLignes(input.lignes);
  if (erreurLignes) return { erreur: erreurLignes };

  const admin = createAdminClient();
  if (!admin) return { erreur: "Base de données non configurée." };

  let clientId: string;
  try {
    clientId = await resoudreOuCreerClient(admin, ctx.entrepriseId, {
      nom: input.client_nom,
      email: input.client_email,
      telephone: input.client_telephone,
      adresse: input.client_adresse,
    });
  } catch (err) {
    return { erreur: err instanceof Error ? err.message : "Erreur lors de l'enregistrement du client." };
  }

  try {
    const formData = new FormData();
    formData.set("clientId", clientId);

    const documentId = await creerDocument(type, formData);

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
      dateEcheance: input.date_echeance ?? "",
      datePrestation: "",
      notes: input.notes ?? "",
    });

    const totaux = calculerTotaux(lignes);
    return {
      cree: true,
      total_ttc_euros: totaux.totalTTC / 100,
      lien: `/dashboard/documents/${documentId}`,
    };
  } catch (err) {
    return { erreur: err instanceof Error ? err.message : "Erreur lors de la création du document." };
  }
}

async function outilCreerDevis(ctx: ContexteOutils, input: EntreeDocument) {
  return creerDevisOuFacture(ctx, "devis", input);
}

async function outilCreerFacture(ctx: ContexteOutils, input: EntreeDocument) {
  return creerDevisOuFacture(ctx, "facture", input);
}

async function outilConvertirDevisEnFacture(ctx: ContexteOutils, input: { numero_devis: string }) {
  if (!input.numero_devis?.trim()) return { erreur: "Le numéro du devis est requis." };
  const admin = createAdminClient();
  if (!admin) return { erreur: "Base de données non configurée." };
  const { data: devis, error } = await admin
    .from("documents")
    .select("id")
    .eq("entreprise_id", ctx.entrepriseId)
    .eq("type", "devis")
    .ilike("numero", input.numero_devis.trim())
    .maybeSingle();
  if (error) return { erreur: error.message };
  if (!devis) return { erreur: "Aucun devis avec ce numéro." };
  try {
    const factureId = await convertirDevisEnFacture(devis.id);
    return { converti: true, lien: `/dashboard/documents/${factureId}` };
  } catch (err) {
    return { erreur: err instanceof Error ? err.message : "Erreur lors de la conversion en facture." };
  }
}

async function outilRechercherClient(ctx: ContexteOutils, input: { nom: string }) {
  if (!input.nom?.trim()) return { erreur: "Le nom à rechercher est requis." };
  const admin = createAdminClient();
  if (!admin) return { erreur: "Base de données non configurée." };
  const { data: clients, error } = await admin
    .from("clients")
    .select("id, nom, email, telephone, adresse")
    .eq("entreprise_id", ctx.entrepriseId)
    .ilike("nom", `%${input.nom.trim()}%`)
    .limit(10);
  if (error) return { erreur: error.message };
  if (!clients || clients.length === 0) return { erreur: "Aucun client ne correspond à ce nom." };

  const resultats = await Promise.all(
    clients.map(async (c) => {
      const { data: documents } = await admin
        .from("documents")
        .select("type, numero, statut")
        .eq("client_id", c.id)
        .order("created_at", { ascending: false })
        .limit(5);
      return {
        nom: c.nom,
        email: c.email,
        telephone: c.telephone,
        adresse: c.adresse,
        derniers_documents: documents ?? [],
      };
    }),
  );
  return { clients: resultats };
}

async function outilListerDocumentsImpayes(ctx: ContexteOutils) {
  const admin = createAdminClient();
  if (!admin) return { erreur: "Base de données non configurée." };
  const { data, error } = await admin
    .from("documents")
    .select("numero, client_nom, date_echeance, lignes")
    .eq("entreprise_id", ctx.entrepriseId)
    .eq("type", "facture")
    .eq("statut", "envoyee")
    .order("date_echeance", { ascending: true, nullsFirst: true });
  if (error) return { erreur: error.message };

  const aujourdhui = new Date();
  return (data ?? []).map((d) => {
    const totaux = calculerTotaux((d.lignes as LigneDocument[] | null) ?? []);
    const joursRetard = d.date_echeance
      ? Math.floor((aujourdhui.getTime() - new Date(d.date_echeance).getTime()) / 86_400_000)
      : null;
    return {
      numero: d.numero,
      client: d.client_nom,
      date_echeance: d.date_echeance,
      total_ttc_euros: totaux.totalTTC / 100,
      jours_de_retard: joursRetard !== null && joursRetard > 0 ? joursRetard : 0,
    };
  });
}

async function outilRelancerDocument(ctx: ContexteOutils, input: { numero: string }) {
  if (!input.numero?.trim()) return { erreur: "Le numéro du document est requis." };
  const admin = createAdminClient();
  if (!admin) return { erreur: "Base de données non configurée." };
  const { data: document, error } = await admin
    .from("documents")
    .select("type, numero, statut, client_nom, client_email, date_echeance, lignes")
    .eq("entreprise_id", ctx.entrepriseId)
    .ilike("numero", input.numero.trim())
    .maybeSingle();
  if (error) return { erreur: error.message };
  if (!document) return { erreur: "Aucun document avec ce numéro." };
  if (!document.client_email) {
    return { erreur: "Ce client n'a pas d'adresse e-mail enregistrée, impossible de préparer une relance par e-mail." };
  }

  const totaux = calculerTotaux((document.lignes as LigneDocument[] | null) ?? []);
  const totalEuros = (totaux.totalTTC / 100).toFixed(2);
  const estDevis = document.type === "devis";
  const objet = estDevis
    ? `Relance : votre devis ${document.numero}`
    : `Relance : facture ${document.numero} en attente de règlement`;
  const message = estDevis
    ? `Bonjour ${document.client_nom},\n\nNous revenons vers vous au sujet du devis ${document.numero} (${totalEuros} € TTC) que nous vous avons transmis. Souhaitez-vous donner suite ? N'hésitez pas à nous contacter pour toute question.\n\nCordialement.`
    : `Bonjour ${document.client_nom},\n\nNous vous rappelons que la facture ${document.numero} (${totalEuros} € TTC)${document.date_echeance ? ` arrivée à échéance le ${document.date_echeance}` : ""} reste à régler à ce jour. Merci de bien vouloir procéder au paiement dans les meilleurs délais.\n\nCordialement.`;

  if (!emailConfigure()) {
    return {
      destinataire: document.client_email,
      objet,
      message,
      envoye: false,
      note: "L'envoi automatique par e-mail n'est pas encore configuré sur cette instance : copie ce message pour l'envoyer toi-même.",
    };
  }

  const replyTo = await emailArtisan(admin, ctx.userId);
  const resultat = await envoyerEmail({ to: document.client_email, subject: objet, text: message, replyTo });
  if (!resultat.ok) {
    return { destinataire: document.client_email, objet, message, envoye: false, erreur: resultat.erreur };
  }
  return { destinataire: document.client_email, objet, envoye: true };
}

async function outilEnvoyerEmailClient(ctx: ContexteOutils, input: { client_nom: string; objet: string; message: string }) {
  if (!input.client_nom?.trim()) return { erreur: "Le nom du client est requis." };
  if (!input.objet?.trim()) return { erreur: "L'objet de l'e-mail est requis." };
  if (!input.message?.trim()) return { erreur: "Le corps du message est requis." };
  if (!emailConfigure()) return { erreur: "L'envoi automatique par e-mail n'est pas configuré sur cette instance." };

  const admin = createAdminClient();
  if (!admin) return { erreur: "Base de données non configurée." };

  const { data: clients, error } = await admin
    .from("clients")
    .select("nom, email")
    .eq("entreprise_id", ctx.entrepriseId)
    .ilike("nom", `%${input.client_nom.trim()}%`)
    .limit(5);
  if (error) return { erreur: error.message };
  if (!clients || clients.length === 0) return { erreur: "Aucun client ne correspond à ce nom." };
  if (clients.length > 1) {
    return { erreur: "Plusieurs clients correspondent, précise lequel.", clients_disponibles: clients.map((c) => c.nom) };
  }
  const client = clients[0];
  if (!client.email) return { erreur: `${client.nom} n'a pas d'adresse e-mail enregistrée.` };

  const replyTo = await emailArtisan(admin, ctx.userId);
  const resultat = await envoyerEmail({ to: client.email, subject: input.objet, text: input.message, replyTo });
  if (!resultat.ok) return { erreur: resultat.erreur };
  return { envoye: true, destinataire: client.email };
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
  // Un salarié passe par la même validation que le formulaire : la dépense
  // reste "en attente" jusqu'à ce que le gérant la valide.
  const statut = ctx.role === "salarie" ? "en_attente" : "validee";
  const { error } = await admin.from("depenses").insert({
    entreprise_id: ctx.entrepriseId,
    categorie: input.categorie.trim(),
    montant_cents: Math.round(input.montant_euros * 100),
    date: input.date?.trim() || new Date().toISOString().slice(0, 10),
    description: input.description?.trim() || null,
    created_by: ctx.userId,
    statut,
  });
  if (error) return { erreur: error.message };
  return statut === "en_attente"
    ? { enregistre: true, en_attente_de_validation: true, lien: "/dashboard/depenses" }
    : { enregistre: true, lien: "/dashboard/depenses" };
}

const ID_VALIDE = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
const TYPES_CHAMP_VALIDES = new Set(["nombre", "texte", "select", "booleen"]);

type ChampEntree = {
  id: string;
  label: string;
  type: string;
  unite?: string;
  options?: string[];
  defaut?: string | number | boolean;
  aide?: string;
};
type FormuleEntree = { id: string; label: string; expression: string; unite?: string; decimales?: number };

/**
 * Valide des champs/formules fournis par l'IA en les évaluant réellement (avec
 * des valeurs par défaut) plutôt qu'en se contentant de vérifier la syntaxe :
 * ça détecte un identifiant inconnu ou une formule qui référence une autre
 * formule placée après elle, avant d'enregistrer quoi que ce soit.
 */
export function validerChampsEtFormules(
  champsEntree: ChampEntree[],
  formulesEntree: FormuleEntree[],
): { champs: Champ[]; formules: Formule[] } | { erreur: string } {
  const idsVus = new Set<string>();

  for (const c of champsEntree) {
    if (!c.id?.trim() || !c.label?.trim()) return { erreur: "Chaque champ doit avoir un identifiant et un libellé." };
    if (!ID_VALIDE.test(c.id)) {
      return { erreur: `Identifiant de champ invalide : "${c.id}" — uniquement lettres, chiffres et underscore, sans accent ni espace, sans commencer par un chiffre.` };
    }
    if (!TYPES_CHAMP_VALIDES.has(c.type)) return { erreur: `Type de champ invalide pour "${c.id}" : utilise nombre, texte, select ou booleen.` };
    if (idsVus.has(c.id)) return { erreur: `Identifiant en double : "${c.id}".` };
    idsVus.add(c.id);
  }

  const portee: Record<string, number> = {};
  for (const c of champsEntree) {
    if (c.type === "nombre") portee[c.id] = typeof c.defaut === "number" ? c.defaut : 1;
  }

  const formulesValidees: Formule[] = [];
  for (const f of formulesEntree) {
    if (!f.id?.trim() || !f.label?.trim() || !f.expression?.trim()) {
      return { erreur: "Chaque formule doit avoir un identifiant, un libellé et une expression." };
    }
    if (!ID_VALIDE.test(f.id)) {
      return { erreur: `Identifiant de formule invalide : "${f.id}" — uniquement lettres, chiffres et underscore, sans accent ni espace, sans commencer par un chiffre.` };
    }
    if (idsVus.has(f.id)) return { erreur: `Identifiant en double : "${f.id}" (déjà utilisé par un champ ou une autre formule).` };
    idsVus.add(f.id);

    try {
      portee[f.id] = evaluerFormule(f.expression, portee);
    } catch (err) {
      const message = err instanceof ErreurFormule ? err.message : "erreur inconnue";
      return {
        erreur: `La formule "${f.label}" (${f.id}) est invalide : ${message} Vérifie l'orthographe des identifiants et que chaque formule ne référence que des champs ou des formules placées avant elle dans la liste.`,
      };
    }
    formulesValidees.push({ id: f.id, label: f.label, expression: f.expression, unite: f.unite, decimales: f.decimales });
  }

  const champsValides: Champ[] = champsEntree.map((c) => ({
    id: c.id,
    label: c.label,
    type: c.type as Champ["type"],
    unite: c.unite,
    options: c.type === "select" ? c.options : undefined,
    defaut: c.defaut,
    aide: c.aide,
  }));

  return { champs: champsValides, formules: formulesValidees };
}

async function outilListerModulesCalcul(ctx: ContexteOutils) {
  const admin = createAdminClient();
  if (!admin) return { erreur: "Base de données non configurée." };
  const { data, error } = await admin
    .from("modules_calcul")
    .select("id, nom, champs, formules")
    .eq("entreprise_id", ctx.entrepriseId)
    .order("ordre");
  if (error) return { erreur: error.message };
  return {
    modules: (data ?? []).map((m) => ({
      id: m.id,
      nom: m.nom,
      champs: (m.champs as Champ[]).map((c) => ({ id: c.id, label: c.label, type: c.type, unite: c.unite, options: c.options })),
      formules: (m.formules as Formule[]).map((f) => ({ id: f.id, label: f.label, unite: f.unite })),
    })),
  };
}

async function outilCreerModuleCalcul(ctx: ContexteOutils, input: { nom: string; champs: ChampEntree[]; formules: FormuleEntree[] }) {
  if (!input.nom?.trim()) return { erreur: "Le nom du module est requis." };
  if (!input.champs || input.champs.length === 0) return { erreur: "Au moins un champ est requis." };
  if (!input.formules || input.formules.length === 0) return { erreur: "Au moins une formule est requise." };

  const resultat = validerChampsEtFormules(input.champs, input.formules);
  if ("erreur" in resultat) return resultat;

  const admin = createAdminClient();
  if (!admin) return { erreur: "Base de données non configurée." };

  const { data: entreprise } = await admin.from("entreprises").select("metier").eq("id", ctx.entrepriseId).maybeSingle();

  const { data, error } = await admin
    .from("modules_calcul")
    .insert({
      entreprise_id: ctx.entrepriseId,
      metier: entreprise?.metier ?? "",
      nom: input.nom.trim(),
      champs: resultat.champs,
      formules: resultat.formules,
    })
    .select("id")
    .single();
  if (error) return { erreur: error.message };

  return { cree: true, id: data.id, lien: `/dashboard/outils/modules/${data.id}` };
}

async function outilCalculerEtude(
  ctx: ContexteOutils,
  input: { module_nom: string; valeurs: Record<string, string | number | boolean>; client_nom?: string; titre?: string },
) {
  if (!input.module_nom?.trim()) return { erreur: "Le nom du module est requis." };
  const admin = createAdminClient();
  if (!admin) return { erreur: "Base de données non configurée." };

  const { data: modules, error } = await admin
    .from("modules_calcul")
    .select("id, nom, metier, champs, formules")
    .eq("entreprise_id", ctx.entrepriseId)
    .ilike("nom", `%${input.module_nom.trim()}%`);
  if (error) return { erreur: error.message };
  if (!modules || modules.length === 0) {
    return { erreur: "Aucun module de calcul ne correspond à ce nom. Utilise lister_modules_calcul pour voir les modules disponibles." };
  }
  if (modules.length > 1) {
    return { erreur: "Plusieurs modules correspondent, précise lequel.", modules_disponibles: modules.map((m) => m.nom) };
  }
  const module_ = modules[0];
  const champs = module_.champs as Champ[];
  const formules = module_.formules as Formule[];

  const portee: Record<string, number> = {};
  for (const champ of champs) {
    if (champ.type !== "nombre") continue;
    const valeur = input.valeurs?.[champ.id];
    portee[champ.id] =
      valeur !== undefined && valeur !== null && valeur !== ""
        ? Number(valeur)
        : typeof champ.defaut === "number"
          ? champ.defaut
          : 0;
  }

  const resultats: { id: string; label: string; valeur?: number; unite?: string; erreur?: string }[] = [];
  for (const formule of formules) {
    try {
      const valeur = evaluerFormule(formule.expression, portee);
      const arrondi = formule.decimales !== undefined ? Number(valeur.toFixed(formule.decimales)) : Math.round(valeur * 1000) / 1000;
      resultats.push({ id: formule.id, label: formule.label, valeur: arrondi, unite: formule.unite });
      portee[formule.id] = valeur;
    } catch (err) {
      resultats.push({ id: formule.id, label: formule.label, erreur: err instanceof ErreurFormule ? err.message : "Erreur de calcul" });
    }
  }

  const reponse: Record<string, unknown> = { module: module_.nom, resultats };

  if (input.client_nom?.trim() || input.titre?.trim()) {
    const donnees: DonneesEtude = { champs: input.valeurs };
    const { data: etude, error: erreurEtude } = await admin
      .from("etudes")
      .insert({
        entreprise_id: ctx.entrepriseId,
        metier: module_.metier,
        titre: input.titre?.trim() || `Étude ${module_.nom}`,
        module_id: module_.id,
        client_nom: input.client_nom?.trim() || null,
        donnees,
        created_by: ctx.userId,
      })
      .select("id")
      .single();
    if (!erreurEtude && etude) {
      reponse.etude_enregistree = true;
      reponse.lien = `/dashboard/outils/etudes/${etude.id}`;
    }
  }

  return reponse;
}

async function outilListerDepenses(ctx: ContexteOutils, input: { mois?: string }) {
  const mois = input.mois?.trim() || moisCourant();
  const { debut, fin } = bornesMois(mois);
  const admin = createAdminClient();
  if (!admin) return { erreur: "Base de données non configurée." };

  const [{ data: validees, error }, { data: enAttente, error: erreurAttente }] = await Promise.all([
    admin
      .from("depenses")
      .select("categorie, montant_cents, date, description")
      .eq("entreprise_id", ctx.entrepriseId)
      .eq("statut", "validee")
      .gte("date", debut)
      .lt("date", fin)
      .order("date", { ascending: false }),
    admin.from("depenses").select("montant_cents").eq("entreprise_id", ctx.entrepriseId).eq("statut", "en_attente"),
  ]);
  if (error) return { erreur: error.message };
  if (erreurAttente) return { erreur: erreurAttente.message };

  const liste = validees ?? [];
  const parCategorie = new Map<string, number>();
  for (const d of liste) parCategorie.set(d.categorie, (parCategorie.get(d.categorie) ?? 0) + d.montant_cents);

  const attente = enAttente ?? [];

  return {
    mois,
    libelle: libelleMois(mois),
    total_valide_euros: liste.reduce((s, d) => s + d.montant_cents, 0) / 100,
    nombre_depenses_validees: liste.length,
    par_categorie: [...parCategorie.entries()].map(([categorie, montant_cents]) => ({
      categorie,
      montant_euros: montant_cents / 100,
    })),
    depenses: liste.map((d) => ({
      date: d.date,
      categorie: d.categorie,
      description: d.description,
      montant_euros: d.montant_cents / 100,
    })),
    notes_de_frais_en_attente_de_validation: attente.length,
    total_en_attente_euros: attente.reduce((s, d) => s + d.montant_cents, 0) / 100,
    lien: `/dashboard/depenses?mois=${mois}`,
  };
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
  await synchroniserRdvGoogle(input.rendez_vous_id);
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
    .select("nom, duree_min, prix_cents, acompte_cents")
    .eq("entreprise_id", ctx.entrepriseId)
    .eq("actif", true)
    .order("nom");
  if (error) return { erreur: error.message };
  return {
    prestations: (data ?? []).map((p) => ({
      nom: p.nom,
      duree_minutes: p.duree_min,
      prix_euros: p.prix_cents !== null ? p.prix_cents / 100 : null,
      acompte_euros: p.acompte_cents !== null ? p.acompte_cents / 100 : null,
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
    .ilike("numero", input.numero.trim())
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
  if (input.duree_minutes !== undefined && (!Number.isFinite(input.duree_minutes) || input.duree_minutes <= 0)) {
    return { erreur: "La durée doit être supérieure à 0 minute." };
  }

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

  let clientId: string;
  try {
    clientId = await resoudreOuCreerClient(admin, ctx.entrepriseId, {
      nom: input.client_nom,
      email: input.client_email,
      telephone: input.client_telephone,
      adresse: input.client_adresse,
    });
  } catch (err) {
    return { erreur: err instanceof Error ? err.message : "Erreur lors de l'enregistrement du client." };
  }

  const { data: nouveauRdv, error } = await admin
    .from("rendez_vous")
    .insert({
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
    })
    .select("id")
    .single();
  if (error) return { erreur: error.message };
  await synchroniserRdvGoogle(nouveauRdv.id);

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
    case "creer_facture":
      return outilCreerFacture(ctx, entree as Parameters<typeof outilCreerFacture>[1]);
    case "convertir_devis_en_facture":
      return outilConvertirDevisEnFacture(ctx, entree as Parameters<typeof outilConvertirDevisEnFacture>[1]);
    case "rechercher_client":
      return outilRechercherClient(ctx, entree as Parameters<typeof outilRechercherClient>[1]);
    case "lister_documents_impayes":
      return outilListerDocumentsImpayes(ctx);
    case "relancer_document":
      return outilRelancerDocument(ctx, entree as Parameters<typeof outilRelancerDocument>[1]);
    case "envoyer_email_client":
      return outilEnvoyerEmailClient(ctx, entree as Parameters<typeof outilEnvoyerEmailClient>[1]);
    case "enregistrer_depense":
      return outilEnregistrerDepense(ctx, entree as Parameters<typeof outilEnregistrerDepense>[1]);
    case "lister_depenses":
      return outilListerDepenses(ctx, entree as Parameters<typeof outilListerDepenses>[1]);
    case "lister_modules_calcul":
      return outilListerModulesCalcul(ctx);
    case "creer_module_calcul":
      return outilCreerModuleCalcul(ctx, entree as Parameters<typeof outilCreerModuleCalcul>[1]);
    case "calculer_etude":
      return outilCalculerEtude(ctx, entree as Parameters<typeof outilCalculerEtude>[1]);
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
