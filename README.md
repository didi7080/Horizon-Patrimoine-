# ArtisanRDV

La prise de rendez-vous en ligne pour les artisans du bâtiment et des services à domicile —
pensée comme le « Doctolib des artisans » : page de réservation publique, agenda partagé,
rappels automatiques et avis clients.

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript + Tailwind CSS
- [Supabase](https://supabase.com) (Postgres, Auth, RLS, fonctions métier) comme backend
- Composants UI maison dans le style shadcn/ui, sur des primitives Radix UI

## Démarrer en local

```bash
npm install
cp .env.example .env.local   # renseigner l'URL et la clé anon de votre projet Supabase
npm run dev
```

## Fonctionnalités

- **Côté client** : recherche d'un artisan par métier/ville, fiche publique avec prestations,
  équipe et avis, réservation en ligne en 3 étapes, gestion du rendez-vous sans compte via un
  lien à token (annulation, report, avis).
- **Côté artisan** : inscription avec création d'entreprise, tableau de bord (vue du jour,
  agenda, validation des demandes), gestion des prestations, de l'équipe et des horaires,
  fiche client, avis reçus, réglages métier (délai minimum, zone d'intervention, validation
  manuelle, rappels SMS/e-mail).

Le modèle de données (entreprises multi-tenant, créneaux, rendez-vous, abonnements) et les
fonctions métier (moteur de disponibilité, réservation, rappels) vivent côté Supabase.
