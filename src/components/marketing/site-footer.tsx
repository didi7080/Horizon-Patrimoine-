import Link from "next/link";
import { Logo } from "@/components/logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-muted">
            La prise de rendez-vous en ligne pensée pour les artisans du bâtiment et des services à
            domicile.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Clients</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>
              <Link href="/recherche" className="hover:text-foreground">Trouver un artisan</Link>
            </li>
            <li>
              <Link href="/recherche?metier=Plomberie" className="hover:text-foreground">Plombiers</Link>
            </li>
            <li>
              <Link href="/recherche?metier=%C3%89lectricit%C3%A9" className="hover:text-foreground">
                Électriciens
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Artisans</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>
              <Link href="/pour-les-artisans" className="hover:text-foreground">Pourquoi ArtisanRDV</Link>
            </li>
            <li>
              <Link href="/tarifs" className="hover:text-foreground">Tarifs</Link>
            </li>
            <li>
              <Link href="/inscription" className="hover:text-foreground">Créer mon compte</Link>
            </li>
            <li>
              <Link href="/connexion" className="hover:text-foreground">Se connecter</Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Entreprise</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li className="hover:text-foreground">Mentions légales</li>
            <li className="hover:text-foreground">Confidentialité</li>
            <li className="hover:text-foreground">Contact</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} ArtisanRDV. Tous droits réservés.
      </div>
    </footer>
  );
}
