import { AlertTriangle } from "lucide-react";

export function AvertissementModele() {
  return (
    <div className="mb-6 flex gap-3 rounded-lg border border-warning/30 bg-warning-light p-4 text-sm text-warning">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      <p>
        Modèle de document à compléter avec les informations juridiques réelles de votre société
        (indiquées entre crochets) et à faire valider par un professionnel du droit avant mise en
        ligne.
      </p>
    </div>
  );
}
