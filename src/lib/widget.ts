export function baseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://artisanrdv.com";
}

export function lienReservation(origine: string, slug: string): string {
  return `${origine}/e/${slug}`;
}

export function codeBoutonWidget(origine: string, slug: string, couleur: string): string {
  return `<script src="${origine}/widget.js" data-artisanrdv="${slug}" data-color="${couleur}" data-label="Prendre rendez-vous" async></script>`;
}
