"use client";

import { useRef, useState, useTransition } from "react";
import { Camera, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useHorsConnexion } from "@/lib/hooks/hors-connexion";
import {
  ajouterPhotoIntervention,
  supprimerPhotoIntervention,
  listerPhotosIntervention,
  type PhotoAffichee,
} from "@/app/dashboard/actions";

export function PhotosIntervention({
  rdvId,
  nombrePhotos,
  modifiable = false,
}: {
  rdvId: string;
  nombrePhotos: number;
  modifiable?: boolean;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [photos, setPhotos] = useState<PhotoAffichee[] | null>(null);
  const [chargement, setChargement] = useState(false);
  const [pending, startTransition] = useTransition();
  const inputAvantRef = useRef<HTMLInputElement>(null);
  const inputApresRef = useRef<HTMLInputElement>(null);
  const horsConnexion = useHorsConnexion();

  async function ouvrir() {
    const prochainEtat = !ouvert;
    setOuvert(prochainEtat);
    if (prochainEtat && photos === null && !horsConnexion) {
      setChargement(true);
      try {
        const resultat = await listerPhotosIntervention(rdvId);
        setPhotos(resultat);
      } finally {
        setChargement(false);
      }
    }
  }

  function envoyerPhoto(type: "avant" | "apres", fichier: File) {
    const formData = new FormData();
    formData.set("photo", fichier);
    startTransition(async () => {
      const resultat = await ajouterPhotoIntervention(rdvId, type, formData);
      if (!resultat.ok) {
        toast.error(resultat.erreur);
        return;
      }
      const miseAJour = await listerPhotosIntervention(rdvId);
      setPhotos(miseAJour);
    });
  }

  function retirer(photoId: string) {
    startTransition(async () => {
      const resultat = await supprimerPhotoIntervention(photoId);
      if (!resultat.ok) {
        toast.error(resultat.erreur);
        return;
      }
      setPhotos((p) => (p ?? []).filter((photo) => photo.id !== photoId));
    });
  }

  if (nombrePhotos === 0 && !modifiable) return null;

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={ouvrir}
        className="inline-flex items-center gap-1 rounded-full border border-dashed border-border-strong px-2 py-0.5 text-xs text-muted hover:text-foreground"
      >
        <Camera className="size-3" /> {nombrePhotos > 0 ? `${nombrePhotos} photo${nombrePhotos > 1 ? "s" : ""}` : "Photos"}
      </button>

      {ouvert && (
        <div className="mt-2 space-y-2 rounded-lg border border-border bg-surface p-3">
          {chargement ? (
            <p className="flex items-center gap-2 text-xs text-muted">
              <Loader2 className="size-3 animate-spin" /> Chargement...
            </p>
          ) : horsConnexion && photos === null ? (
            <p className="text-xs text-muted">Liste des photos indisponible hors connexion.</p>
          ) : (
            <>
              {(photos ?? []).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {(photos ?? []).map((p) => (
                    <div key={p.id} className="relative">
                      {horsConnexion ? (
                        <div className="flex size-20 items-center justify-center rounded-md bg-muted text-center text-[10px] text-muted">
                          Photo indisponible hors connexion
                        </div>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.url} alt={p.type} className="size-20 rounded-md object-cover" />
                      )}
                      <span className="absolute bottom-0.5 left-0.5 rounded bg-black/60 px-1 text-[10px] text-white">
                        {p.type === "avant" ? "Avant" : "Après"}
                      </span>
                      {modifiable && (
                        <button
                          type="button"
                          onClick={() => retirer(p.id)}
                          disabled={pending || horsConnexion}
                          title={horsConnexion ? "Indisponible hors connexion" : undefined}
                          className="absolute -right-1 -top-1 rounded-full bg-background p-0.5 text-muted shadow hover:text-foreground disabled:opacity-50"
                        >
                          <X className="size-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {(photos ?? []).length === 0 && <p className="text-xs text-muted">Aucune photo pour cette intervention.</p>}
              {modifiable && (
                <div className="flex gap-2">
                  <input
                    ref={inputAvantRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      const fichier = e.target.files?.[0];
                      if (fichier) envoyerPhoto("avant", fichier);
                      e.target.value = "";
                    }}
                  />
                  <input
                    ref={inputApresRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      const fichier = e.target.files?.[0];
                      if (fichier) envoyerPhoto("apres", fichier);
                      e.target.value = "";
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={pending || horsConnexion}
                    title={horsConnexion ? "Indisponible hors connexion" : undefined}
                    onClick={() => inputAvantRef.current?.click()}
                  >
                    {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Camera className="size-3.5" />} Avant
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={pending || horsConnexion}
                    title={horsConnexion ? "Indisponible hors connexion" : undefined}
                    onClick={() => inputApresRef.current?.click()}
                  >
                    {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Camera className="size-3.5" />} Après
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
