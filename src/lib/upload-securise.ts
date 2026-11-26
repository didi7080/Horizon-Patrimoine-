/** Types de fichiers autorisés en upload, par extension (jamais le MIME type déclaré par le navigateur, qui n'est pas fiable). */
export const TYPES_IMAGE: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
};

export const TYPES_JUSTIFICATIF: Record<string, string> = {
  ...TYPES_IMAGE,
  pdf: "application/pdf",
};

/** Vérifie l'extension du fichier contre une liste autorisée et renvoie le contentType correspondant (jamais celui du navigateur). */
export function fichierSur(
  nomFichier: string,
  typesAutorises: Record<string, string>,
): { extension: string; contentType: string } | null {
  const extension = nomFichier.split(".").pop()?.toLowerCase();
  if (!extension || !(extension in typesAutorises)) return null;
  return { extension, contentType: typesAutorises[extension] };
}
