import { METIERS } from "@/lib/metiers";

export type MetierSeo = {
  /** Valeur stockée en base (entreprises.metier), ex. "Plomberie". */
  valeur: (typeof METIERS)[number];
  /** Segment d'URL, ex. "plombier" pour /plombier et /plombier/paris. */
  slug: string;
  /** Nom du professionnel au pluriel, pour les titres ("Les plombiers à Paris"). */
  professionnelsPluriel: string;
  /** Forme singulière avec article, grammaticalement correcte ("un plombier", "une entreprise de rénovation"). */
  articleSingulier: string;
  intro: string;
  quandFaireAppel: string[];
};

export const METIERS_SEO: MetierSeo[] = [
  {
    valeur: "Plomberie",
    slug: "plombier",
    professionnelsPluriel: "plombiers",
    articleSingulier: "un plombier",
    intro:
      "Un plombier intervient sur l'ensemble des installations d'eau et d'évacuation d'un logement : fuites, canalisations bouchées, remplacement de robinetterie, installation de chauffe-eau ou de sanitaires. En cas d'urgence (fuite active, dégât des eaux), mieux vaut agir vite pour limiter les dégâts.",
    quandFaireAppel: [
      "Fuite d'eau ou dégât des eaux",
      "Canalisation ou toilettes bouchées",
      "Installation ou remplacement de sanitaires",
      "Pose ou entretien d'un chauffe-eau",
    ],
  },
  {
    valeur: "Électricité",
    slug: "electricien",
    professionnelsPluriel: "électriciens",
    articleSingulier: "un électricien",
    intro:
      "Un électricien réalise l'installation, la mise aux normes et le dépannage des circuits électriques : tableau électrique, prises, éclairage, mise en sécurité. Une installation vétuste ou mal dimensionnée est une source fréquente d'incidents domestiques, d'où l'intérêt de faire intervenir un professionnel qualifié.",
    quandFaireAppel: [
      "Panne de courant ou disjoncteur qui saute",
      "Mise aux normes avant une vente ou une location",
      "Installation de prises, d'éclairage ou d'une borne de recharge",
      "Diagnostic électrique",
    ],
  },
  {
    valeur: "Chauffage",
    slug: "chauffagiste",
    professionnelsPluriel: "chauffagistes",
    articleSingulier: "un chauffagiste",
    intro:
      "Un chauffagiste installe, entretient et dépanne les systèmes de chauffage : chaudière, pompe à chaleur, radiateurs, plancher chauffant. Un entretien annuel permet souvent d'éviter les pannes en plein hiver et de réduire la facture énergétique.",
    quandFaireAppel: [
      "Entretien annuel de chaudière",
      "Panne de chauffage en hiver",
      "Installation d'une pompe à chaleur",
      "Remplacement d'une chaudière ancienne",
    ],
  },
  {
    valeur: "Serrurerie",
    slug: "serrurier",
    professionnelsPluriel: "serruriers",
    articleSingulier: "un serrurier",
    intro:
      "Un serrurier intervient sur les serrures, verrous et systèmes de fermeture : ouverture de porte claquée, changement de serrure après une perte de clés ou une effraction, installation d'une porte blindée. Beaucoup de serruriers proposent une intervention rapide en cas d'urgence.",
    quandFaireAppel: [
      "Porte claquée ou clés perdues",
      "Changement de serrure après une effraction",
      "Installation d'une porte blindée ou d'un verrou multipoints",
      "Clé cassée dans la serrure",
    ],
  },
  {
    valeur: "Menuiserie",
    slug: "menuisier",
    professionnelsPluriel: "menuisiers",
    articleSingulier: "un menuisier",
    intro:
      "Un menuisier fabrique, pose et répare les ouvrages en bois et matériaux associés : fenêtres, portes, placards, parquet, escaliers, agencement sur mesure. C'est aussi le professionnel à solliciter pour améliorer l'isolation thermique et phonique d'un logement.",
    quandFaireAppel: [
      "Remplacement de fenêtres ou de volets",
      "Pose de parquet ou d'un escalier",
      "Fabrication de meubles ou placards sur mesure",
      "Réparation d'une porte qui ferme mal",
    ],
  },
  {
    valeur: "Peinture",
    slug: "peintre",
    professionnelsPluriel: "peintres",
    articleSingulier: "un peintre",
    intro:
      "Un peintre en bâtiment réalise les travaux de peinture intérieure et extérieure, la pose de revêtements muraux et la préparation des supports (enduit, ragréage). Un travail de préparation soigné fait souvent toute la différence sur la durée du résultat.",
    quandFaireAppel: [
      "Rafraîchissement d'une pièce ou d'un logement entier",
      "Ravalement de façade",
      "Pose de papier peint ou de revêtement mural",
      "Traitement de l'humidité ou des fissures avant peinture",
    ],
  },
  {
    valeur: "Maçonnerie",
    slug: "macon",
    professionnelsPluriel: "maçons",
    articleSingulier: "un maçon",
    intro:
      "Un maçon réalise les travaux de gros œuvre : fondations, murs, dalles, ouvertures, extensions. Il intervient aussi bien sur la construction neuve que sur la rénovation, souvent en coordination avec d'autres corps de métier.",
    quandFaireAppel: [
      "Construction d'une extension ou d'un garage",
      "Création ou agrandissement d'une ouverture",
      "Réparation de fissures ou de fondations",
      "Coulage d'une dalle béton",
    ],
  },
  {
    valeur: "Couverture",
    slug: "couvreur",
    professionnelsPluriel: "couvreurs",
    articleSingulier: "un couvreur",
    intro:
      "Un couvreur intervient sur la toiture : réparation de fuites, remplacement de tuiles ou d'ardoises, pose de gouttières, isolation de la charpente. Une toiture mal entretenue est l'une des premières causes de dégâts des eaux dans l'habitat.",
    quandFaireAppel: [
      "Fuite ou infiltration au niveau de la toiture",
      "Tuiles cassées ou déplacées",
      "Entretien ou nettoyage de la toiture et des gouttières",
      "Réfection complète de la couverture",
    ],
  },
  {
    valeur: "Carrelage",
    slug: "carreleur",
    professionnelsPluriel: "carreleurs",
    articleSingulier: "un carreleur",
    intro:
      "Un carreleur prépare les supports et pose le carrelage ou la faïence, au sol comme au mur, en intérieur comme en extérieur (terrasse, salle de bain, cuisine). La qualité de la pose conditionne directement la durabilité et l'étanchéité du résultat.",
    quandFaireAppel: [
      "Rénovation d'une salle de bain ou d'une cuisine",
      "Pose de carrelage au sol ou de faïence murale",
      "Aménagement d'une terrasse",
      "Remplacement de carreaux cassés ou fissurés",
    ],
  },
  {
    valeur: "Vitrerie",
    slug: "vitrier",
    professionnelsPluriel: "vitriers",
    articleSingulier: "un vitrier",
    intro:
      "Un vitrier remplace les vitres cassées, pose des doubles vitrages et intervient sur les fermetures en verre (vérandas, baies vitrées). En cas de bris de vitre, une intervention rapide permet de sécuriser le logement.",
    quandFaireAppel: [
      "Vitre cassée ou fissurée",
      "Remplacement par du double vitrage",
      "Pose d'une baie vitrée ou d'une véranda",
      "Réparation d'un survitrage",
    ],
  },
  {
    valeur: "Climatisation",
    slug: "climaticien",
    professionnelsPluriel: "climaticiens",
    articleSingulier: "un climaticien",
    intro:
      "Un climaticien installe, entretient et dépanne les systèmes de climatisation et de ventilation. Un entretien régulier limite les pannes en pleine période de forte chaleur et préserve la qualité de l'air intérieur.",
    quandFaireAppel: [
      "Installation d'une climatisation réversible",
      "Entretien annuel d'un climatiseur",
      "Panne ou fuite de gaz réfrigérant",
      "Installation d'une VMC",
    ],
  },
  {
    valeur: "Plâtrerie",
    slug: "platrier",
    professionnelsPluriel: "plâtriers",
    articleSingulier: "un plâtrier",
    intro:
      "Un plâtrier réalise les cloisons, doublages, faux plafonds et enduits intérieurs. C'est souvent une étape clé avant la peinture ou la finition d'une rénovation, qui conditionne la planéité et l'isolation des murs.",
    quandFaireAppel: [
      "Création d'une cloison ou d'un faux plafond",
      "Réparation de fissures ou de trous dans un mur",
      "Isolation intérieure par doublage",
      "Pose de placo avant peinture",
    ],
  },
  {
    valeur: "Jardinage & paysagisme",
    slug: "jardinier-paysagiste",
    professionnelsPluriel: "jardiniers-paysagistes",
    articleSingulier: "un jardinier-paysagiste",
    intro:
      "Un jardinier-paysagiste entretient les espaces verts (tonte, taille, désherbage) et conçoit l'aménagement extérieur : terrasses, clôtures, plantations, arrosage automatique. Un entretien régulier reste la meilleure façon de garder un extérieur en bon état toute l'année.",
    quandFaireAppel: [
      "Entretien régulier du jardin (tonte, taille, désherbage)",
      "Aménagement ou création d'un espace extérieur",
      "Élagage ou abattage d'arbres",
      "Installation d'un système d'arrosage",
    ],
  },
  {
    valeur: "Rénovation générale",
    slug: "renovation-generale",
    professionnelsPluriel: "entreprises de rénovation",
    articleSingulier: "une entreprise de rénovation",
    intro:
      "Une entreprise de rénovation générale coordonne l'ensemble des corps de métier sur un chantier : gros œuvre, électricité, plomberie, finitions. C'est l'interlocuteur à privilégier pour un projet de rénovation complète, afin d'éviter de gérer soi-même plusieurs artisans en parallèle.",
    quandFaireAppel: [
      "Rénovation complète d'un logement",
      "Transformation ou réagencement d'espaces",
      "Rénovation énergétique globale",
      "Suivi de chantier avec plusieurs corps de métier",
    ],
  },
  {
    valeur: "Ramonage",
    slug: "ramoneur",
    professionnelsPluriel: "ramoneurs",
    articleSingulier: "un ramoneur",
    intro:
      "Un ramoneur nettoie les conduits de cheminée, poêles et chaudières, et délivre le certificat de ramonage exigé par les assurances. Le ramonage est obligatoire au moins une fois par an pour les logements équipés d'un conduit de fumée.",
    quandFaireAppel: [
      "Ramonage annuel obligatoire",
      "Avant la mise en route de la cheminée ou du poêle en hiver",
      "Obtention du certificat de ramonage pour l'assurance",
      "Mauvais tirage ou odeurs de fumée",
    ],
  },
];

export function metierParSlug(slug: string): MetierSeo | undefined {
  return METIERS_SEO.find((m) => m.slug === slug);
}
