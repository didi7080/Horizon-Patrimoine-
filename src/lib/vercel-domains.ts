const API = "https://api.vercel.com";

function scope(): string {
  const equipe = process.env.VERCEL_TEAM_ID;
  return equipe ? `?teamId=${equipe}` : "";
}

function headers() {
  return {
    Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`,
    "Content-Type": "application/json",
  };
}

export function vercelConfigure(): boolean {
  return Boolean(process.env.VERCEL_API_TOKEN && process.env.VERCEL_PROJECT_ID);
}

export type StatutDomaine = {
  verifie: boolean;
  cible: string;
  erreur?: string;
};

/** Attache un domaine (ou sous-domaine) au projet Vercel. Idempotent si déjà attaché. */
export async function attacherDomaine(domaine: string): Promise<{ ok: true } | { ok: false; erreur: string }> {
  if (!vercelConfigure()) return { ok: false, erreur: "Non configuré." };
  const res = await fetch(`${API}/v10/projects/${process.env.VERCEL_PROJECT_ID}/domains${scope()}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ name: domaine }),
  });
  if (res.ok) return { ok: true };
  const corps = await res.json().catch(() => null);
  const code = corps?.error?.code;
  if (code === "domain_already_in_use" && corps?.error?.projectId === process.env.VERCEL_PROJECT_ID) {
    return { ok: true };
  }
  return { ok: false, erreur: corps?.error?.message ?? `Échec (${res.status}).` };
}

/** Détache un domaine du projet Vercel. */
export async function detacherDomaine(domaine: string): Promise<void> {
  if (!vercelConfigure()) return;
  await fetch(`${API}/v9/projects/${process.env.VERCEL_PROJECT_ID}/domains/${encodeURIComponent(domaine)}${scope()}`, {
    method: "DELETE",
    headers: headers(),
  }).catch(() => undefined);
}

/** Vérifie si le domaine est correctement configuré côté DNS. */
export async function statutDomaine(domaine: string): Promise<StatutDomaine> {
  if (!vercelConfigure()) return { verifie: false, cible: "cname.vercel-dns.com", erreur: "Non configuré." };
  try {
    const params = new URLSearchParams({ projectIdOrName: process.env.VERCEL_PROJECT_ID! });
    if (process.env.VERCEL_TEAM_ID) params.set("teamId", process.env.VERCEL_TEAM_ID);
    const res = await fetch(`${API}/v6/domains/${encodeURIComponent(domaine)}/config?${params.toString()}`, {
      headers: headers(),
    });
    if (!res.ok) return { verifie: false, cible: "cname.vercel-dns.com" };
    const data = await res.json();
    return { verifie: data.misconfigured === false, cible: "cname.vercel-dns.com" };
  } catch {
    return { verifie: false, cible: "cname.vercel-dns.com" };
  }
}
