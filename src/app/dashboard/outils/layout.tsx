import { redirect } from "next/navigation";
import { getEntrepriseContext, planActuelEntreprise } from "@/lib/dashboard/context";
import { accesOutilsCalcul } from "@/lib/stripe";

export default async function OutilsLayout({ children }: LayoutProps<"/dashboard/outils">) {
  const { entreprise } = await getEntrepriseContext();
  const plan = await planActuelEntreprise(entreprise.id, entreprise.nb_salaries);
  if (!accesOutilsCalcul(plan)) redirect("/dashboard/outils-premium");
  return <>{children}</>;
}
