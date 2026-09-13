import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

/**
 * Client Supabase avec la clé service_role : accès complet, RLS ignorée.
 * Strictement réservé aux Server Actions / Route Handlers (jamais importé
 * côté client). Utilisé pour l'API d'administration des utilisateurs
 * (invitation de membres d'équipe).
 */
export function createAdminClient() {
  const cle = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!cle) return null;
  return createSupabaseClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, cle, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
