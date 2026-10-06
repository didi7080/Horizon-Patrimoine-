/**
 * Contenu de la vitrine du groupe Tout Faire Habitat et de la page « Rejoindre le réseau ».
 * Tout est centralisé ici pour pouvoir mettre à jour les textes, ajouter une société
 * ou changer l'adresse de contact sans toucher aux pages.
 */

export const GROUPE = {
  nom: "Tout Faire Habitat",
  sigle: "T.F.H",
  accroche: "Un groupe, tous les savoir-faire de votre maison",
  territoire: "Rioz, Besançon, Haute-Saône et Doubs",
  // Adresse qui reçoit les candidatures au réseau. À remplacer par l'adresse définitive du groupe.
  emailReseau: "contact@artisanrdv.fr",
  chiffres: [
    { valeur: "Près de 4 M€", libelle: "de chiffre d'affaires cumulé" },
    { valeur: "4 métiers", libelle: "réunis sous une même bannière" },
    { valeur: "1 interlocuteur", libelle: "pour toute la maison" },
  ],
} as const;

export type SocieteGroupe = {
  nom: string;
  metier: string;
  description: string;
  prestations: string[];
  /** Slug de la fiche ArtisanRDV si la société prend déjà ses rendez-vous en ligne. */
  slug?: string;
};

export const SOCIETES_GROUPE: SocieteGroupe[] = [
  {
    nom: "Bio Chauff",
    metier: "Chauffage",
    description:
      "L'entreprise historique du groupe : installation et entretien de systèmes de chauffage performants.",
    prestations: ["Chaudières", "Poêles", "Pompes à chaleur", "Entretien annuel"],
  },
  {
    nom: "PPC",
    metier: "Plomberie & salle de bain",
    description:
      "Plomberie, dépannage et création de salles de bain, du remplacement d'un équipement à la rénovation complète.",
    prestations: ["Plomberie", "Dépannage", "Salles de bain", "Rénovation"],
    slug: "ppc",
  },
  {
    nom: "Pelcy Paysage",
    metier: "Paysage & entretien extérieur",
    description:
      "Entretien et aménagement des espaces extérieurs, pour les particuliers comme pour les parcs locatifs.",
    prestations: ["Tonte", "Taille de haies", "Débroussaillage", "Nettoyage de gouttières"],
  },
  {
    nom: "Ramonage T.F.H",
    metier: "Ramonage",
    description:
      "Ramonage des conduits et entretien des installations de chauffage au bois, en complément de Bio Chauff.",
    prestations: ["Ramonage", "Certificat de ramonage", "Contrôle des conduits"],
  },
];

export const AVANTAGES_RESEAU = [
  {
    titre: "Une marque reconnue sur votre territoire",
    description:
      "Vous travaillez sous la bannière Tout Faire Habitat, qui rassure les particuliers comme les professionnels de l'immobilier.",
  },
  {
    titre: "Des clients envoyés par le groupe",
    description:
      "Quand un client d'une société du réseau a besoin de votre métier, c'est vers vous qu'il est orienté en priorité.",
  },
  {
    titre: "Les offres combinées et les contrats d'entretien",
    description:
      "Vous profitez des offres multi-métiers et du pack entretien annuel, qui génèrent un chiffre d'affaires récurrent.",
  },
  {
    titre: "Les partenariats professionnels du groupe",
    description:
      "Agences immobilières, bailleurs, gros propriétaires : le groupe négocie les accords, vous réalisez les interventions.",
  },
  {
    titre: "Les outils numériques inclus",
    description:
      "Prise de rendez-vous en ligne, agenda d'équipe, rappels automatiques et avis clients vérifiés, prêts à l'emploi.",
  },
  {
    titre: "La solidité d'un groupe",
    description:
      "Un groupe qui réinvestit ses résultats pour se développer : de quoi être réactif sur les chantiers et les recrutements.",
  },
];

export const ENGAGEMENTS_RESEAU = [
  "Vous restez dirigeant de votre entreprise et gardez la majorité de votre société.",
  "Vous respectez la charte qualité du groupe : délais de réponse, devis clairs, chantiers propres.",
  "Vous orientez vos clients vers les autres métiers du réseau quand ils en ont besoin.",
  "Vous utilisez les outils communs (agenda, rendez-vous en ligne) pour un suivi client homogène.",
];

export const CONDITIONS_RESEAU = [
  {
    titre: "Une entreprise en règle",
    description:
      "Immatriculation à jour (SIRET), comptes tenus et situation sociale et fiscale régulière.",
  },
  {
    titre: "Les assurances obligatoires",
    description:
      "Responsabilité civile professionnelle et, pour les travaux qui y sont soumis, garantie décennale en cours de validité.",
  },
  {
    titre: "Les qualifications de votre métier",
    description:
      "Les qualifications exigées par votre activité, par exemple RGE pour les travaux d'efficacité énergétique ou une qualification de ramoneur pour le ramonage.",
  },
  {
    titre: "Un ancrage local",
    description:
      "Une activité implantée sur le territoire du groupe ou dans une zone que le réseau souhaite couvrir.",
  },
];

export const ETAPES_ADHESION = [
  {
    titre: "Premier échange",
    description: "Vous nous présentez votre entreprise, votre métier et vos ambitions.",
  },
  {
    titre: "Rencontre et étude du dossier",
    description:
      "Nous vérifions ensemble les conditions d'entrée et vous présentons le fonctionnement détaillé du groupe.",
  },
  {
    titre: "Proposition d'adhésion",
    description:
      "Vous recevez une proposition adaptée à votre entreprise : modalités d'entrée, engagements réciproques, calendrier.",
  },
  {
    titre: "Intégration au réseau",
    description:
      "Mise en place des outils, présentation aux autres sociétés du groupe et premiers clients partagés.",
  },
];

export const FAQ_RESEAU = [
  {
    question: "Est-ce que je perds le contrôle de mon entreprise ?",
    reponse:
      "Non. Chaque société du groupe reste indépendante : vous restez dirigeant et vous gardez la majorité de votre entreprise.",
  },
  {
    question: "Quels métiers recherchez-vous ?",
    reponse:
      "Tous les métiers de l'habitat qui complètent l'offre actuelle : électricité, menuiserie, couverture, peinture, maçonnerie, et des sociétés des métiers déjà présents sur de nouveaux secteurs.",
  },
  {
    question: "Combien coûte l'entrée dans le réseau ?",
    reponse:
      "Les conditions financières dépendent de la taille et du métier de votre entreprise. Elles vous sont présentées en détail lors de la rencontre.",
  },
  {
    question: "Je suis seul, sans salarié : puis-je rejoindre le réseau ?",
    reponse:
      "Oui, à condition de répondre aux exigences de votre métier. Le réseau aide justement les petites structures à accéder à plus de clients.",
  },
];
