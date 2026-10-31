export function turnstileConfigure(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY);
}

/** Vérifie un jeton Turnstile auprès de Cloudflare. Laisse passer si non configuré (comportement actuel). */
export async function verifierTurnstile(token: string, ip?: string): Promise<boolean> {
  if (!turnstileConfigure()) return true;
  if (!token) return false;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: process.env.TURNSTILE_SECRET_KEY!,
        response: token,
        ...(ip ? { remoteip: ip } : {}),
      }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}
