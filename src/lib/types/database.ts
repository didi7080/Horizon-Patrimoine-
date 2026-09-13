export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      abonnements: {
        Row: {
          entreprise_id: string
          essai_fin: string
          periode_fin: string | null
          statut: Database["public"]["Enums"]["statut_abonnement"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
        }
        Insert: {
          entreprise_id: string
          essai_fin?: string
          periode_fin?: string | null
          statut?: Database["public"]["Enums"]["statut_abonnement"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          entreprise_id?: string
          essai_fin?: string
          periode_fin?: string | null
          statut?: Database["public"]["Enums"]["statut_abonnement"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "abonnements_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: true
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
        ]
      }
      absences: {
        Row: {
          debut: string
          fin: string
          id: string
          motif: string | null
          salarie_id: string
        }
        Insert: {
          debut: string
          fin: string
          id?: string
          motif?: string | null
          salarie_id: string
        }
        Update: {
          debut?: string
          fin?: string
          id?: string
          motif?: string | null
          salarie_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "absences_salarie_id_fkey"
            columns: ["salarie_id"]
            isOneToOne: false
            referencedRelation: "salaries"
            referencedColumns: ["id"]
          },
        ]
      }
      avis: {
        Row: {
          auteur_nom: string | null
          commentaire: string | null
          created_at: string
          entreprise_id: string
          id: string
          note: number
          publie: boolean
          rdv_id: string | null
          salarie_id: string | null
        }
        Insert: {
          auteur_nom?: string | null
          commentaire?: string | null
          created_at?: string
          entreprise_id: string
          id?: string
          note: number
          publie?: boolean
          rdv_id?: string | null
          salarie_id?: string | null
        }
        Update: {
          auteur_nom?: string | null
          commentaire?: string | null
          created_at?: string
          entreprise_id?: string
          id?: string
          note?: number
          publie?: boolean
          rdv_id?: string | null
          salarie_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "avis_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avis_rdv_id_fkey"
            columns: ["rdv_id"]
            isOneToOne: true
            referencedRelation: "rendez_vous"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avis_salarie_id_fkey"
            columns: ["salarie_id"]
            isOneToOne: false
            referencedRelation: "salaries"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          adresse: string | null
          created_at: string
          email: string | null
          entreprise_id: string
          id: string
          nom: string
          notes: string | null
          profile_id: string | null
          telephone: string | null
        }
        Insert: {
          adresse?: string | null
          created_at?: string
          email?: string | null
          entreprise_id: string
          id?: string
          nom: string
          notes?: string | null
          profile_id?: string | null
          telephone?: string | null
        }
        Update: {
          adresse?: string | null
          created_at?: string
          email?: string | null
          entreprise_id?: string
          id?: string
          nom?: string
          notes?: string | null
          profile_id?: string | null
          telephone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      entreprises: {
        Row: {
          adresse: string | null
          avis_actif: boolean
          battement_min: number
          code_postal: string | null
          couleur: string
          created_at: string
          created_by: string | null
          delai_min_heures: number
          description: string | null
          email: string | null
          fenetre_max_jours: number
          id: string
          logo_url: string | null
          metier: string | null
          nb_salaries: number
          nom: string
          recap_actif: boolean
          slug: string
          sms_actif: boolean
          telephone: string | null
          validation_manuelle: boolean
          ville: string | null
          zone_codes: string[]
        }
        Insert: {
          adresse?: string | null
          avis_actif?: boolean
          battement_min?: number
          code_postal?: string | null
          couleur?: string
          created_at?: string
          created_by?: string | null
          delai_min_heures?: number
          description?: string | null
          email?: string | null
          fenetre_max_jours?: number
          id?: string
          logo_url?: string | null
          metier?: string | null
          nb_salaries?: number
          nom: string
          recap_actif?: boolean
          slug: string
          sms_actif?: boolean
          telephone?: string | null
          validation_manuelle?: boolean
          ville?: string | null
          zone_codes?: string[]
        }
        Update: {
          adresse?: string | null
          avis_actif?: boolean
          battement_min?: number
          code_postal?: string | null
          couleur?: string
          created_at?: string
          created_by?: string | null
          delai_min_heures?: number
          description?: string | null
          email?: string | null
          fenetre_max_jours?: number
          id?: string
          logo_url?: string | null
          metier?: string | null
          nb_salaries?: number
          nom?: string
          recap_actif?: boolean
          slug?: string
          sms_actif?: boolean
          telephone?: string | null
          validation_manuelle?: boolean
          ville?: string | null
          zone_codes?: string[]
        }
        Relationships: []
      }
      horaires: {
        Row: {
          debut: string
          fin: string
          id: string
          jour: number
          salarie_id: string
        }
        Insert: {
          debut: string
          fin: string
          id?: string
          jour: number
          salarie_id: string
        }
        Update: {
          debut?: string
          fin?: string
          id?: string
          jour?: number
          salarie_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "horaires_salarie_id_fkey"
            columns: ["salarie_id"]
            isOneToOne: false
            referencedRelation: "salaries"
            referencedColumns: ["id"]
          },
        ]
      }
      liste_attente: {
        Row: {
          client_email: string | null
          client_nom: string
          client_tel: string | null
          cree_le: string
          entreprise_id: string
          id: string
          notifie_le: string | null
          prestation_id: string | null
          salarie_id: string | null
        }
        Insert: {
          client_email?: string | null
          client_nom: string
          client_tel?: string | null
          cree_le?: string
          entreprise_id: string
          id?: string
          notifie_le?: string | null
          prestation_id?: string | null
          salarie_id?: string | null
        }
        Update: {
          client_email?: string | null
          client_nom?: string
          client_tel?: string | null
          cree_le?: string
          entreprise_id?: string
          id?: string
          notifie_le?: string | null
          prestation_id?: string | null
          salarie_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "liste_attente_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "liste_attente_prestation_id_fkey"
            columns: ["prestation_id"]
            isOneToOne: false
            referencedRelation: "prestations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "liste_attente_salarie_id_fkey"
            columns: ["salarie_id"]
            isOneToOne: false
            referencedRelation: "salaries"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string
          entreprise_id: string
          id: string
          profile_id: string
          role: Database["public"]["Enums"]["role_membre"]
        }
        Insert: {
          created_at?: string
          entreprise_id: string
          id?: string
          profile_id: string
          role?: Database["public"]["Enums"]["role_membre"]
        }
        Update: {
          created_at?: string
          entreprise_id?: string
          id?: string
          profile_id?: string
          role?: Database["public"]["Enums"]["role_membre"]
        }
        Relationships: [
          {
            foreignKeyName: "memberships_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prestation_salaries: {
        Row: {
          prestation_id: string
          salarie_id: string
        }
        Insert: {
          prestation_id: string
          salarie_id: string
        }
        Update: {
          prestation_id?: string
          salarie_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prestation_salaries_prestation_id_fkey"
            columns: ["prestation_id"]
            isOneToOne: false
            referencedRelation: "prestations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prestation_salaries_salarie_id_fkey"
            columns: ["salarie_id"]
            isOneToOne: false
            referencedRelation: "salaries"
            referencedColumns: ["id"]
          },
        ]
      }
      prestations: {
        Row: {
          acompte_cents: number | null
          actif: boolean
          champs_perso: string[]
          created_at: string
          description: string | null
          duree_min: number
          entreprise_id: string
          id: string
          nom: string
          prix_cents: number | null
          relance_jours: number | null
        }
        Insert: {
          acompte_cents?: number | null
          actif?: boolean
          champs_perso?: string[]
          created_at?: string
          description?: string | null
          duree_min?: number
          entreprise_id: string
          id?: string
          nom: string
          prix_cents?: number | null
          relance_jours?: number | null
        }
        Update: {
          acompte_cents?: number | null
          actif?: boolean
          champs_perso?: string[]
          created_at?: string
          description?: string | null
          duree_min?: number
          entreprise_id?: string
          id?: string
          nom?: string
          prix_cents?: number | null
          relance_jours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "prestations_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
        }
        Relationships: []
      }
      rendez_vous: {
        Row: {
          acompte_paye: boolean
          adresse_client: string | null
          avis_demande: boolean
          champs_perso: Json
          client_id: string | null
          code_postal_client: string | null
          created_at: string
          cree_par: string | null
          debut: string
          entreprise_id: string
          fin: string
          id: string
          notes: string | null
          prestation_id: string | null
          rappel_envoye: boolean
          relance_envoyee: boolean
          salarie_id: string
          statut: Database["public"]["Enums"]["statut_rdv"]
          token: string
        }
        Insert: {
          acompte_paye?: boolean
          adresse_client?: string | null
          avis_demande?: boolean
          champs_perso?: Json
          client_id?: string | null
          code_postal_client?: string | null
          created_at?: string
          cree_par?: string | null
          debut: string
          entreprise_id: string
          fin: string
          id?: string
          notes?: string | null
          prestation_id?: string | null
          rappel_envoye?: boolean
          relance_envoyee?: boolean
          salarie_id: string
          statut?: Database["public"]["Enums"]["statut_rdv"]
          token?: string
        }
        Update: {
          acompte_paye?: boolean
          adresse_client?: string | null
          avis_demande?: boolean
          champs_perso?: Json
          client_id?: string | null
          code_postal_client?: string | null
          created_at?: string
          cree_par?: string | null
          debut?: string
          entreprise_id?: string
          fin?: string
          id?: string
          notes?: string | null
          prestation_id?: string | null
          rappel_envoye?: boolean
          relance_envoyee?: boolean
          salarie_id?: string
          statut?: Database["public"]["Enums"]["statut_rdv"]
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "rendez_vous_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rendez_vous_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rendez_vous_prestation_id_fkey"
            columns: ["prestation_id"]
            isOneToOne: false
            referencedRelation: "prestations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rendez_vous_salarie_id_fkey"
            columns: ["salarie_id"]
            isOneToOne: false
            referencedRelation: "salaries"
            referencedColumns: ["id"]
          },
        ]
      }
      salaries: {
        Row: {
          actif: boolean
          couleur: string
          created_at: string
          entreprise_id: string
          fonction: string | null
          ical_token: string
          id: string
          nom: string
          profile_id: string | null
        }
        Insert: {
          actif?: boolean
          couleur?: string
          created_at?: string
          entreprise_id: string
          fonction?: string | null
          ical_token?: string
          id?: string
          nom: string
          profile_id?: string | null
        }
        Update: {
          actif?: boolean
          couleur?: string
          created_at?: string
          entreprise_id?: string
          fonction?: string | null
          ical_token?: string
          id?: string
          nom?: string
          profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "salaries_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salaries_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      annuler_rdv_public: { Args: { p_token: string }; Returns: undefined }
      avis_entreprise: { Args: { p_slug: string }; Returns: Json }
      creer_entreprise: {
        Args: {
          p_adresse: string
          p_code_postal: string
          p_metier: string
          p_nb_salaries?: number
          p_nom: string
          p_slug: string
          p_telephone: string
          p_ville: string
        }
        Returns: {
          adresse: string | null
          avis_actif: boolean
          battement_min: number
          code_postal: string | null
          couleur: string
          created_at: string
          created_by: string | null
          delai_min_heures: number
          description: string | null
          email: string | null
          fenetre_max_jours: number
          id: string
          logo_url: string | null
          metier: string | null
          nb_salaries: number
          nom: string
          recap_actif: boolean
          slug: string
          sms_actif: boolean
          telephone: string | null
          validation_manuelle: boolean
          ville: string | null
          zone_codes: string[]
        }
      }
      creneaux_disponibles: {
        Args: {
          p_from: string
          p_prestation: string
          p_salarie: string
          p_to: string
        }
        Returns: {
          debut: string
          fin: string
          salarie_id: string
          salarie_nom: string
        }[]
      }
      entreprise_active: { Args: { e: string }; Returns: boolean }
      envoyer_rappels: { Args: never; Returns: undefined }
      envoyer_recap_quotidien: { Args: never; Returns: undefined }
      envoyer_relances: { Args: never; Returns: undefined }
      ical_salarie: {
        Args: { p_token: string }
        Returns: {
          debut: string
          description: string
          fin: string
          lieu: string
          titre: string
          uid: string
        }[]
      }
      is_admin: { Args: { e: string }; Returns: boolean }
      is_member: { Args: { e: string }; Returns: boolean }
      laisser_avis: {
        Args: { p_commentaire: string; p_note: number; p_token: string }
        Returns: undefined
      }
      marquer_acompte_paye: {
        Args: { p_secret: string; p_token: string }
        Returns: undefined
      }
      rdv_par_token: { Args: { p_token: string }; Returns: Json }
      rejoindre_liste_attente: {
        Args: {
          p_email: string
          p_entreprise: string
          p_nom: string
          p_prestation: string
          p_salarie: string
          p_tel: string
        }
        Returns: undefined
      }
      reporter_rdv_public: {
        Args: { p_nouveau_debut: string; p_token: string }
        Returns: undefined
      }
      reserver_rdv: {
        Args: {
          p_adresse?: string
          p_champs?: Json
          p_code_postal?: string
          p_debut: string
          p_email: string
          p_entreprise: string
          p_nom: string
          p_notes: string
          p_prestation: string
          p_salarie: string
          p_tel: string
        }
        Returns: string
      }
      sync_abonnement: {
        Args: {
          p_customer?: string
          p_entreprise: string
          p_periode_fin?: string
          p_secret: string
          p_statut: string
          p_subscription?: string
        }
        Returns: undefined
      }
      valider_demande_rdv: {
        Args: { p_accepter: boolean; p_rdv: string }
        Returns: undefined
      }
    }
    Enums: {
      role_membre: "owner" | "admin" | "salarie"
      statut_abonnement: "essai" | "actif" | "impaye" | "annule"
      statut_rdv: "confirme" | "annule" | "honore" | "absent" | "demande"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database["public"]

export type Tables<
  DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]),
> = (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
  Row: infer R
}
  ? R
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"],
> = DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
  Insert: infer I
}
  ? I
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"],
> = DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
  Update: infer U
}
  ? U
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"],
> = DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]

export const Constants = {
  public: {
    Enums: {
      role_membre: ["owner", "admin", "salarie"],
      statut_abonnement: ["essai", "actif", "impaye", "annule"],
      statut_rdv: ["confirme", "annule", "honore", "absent", "demande"],
    },
  },
} as const
