import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { Tables } from "@/lib/types/database";

export function ClientRow({ client, nbRdv }: { client: Tables<"clients">; nbRdv: number }) {
  return (
    <Link href={`/dashboard/clients/${client.id}`}>
      <Card className="flex flex-col gap-3 p-4 transition-colors hover:border-brand sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium text-foreground">{client.nom}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted">
            {client.email && (
              <span className="inline-flex items-center gap-1">
                <Mail className="size-3.5" /> {client.email}
              </span>
            )}
            {client.telephone && (
              <span className="inline-flex items-center gap-1">
                <Phone className="size-3.5" /> {client.telephone}
              </span>
            )}
          </div>
        </div>
        <span className="text-sm text-muted">{nbRdv} rendez-vous</span>
      </Card>
    </Link>
  );
}
