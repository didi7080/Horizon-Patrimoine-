const EXPEDITEUR = "ArtisanRDV <contact@artisanrdv.com>";

export function emailConfigure(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function envoyerEmail(options: {
  to: string;
  subject: string;
  text: string;
  replyTo?: string | null;
}): Promise<{ ok: true } | { ok: false; erreur: string }> {
  if (!emailConfigure()) return { ok: false, erreur: "L'envoi d'e-mails n'est pas configuré sur cette instance." };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: EXPEDITEUR,
        to: [options.to],
        subject: options.subject,
        text: options.text,
        ...(options.replyTo ? { reply_to: options.replyTo } : {}),
      }),
    });
    if (!res.ok) {
      const corps = await res.text().catch(() => "");
      return { ok: false, erreur: `L'envoi a échoué (${res.status}). ${corps}`.trim() };
    }
    return { ok: true };
  } catch {
    return { ok: false, erreur: "L'envoi a échoué (erreur réseau)." };
  }
}
