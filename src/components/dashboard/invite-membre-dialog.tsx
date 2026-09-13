"use client";

import { useActionState } from "react";
import { Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import { inviterMembre, type EtatInvitation } from "@/app/dashboard/equipe/invite-actions";

export function InviteMembreDialog({
  salariesSansAcces,
}: {
  salariesSansAcces: { id: string; nom: string }[];
}) {
  const [etat, action, enCours] = useActionState<EtatInvitation, FormData>(inviterMembre, null);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          <UserPlus className="size-4" /> Inviter un membre
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Inviter un membre de l’équipe</DialogTitle>
        </DialogHeader>

        {etat?.success ? (
          <div className="space-y-4">
            <p className="text-sm text-success">
              Invitation envoyée. La personne recevra un e-mail pour créer son mot de passe et
              accéder au tableau de bord.
            </p>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button">Fermer</Button>
              </DialogClose>
            </DialogFooter>
          </div>
        ) : (
          <form action={action} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="inv-nom">Nom</Label>
              <Input id="inv-nom" name="nom" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inv-email">E-mail</Label>
              <Input id="inv-email" name="email" type="email" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inv-role">Rôle</Label>
              <Select name="role" defaultValue="salarie">
                <SelectTrigger id="inv-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="salarie">Salarié — accès à son propre agenda</SelectItem>
                  <SelectItem value="admin">Administrateur — accès complet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {salariesSansAcces.length > 0 && (
              <div className="space-y-1.5">
                <Label htmlFor="inv-salarie">Associer à un membre de l’équipe existant</Label>
                <Select name="salarie_id">
                  <SelectTrigger id="inv-salarie">
                    <SelectValue placeholder="Aucun (optionnel)" />
                  </SelectTrigger>
                  <SelectContent>
                    {salariesSansAcces.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Permet à cette personne de gérer directement ses propres rendez-vous.
                </p>
              </div>
            )}

            {etat?.error && <p className="text-sm text-danger">{etat.error}</p>}

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Annuler
                </Button>
              </DialogClose>
              <Button type="submit" disabled={enCours}>
                {enCours && <Loader2 className="size-4 animate-spin" />}
                Envoyer l’invitation
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
