import QRCode from "qrcode";

/** Génère un QR code en data URL PNG, prêt à afficher dans une balise <img> ou à télécharger. */
export async function genererQrCodeDataUrl(texte: string): Promise<string> {
  return QRCode.toDataURL(texte, { width: 480, margin: 2, color: { dark: "#0f172a", light: "#ffffff" } });
}
