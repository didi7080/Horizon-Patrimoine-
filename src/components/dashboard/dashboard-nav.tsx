"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  Code2,
  LayoutGrid,
  ListChecks,
  Settings,
  Star,
  Users,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";

const LIENS = [
  { href: "/dashboard", label: "Vue du jour", icon: LayoutGrid, exact: true },
  { href: "/dashboard/rendez-vous", label: "Rendez-vous", icon: CalendarDays },
  { href: "/dashboard/statistiques", label: "Statistiques", icon: BarChart3 },
  { href: "/dashboard/prestations", label: "Prestations", icon: Wrench },
  { href: "/dashboard/equipe", label: "Équipe", icon: Users },
  { href: "/dashboard/clients", label: "Clients", icon: ListChecks },
  { href: "/dashboard/avis", label: "Avis", icon: Star },
  { href: "/dashboard/widget", label: "Widget & site web", icon: Code2 },
  { href: "/dashboard/reglages", label: "Réglages", icon: Settings },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto px-2 py-2 lg:flex-col lg:overflow-visible lg:px-3 lg:py-4">
      {LIENS.map((lien) => {
        const actif = lien.exact ? pathname === lien.href : pathname.startsWith(lien.href);
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
          </Link>
        );
      })}
    </nav>
  );
}
