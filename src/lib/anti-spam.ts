/** Détection anti-bot basique : honeypot + délai minimum avant soumission. */
export function estBot(formData: FormData): boolean {
  const piege = String(formData.get("site_web") ?? "").trim();
  if (piege !== "") return true;
  const renduA = Number(formData.get("rendu_a") ?? 0);
  if (!renduA || Date.now() - renduA < 1200) return true;
  return false;
}
