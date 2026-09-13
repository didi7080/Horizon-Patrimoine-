import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

/**
 * Client Supabase sans contexte de session (pas de cookies) : pour les
 * webhooks et tâches serveur qui appellent des fonctions sécurisées par un
 * secret (ex. sync_abonnement), pas par l'authentification d'un utilisateur.
 */
export function createAnonClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
