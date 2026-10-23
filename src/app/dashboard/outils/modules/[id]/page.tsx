import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getEntrepriseContext } from "@/lib/dashboard/context";
import { createAdminClient } from "@/lib/supabase/admin";
import { ModuleEditor } from "@/components/dashboard/outils/module-editor";
import type { Champ, Formule } from "@/lib/calculs/types";

export const revalidate = 0;

export default async function ModuleCalculPage({ params }: PageProps<"/dashboard/outils/modules/[id]">) {
  const { id } = await params;
  const { entreprise } = await getEntrepriseContext();

  const nouveau = id === "nouveau";
  let nomInitial = "";
  let champsInitiaux: Champ[] = [];
  let formulesInitiales: Formule[] = [];

  if (!nouveau) {
    const admin = createAdminClient();
    if (!admin) notFound();
    const { data: module_ } = await admin
      .from("modules_calcul")
      .select("*")
      .eq("id", id)
      .eq("entreprise_id", entreprise.id)
      .maybeSingle();
    if (!module_) notFound();
    nomInitial = module_.nom;
    champsInitiaux = (module_.champs as Champ[]) ?? [];
    formulesInitiales = (module_.formules as Formule[]) ?? [];
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <Link href="/dashboard/outils" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
          <ArrowLeft className="size-3.5" /> Retour aux outils de calcul
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">
          {nouveau ? "Nouveau module de calcul" : "Modifier le module"}
        </h1>
        <p className="mt-1 text-muted">
          Définissez vos propres champs et formules. Vous seul décidez des calculs utilisés par votre entreprise.
        </p>
      </div>

      <ModuleEditor
        moduleId={nouveau ? null : id}
        nomInitial={nomInitial}
        champsInitiaux={champsInitiaux}
        formulesInitiales={formulesInitiales}
      />
    </div>
  );
}
