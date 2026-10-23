/**
 * Évaluateur d'expressions arithmétiques pour les formules que les artisans
 * définissent eux-mêmes (voir modules_calcul.formules). Volontairement sans
 * eval()/Function() : on tokenise puis on parse à la main une grammaire très
 * restreinte (nombres, identifiants, + - * / ^, parenthèses, une poignée de
 * fonctions), donc aucune formule utilisateur ne peut exécuter de code.
 */

export class ErreurFormule extends Error {}

type Jeton =
  | { type: "nombre"; valeur: number }
  | { type: "identifiant"; valeur: string }
  | { type: "operateur"; valeur: string }
  | { type: "virgule" }
  | { type: "parenthese_ouvrante" }
  | { type: "parenthese_fermante" };

const FONCTIONS: Record<string, (...args: number[]) => number> = {
  min: (...a) => Math.min(...a),
  max: (...a) => Math.max(...a),
  round: (a, decimales = 0) => {
    const f = 10 ** decimales;
    return Math.round(a * f) / f;
  },
  abs: Math.abs,
  sqrt: Math.sqrt,
  pow: Math.pow,
  floor: Math.floor,
  ceil: Math.ceil,
};

function tokeniser(expression: string): Jeton[] {
  const jetons: Jeton[] = [];
  let i = 0;
  while (i < expression.length) {
    const c = expression[i];
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    if (/[0-9.]/.test(c)) {
      let nombre = "";
      while (i < expression.length && /[0-9.]/.test(expression[i])) {
        nombre += expression[i];
        i++;
      }
      const valeur = Number(nombre);
      if (!Number.isFinite(valeur)) throw new ErreurFormule(`Nombre invalide : "${nombre}"`);
      jetons.push({ type: "nombre", valeur });
      continue;
    }
    if (/[a-zA-Z_]/.test(c)) {
      let id = "";
      while (i < expression.length && /[a-zA-Z0-9_]/.test(expression[i])) {
        id += expression[i];
        i++;
      }
      jetons.push({ type: "identifiant", valeur: id });
      continue;
    }
    if ("+-*/^".includes(c)) {
      jetons.push({ type: "operateur", valeur: c });
      i++;
      continue;
    }
    if (c === ",") {
      jetons.push({ type: "virgule" });
      i++;
      continue;
    }
    if (c === "(") {
      jetons.push({ type: "parenthese_ouvrante" });
      i++;
      continue;
    }
    if (c === ")") {
      jetons.push({ type: "parenthese_fermante" });
      i++;
      continue;
    }
    throw new ErreurFormule(`Caractère non autorisé dans la formule : "${c}"`);
  }
  return jetons;
}

class Analyseur {
  private position = 0;

  constructor(
    private jetons: Jeton[],
    private portee: Record<string, number>,
  ) {}

  analyser(): number {
    const resultat = this.expression();
    if (this.position < this.jetons.length) {
      throw new ErreurFormule("Formule invalide : des éléments inattendus à la fin.");
    }
    return resultat;
  }

  private jetonActuel(): Jeton | undefined {
    return this.jetons[this.position];
  }

  private expression(): number {
    let valeur = this.terme();
    for (;;) {
      const jeton = this.jetonActuel();
      if (jeton?.type === "operateur" && (jeton.valeur === "+" || jeton.valeur === "-")) {
        this.position++;
        const droite = this.terme();
        valeur = jeton.valeur === "+" ? valeur + droite : valeur - droite;
      } else {
        break;
      }
    }
    return valeur;
  }

  private terme(): number {
    let valeur = this.puissance();
    for (;;) {
      const jeton = this.jetonActuel();
      if (jeton?.type === "operateur" && (jeton.valeur === "*" || jeton.valeur === "/")) {
        this.position++;
        const droite = this.puissance();
        valeur = jeton.valeur === "*" ? valeur * droite : valeur / droite;
      } else {
        break;
      }
    }
    return valeur;
  }

  private puissance(): number {
    const base = this.unaire();
    const jeton = this.jetonActuel();
    if (jeton?.type === "operateur" && jeton.valeur === "^") {
      this.position++;
      const exposant = this.puissance();
      return Math.pow(base, exposant);
    }
    return base;
  }

  private unaire(): number {
    const jeton = this.jetonActuel();
    if (jeton?.type === "operateur" && jeton.valeur === "-") {
      this.position++;
      return -this.unaire();
    }
    if (jeton?.type === "operateur" && jeton.valeur === "+") {
      this.position++;
      return this.unaire();
    }
    return this.primaire();
  }

  private primaire(): number {
    const jeton = this.jetonActuel();
    if (!jeton) throw new ErreurFormule("Formule incomplète.");

    if (jeton.type === "nombre") {
      this.position++;
      return jeton.valeur;
    }

    if (jeton.type === "parenthese_ouvrante") {
      this.position++;
      const valeur = this.expression();
      const fermante = this.jetonActuel();
      if (fermante?.type !== "parenthese_fermante") {
        throw new ErreurFormule("Parenthèse fermante manquante.");
      }
      this.position++;
      return valeur;
    }

    if (jeton.type === "identifiant") {
      this.position++;
      const suivant = this.jetonActuel();
      if (suivant?.type === "parenthese_ouvrante") {
        this.position++;
        const args: number[] = [];
        if (this.jetonActuel()?.type !== "parenthese_fermante") {
          args.push(this.expression());
          while (this.jetonActuel()?.type === "virgule") {
            this.position++;
            args.push(this.expression());
          }
        }
        const fermante = this.jetonActuel();
        if (fermante?.type !== "parenthese_fermante") {
          throw new ErreurFormule("Parenthèse fermante manquante après les arguments.");
        }
        this.position++;
        const fonction = FONCTIONS[jeton.valeur];
        if (!fonction) throw new ErreurFormule(`Fonction inconnue : "${jeton.valeur}"`);
        return fonction(...args);
      }
      if (!(jeton.valeur in this.portee)) {
        throw new ErreurFormule(`Champ ou formule inconnu : "${jeton.valeur}"`);
      }
      return this.portee[jeton.valeur];
    }

    throw new ErreurFormule("Formule invalide.");
  }
}

/** Évalue une expression de formule dans une portée de valeurs numériques nommées. */
export function evaluerFormule(expression: string, portee: Record<string, number>): number {
  if (!expression.trim()) throw new ErreurFormule("Formule vide.");
  const jetons = tokeniser(expression);
  return new Analyseur(jetons, portee).analyser();
}

/** Vérifie qu'une expression est syntaxiquement valide, sans se soucier des valeurs. */
export function formuleValide(expression: string): boolean {
  try {
    tokeniser(expression);
    return true;
  } catch {
    return false;
  }
}
