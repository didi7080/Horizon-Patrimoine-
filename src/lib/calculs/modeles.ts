import type { ModuleTemplate } from "./types";

/**
 * Modèles de modules de calcul proposés au démarrage, selon le métier de
 * l'entreprise. Ce ne sont que des points de départ : l'artisan peut
 * ensuite modifier, supprimer ou ajouter librement ses propres champs et
 * formules (voir /dashboard/outils/modules). Les coefficients usuels
 * (dosages, pertes de pose, rendements...) sont toujours exposés comme des
 * champs modifiables plutôt que figés dans la formule, car ils varient
 * selon les produits et les pratiques de chacun.
 */

const METRE_LINEAIRE_AVEC_CHUTE = (unite = "ml"): ModuleTemplate => ({
  nom: "Métré avec marge de chute",
  champs: [
    { id: "longueur", label: "Longueur mesurée", type: "nombre", unite },
    { id: "perte_pourcent", label: "Marge de chute", type: "nombre", unite: "%", defaut: 10 },
  ],
  formules: [
    {
      id: "a_commander",
      label: "Quantité à commander",
      expression: "longueur * (1 + perte_pourcent / 100)",
      unite,
      decimales: 2,
    },
  ],
});

const METRE_SURFACE_AVEC_CHUTE = (
  nom: string,
  surfaceParUniteDefaut: number,
  uniteProduit: string,
): ModuleTemplate => ({
  nom,
  champs: [
    { id: "surface", label: "Surface à couvrir", type: "nombre", unite: "m²" },
    { id: "perte_pourcent", label: "Marge de chute / recouvrement", type: "nombre", unite: "%", defaut: 10 },
    {
      id: "surface_par_unite",
      label: `Surface couverte par ${uniteProduit}`,
      type: "nombre",
      unite: "m²",
      defaut: surfaceParUniteDefaut,
    },
  ],
  formules: [
    {
      id: "surface_a_commander",
      label: "Surface à commander",
      expression: "surface * (1 + perte_pourcent / 100)",
      unite: "m²",
      decimales: 2,
    },
    {
      id: "nb_unites",
      label: `Nombre de ${uniteProduit}s à commander`,
      expression: "ceil(surface_a_commander / surface_par_unite)",
      decimales: 0,
    },
  ],
});

export const MODELES_PAR_METIER: Record<string, ModuleTemplate[]> = {
  Chauffage: [
    {
      nom: "Déperditions & puissance à installer",
      champs: [
        { id: "volume", label: "Volume habitable chauffé", type: "nombre", unite: "m³" },
        {
          id: "coefficient_g",
          label: "Coefficient de déperdition G (selon isolation)",
          type: "nombre",
          unite: "W/m³.°C",
          defaut: 1,
          aide: "Méthode rapide par coefficient G : ~0.4-0.6 (très bien isolé, RT2012/RE2020), ~1 (isolation moyenne), ~1.5-2.5 (ancien, peu isolé). Ajustez selon votre expérience du bâti.",
        },
        { id: "temp_interieure", label: "Température intérieure visée", type: "nombre", unite: "°C", defaut: 19 },
        {
          id: "temp_exterieure_base",
          label: "Température extérieure de base (station météo locale)",
          type: "nombre",
          unite: "°C",
          defaut: -5,
        },
        {
          id: "rendement_generateur",
          label: "Rendement du générateur",
          type: "nombre",
          unite: "%",
          defaut: 90,
        },
      ],
      formules: [
        {
          id: "deperditions",
          label: "Déperditions totales",
          expression: "volume * coefficient_g * (temp_interieure - temp_exterieure_base)",
          unite: "W",
          decimales: 0,
        },
        {
          id: "puissance_installee",
          label: "Puissance à installer",
          expression: "deperditions / 1000 / (rendement_generateur / 100)",
          unite: "kW",
          decimales: 2,
        },
        {
          id: "puissance_avec_marge",
          label: "Puissance recommandée (marge de sécurité 15%)",
          expression: "puissance_installee * 1.15",
          unite: "kW",
          decimales: 2,
        },
      ],
    },
    {
      nom: "Radiateur par pièce (correction ΔT, EN 442)",
      champs: [
        { id: "deperditions_piece", label: "Déperditions de la pièce", type: "nombre", unite: "W" },
        { id: "temp_moyenne_eau", label: "Température moyenne de l'eau (départ/retour)", type: "nombre", unite: "°C", defaut: 60 },
        { id: "temp_interieure_piece", label: "Température intérieure visée", type: "nombre", unite: "°C", defaut: 19 },
        {
          id: "delta_t_nominal",
          label: "ΔT nominal du radiateur (fiche fabricant, standard EN 442)",
          type: "nombre",
          unite: "°C",
          defaut: 50,
          aide: "50°C pour la norme EN 442 (radiateurs classiques) ; souvent 30°C pour du basse température (PAC, plancher).",
        },
      ],
      formules: [
        {
          id: "delta_t_reel",
          label: "ΔT réel de fonctionnement",
          expression: "temp_moyenne_eau - temp_interieure_piece",
          unite: "°C",
          decimales: 1,
        },
        {
          id: "coefficient_correction",
          label: "Coefficient de correction (exposant EN 442 = 1.3)",
          expression: "(delta_t_reel / delta_t_nominal) ^ 1.3",
          decimales: 3,
        },
        {
          id: "puissance_necessaire_catalogue",
          label: "Puissance catalogue nécessaire",
          expression: "deperditions_piece / coefficient_correction",
          unite: "W",
          decimales: 0,
        },
      ],
    },
    {
      nom: "Chaudière bois / granulés & ballon tampon",
      champs: [
        { id: "deperditions_totales", label: "Déperditions totales du bâtiment", type: "nombre", unite: "W" },
        { id: "part_couverte_bois_pourcent", label: "Part couverte par le bois/granulés", type: "nombre", unite: "%", defaut: 100 },
        { id: "autonomie_ballon_heures", label: "Autonomie souhaitée du ballon tampon", type: "nombre", unite: "h", defaut: 8 },
        {
          id: "coefficient_ballon",
          label: "Volume de ballon par kWh d'autonomie",
          type: "nombre",
          unite: "L/kWh",
          defaut: 15,
          aide: "Règle usuelle ~15 L par kWh d'autonomie souhaitée ; à ajuster selon le fabricant.",
        },
      ],
      formules: [
        {
          id: "puissance_chaudiere",
          label: "Puissance chaudière nécessaire",
          expression: "deperditions_totales * (part_couverte_bois_pourcent / 100) / 1000",
          unite: "kW",
          decimales: 2,
        },
        {
          id: "volume_ballon_tampon",
          label: "Volume de ballon tampon",
          expression: "puissance_chaudiere * autonomie_ballon_heures * coefficient_ballon",
          unite: "L",
          decimales: 0,
        },
      ],
    },
  ],

  Climatisation: [
    {
      nom: "Puissance frigorifique indicative",
      champs: [
        { id: "volume_piece", label: "Volume de la pièce", type: "nombre", unite: "m³" },
        {
          id: "coefficient_apports",
          label: "Coefficient d'apports thermiques",
          type: "nombre",
          unite: "W/m³",
          defaut: 50,
          aide: "Méthode rapide : ~40 (bien isolé, peu vitré), ~50 (standard), ~60-80 (très vitré, exposé plein sud, combles).",
        },
        { id: "majoration_exposition_pourcent", label: "Majoration exposition/vitrage", type: "nombre", unite: "%", defaut: 0 },
      ],
      formules: [
        {
          id: "puissance_frigorifique",
          label: "Puissance frigorifique nécessaire",
          expression: "volume_piece * coefficient_apports * (1 + majoration_exposition_pourcent / 100) / 1000",
          unite: "kW",
          decimales: 2,
        },
      ],
    },
  ],

  Plomberie: [METRE_LINEAIRE_AVEC_CHUTE("ml")],
  Électricité: [{ ...METRE_LINEAIRE_AVEC_CHUTE("ml"), nom: "Métré câble avec marge de chute" }],
  Serrurerie: [{ ...METRE_LINEAIRE_AVEC_CHUTE("ml"), nom: "Métré barreaudage/ferrage avec marge" }],
  Menuiserie: [METRE_SURFACE_AVEC_CHUTE("Métré panneaux avec marge de chute", 2.5, "panneau")],
  Couverture: [METRE_SURFACE_AVEC_CHUTE("Métré toiture (tuiles/ardoises)", 0.04, "élément")],
  Carrelage: [METRE_SURFACE_AVEC_CHUTE("Métré carrelage", 1.44, "boîte")],
  Vitrerie: [
    {
      nom: "Métré vitrage avec marge de chute",
      champs: [
        { id: "surface", label: "Surface à vitrer", type: "nombre", unite: "m²" },
        { id: "perte_pourcent", label: "Marge de chute", type: "nombre", unite: "%", defaut: 5 },
      ],
      formules: [
        {
          id: "surface_a_commander",
          label: "Surface à commander",
          expression: "surface * (1 + perte_pourcent / 100)",
          unite: "m²",
          decimales: 2,
        },
      ],
    },
  ],
  Plâtrerie: [METRE_SURFACE_AVEC_CHUTE("Métré plaques de plâtre", 3, "plaque")],

  Peinture: [
    {
      nom: "Quantité de peinture nécessaire",
      champs: [
        { id: "surface", label: "Surface à peindre", type: "nombre", unite: "m²" },
        { id: "nb_couches", label: "Nombre de couches", type: "nombre", defaut: 2 },
        {
          id: "rendement",
          label: "Rendement du produit",
          type: "nombre",
          unite: "m²/L",
          defaut: 10,
          aide: "Indiqué sur le pot, varie selon le produit et le support (souvent entre 8 et 12 m²/L).",
        },
      ],
      formules: [
        {
          id: "litres_necessaires",
          label: "Quantité de peinture à commander",
          expression: "(surface / rendement) * nb_couches",
          unite: "L",
          decimales: 1,
        },
      ],
    },
  ],

  Maçonnerie: [
    {
      nom: "Dosage béton (sacs de ciment)",
      champs: [
        { id: "volume", label: "Volume de béton", type: "nombre", unite: "m³" },
        {
          id: "dosage",
          label: "Dosage en ciment",
          type: "nombre",
          unite: "kg/m³",
          defaut: 350,
          aide: "350 kg/m³ est un dosage courant pour du béton de fondation/dalle ; à ajuster selon l'usage.",
        },
        { id: "poids_sac", label: "Poids d'un sac", type: "nombre", unite: "kg", defaut: 35 },
      ],
      formules: [
        {
          id: "nb_sacs",
          label: "Nombre de sacs de ciment",
          expression: "ceil(volume * dosage / poids_sac)",
          decimales: 0,
        },
      ],
    },
  ],

  "Jardinage & paysagisme": [
    {
      nom: "Quantité d'engrais / amendement",
      champs: [
        { id: "surface", label: "Surface à traiter", type: "nombre", unite: "m²" },
        { id: "dose", label: "Dose recommandée", type: "nombre", unite: "g/m²", defaut: 30 },
      ],
      formules: [
        {
          id: "quantite",
          label: "Quantité totale nécessaire",
          expression: "surface * dose / 1000",
          unite: "kg",
          decimales: 2,
        },
      ],
    },
  ],

  "Rénovation générale": [METRE_LINEAIRE_AVEC_CHUTE("ml")],

  Ramonage: [
    {
      nom: "Temps d'intervention estimé",
      champs: [
        { id: "nb_conduits", label: "Nombre de conduits", type: "nombre", defaut: 1 },
        { id: "temps_par_conduit", label: "Temps par conduit", type: "nombre", unite: "min", defaut: 20 },
        { id: "taux_horaire_cents", label: "Taux horaire", type: "nombre", unite: "centimes/h", defaut: 5000 },
      ],
      formules: [
        {
          id: "temps_total",
          label: "Temps total estimé",
          expression: "nb_conduits * temps_par_conduit",
          unite: "min",
          decimales: 0,
        },
        {
          id: "prix_estime_cents",
          label: "Prix estimé (main d'œuvre)",
          expression: "(temps_total / 60) * taux_horaire_cents",
          unite: "centimes",
          decimales: 0,
        },
      ],
    },
  ],
};

export const MODELE_GENERIQUE: ModuleTemplate = {
  nom: "Mon premier module de calcul",
  champs: [
    { id: "exemple_a", label: "Exemple de champ A", type: "nombre", unite: "u" },
    { id: "exemple_b", label: "Exemple de champ B", type: "nombre", unite: "u" },
  ],
  formules: [
    {
      id: "exemple_resultat",
      label: "Exemple de résultat (A × B)",
      expression: "exemple_a * exemple_b",
      decimales: 2,
    },
  ],
};

export function modelesPourMetier(metier: string | null): ModuleTemplate[] {
  if (metier && MODELES_PAR_METIER[metier]) return MODELES_PAR_METIER[metier];
  return [MODELE_GENERIQUE];
}
