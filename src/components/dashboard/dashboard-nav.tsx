"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  Calculator,
  Code2,
  FileSpreadsheet,
  FileText,
  Hammer,
  LayoutGrid,
  Landmark,
  ListChecks,
  Package,
  Settings,
  Smartphone,
  Sparkles,
  Star,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const LIENS = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutGrid, exact: true },
  { href: "/dashboard/ma-journee", label: "Ma journée", icon: Smartphone },
  { href: "/dashboard/rendez-vous", label: "Rendez-vous", icon: CalendarDays },
  { href: "/dashboard/statistiques", label: "Statistiques", icon: BarChart3 },
  { href: "/dashboard/bilan", label: "Bilan mensuel", icon: FileSpreadsheet },
  { href: "/dashboard/depenses", label: "Dépenses", icon: Wallet },
  { href: "/dashboard/prestations", label: "Prestations", icon: Wrench },
  { href: "/dashboard/documents", label: "Devis & factures", icon: FileText },
  { href: "/dashboard/chantiers", label: "Chantiers", icon: Hammer },
  { href: "/dashboard/outils/materiel", label: "Matériel & stock", icon: Package, premium: true },
  { href: "/dashboard/outils", label: "Études & calculs", icon: Calculator, premium: true },
  { href: "/dashboard/assistant", label: "Assistant IA", icon: Sparkles, premium: true },
  { href: "/dashboard/paiements", label: "Paiements", icon: Landmark },
  { href: "/dashboard/equipe", label: "Équipe", icon: Users },
  { href: "/dashboard/clients", label: "Clients", icon: ListChecks },
  { href: "/dashboard/avis", label: "Avis", icon: Star },
  { href: "/dashboard/widget", label: "Widget & site web", icon: Code2 },
  { href: "/dashboard/reglages", label: "Réglages", icon: Settings },
];

export function DashboardNav({ afficherBadgePremium = false }: { afficherBadgePremium?: boolean }) {
  const pathname = usePathname();

  // Plusieurs liens peuvent correspondre au même chemin (ex. /dashboard/outils et
  // /dashboard/outils/materiel) : seul le plus précis doit être surligné.
  const lienActif = LIENS.reduce<(typeof LIENS)[number] | null>((meilleur, lien) => {
    const correspond = lien.exact ? pathname === lien.href : pathname.startsWith(lien.href);
    if (!correspond) return meilleur;
    if (!meilleur || lien.href.length > meilleur.href.length) return lien;
    return meilleur;
  }, null);

  return (
    <nav className="flex gap-1 overflow-x-auto px-2 py-2 lg:flex-col lg:overflow-visible lg:px-3 lg:py-4">
      {LIENS.map((lien) => {
        const actif = lien === lienActif;
        return (
          <Link
            key={lien.href}
            href={lien.href}
            className={cn(
              "flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              actif ? "bg-brand-light text-brand-dark" : "text-muted hover:bg-surface hover:text-foreground",
            )}
          >
            <lien.icon className="size-4" />
            {lien.label}
            {lien.premium && afficherBadgePremium && (
              <Badge variant="info" className="ml-auto">
                Premium
              </Badge>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
