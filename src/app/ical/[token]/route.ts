import { createAnonClient } from "@/lib/supabase/anon";

type EvenementIcal = {
  uid: string;
  debut: string;
  fin: string;
  titre: string;
  lieu: string;
  description: string;
};

function formatDateIcal(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function echapper(texte: string): string {
  return texte.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = createAnonClient();
  const { data, error } = await supabase.rpc("ical_salarie", { p_token: token });

  if (error || !data) {
    return new Response("Agenda introuvable.", { status: 404 });
  }

  const evenements = data as EvenementIcal[];
  const maintenant = formatDateIcal(new Date().toISOString());

  const lignes = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ArtisanRDV//Agenda//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Agenda ArtisanRDV",
    "REFRESH-INTERVAL;VALUE=DURATION:PT30M",
    ...evenements.flatMap((e) => [
      "BEGIN:VEVENT",
      `UID:${e.uid}@artisanrdv`,
      `DTSTAMP:${maintenant}`,
      `DTSTART:${formatDateIcal(e.debut)}`,
      `DTEND:${formatDateIcal(e.fin)}`,
      `SUMMARY:${echapper(e.titre)}`,
      e.lieu ? `LOCATION:${echapper(e.lieu)}` : null,
      e.description ? `DESCRIPTION:${echapper(e.description)}` : null,
      "END:VEVENT",
    ]),
    "END:VCALENDAR",
  ].filter((ligne): ligne is string => ligne !== null);

  return new Response(lignes.join("\r\n"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
