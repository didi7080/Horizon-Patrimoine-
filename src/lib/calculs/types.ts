export type TypeChamp = "nombre" | "texte" | "select" | "booleen";

export type Champ = {
  id: string;
  label: string;
  type: TypeChamp;
  unite?: string;
  options?: string[];
  defaut?: string | number | boolean;
  aide?: string;
};

export type Formule = {
  id: string;
  label: string;
  expression: string;
  unite?: string;
  decimales?: number;
};

export type ModuleTemplate = {
  nom: string;
  champs: Champ[];
  formules: Formule[];
};

export type LigneMateriel = {
  id: string;
  designation: string;
  unite: string;
  quantite: number;
  prixUnitaireCents: number;
};

export type DonneesEtude = {
  champs?: Record<string, string | number | boolean>;
  materiel?: LigneMateriel[];
  synthese?: string;
};
