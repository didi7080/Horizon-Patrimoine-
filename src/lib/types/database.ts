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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      abonnements: {
        Row: {
          entreprise_id: string
          essai_fin: string
          periode_fin: string | null
          plan: string | null
          statut: Database["public"]["Enums"]["statut_abonnement"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
        }
        Insert: {
          entreprise_id: string
          essai_fin?: string
          periode_fin?: string | null
          plan?: string | null
          statut?: Database["public"]["Enums"]["statut_abonnement"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          entreprise_id?: string
          essai_fin?: string
          periode_fin?: string | null
          plan?: string | null
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
      alertes_recherche: {
        Row: {
          created_at: string
          email: string
          id: string
          metier: string
          notifie_le: string | null
          ville: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metier: string
          notifie_le?: string | null
          ville?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metier?: string
          notifie_le?: string | null
          ville?: string | null
        }
        Relationships: []
      }
      assistant_appels: {
        Row: {
          compteur: number
          entreprise_id: string
          fenetre_debut: string
        }
        Insert: {
          compteur?: number
          entreprise_id: string
          fenetre_debut?: string
        }
        Update: {
          compteur?: number
          entreprise_id?: string
          fenetre_debut?: string
        }
        Relationships: [
          {
            foreignKeyName: "assistant_appels_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: true
            referencedRelation: "entreprises"
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
          reponse_artisan: string | null
          reponse_le: string | null
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
          reponse_artisan?: string | null
          reponse_le?: string | null
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
          reponse_artisan?: string | null
          reponse_le?: string | null
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
      chantiers: {
        Row: {
          adresse: string | null
          client_id: string
          created_at: string
          created_by: string | null
          date_debut_prevue: string | null
          date_fin_prevue: string | null
          entreprise_id: string
          id: string
          notes: string | null
          statut: Database["public"]["Enums"]["statut_chantier"]
          titre: string
        }
        Insert: {
          adresse?: string | null
          client_id: string
          created_at?: string
          created_by?: string | null
          date_debut_prevue?: string | null
          date_fin_prevue?: string | null
          entreprise_id: string
          id?: string
          notes?: string | null
          statut?: Database["public"]["Enums"]["statut_chantier"]
          titre: string
        }
        Update: {
          adresse?: string | null
          client_id?: string
          created_at?: string
          created_by?: string | null
          date_debut_prevue?: string | null
          date_fin_prevue?: string | null
          entreprise_id?: string
          id?: string
          notes?: string | null
          statut?: Database["public"]["Enums"]["statut_chantier"]
          titre?: string
        }
        Relationships: [
          {
            foreignKeyName: "chantiers_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chantiers_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          adresse: string | null
          created_at: string
          desabonne_communications: boolean
          email: string | null
          entreprise_id: string
          id: string
          nom: string
          notes: string | null
          profile_id: string | null
          telephone: string | null
          token: string
        }
        Insert: {
          adresse?: string | null
          created_at?: string
          desabonne_communications?: boolean
          email?: string | null
          entreprise_id: string
          id?: string
          nom: string
          notes?: string | null
          profile_id?: string | null
          telephone?: string | null
          token?: string
        }
        Update: {
          adresse?: string | null
          created_at?: string
          desabonne_communications?: boolean
          email?: string | null
          entreprise_id?: string
          id?: string
          nom?: string
          notes?: string | null
          profile_id?: string | null
          telephone?: string | null
          token?: string
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
      compteurs_documents: {
        Row: {
          annee: number
          dernier_numero: number
          entreprise_id: string
          type: string
        }
        Insert: {
          annee: number
          dernier_numero?: number
          entreprise_id: string
          type: string
        }
        Update: {
          annee?: number
          dernier_numero?: number
          entreprise_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "compteurs_documents_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
        ]
      }
      depenses: {
        Row: {
          categorie: string
          created_at: string
          created_by: string | null
          date: string
          description: string | null
          entreprise_id: string
          id: string
          justificatif_path: string | null
          montant_cents: number
          statut: Database["public"]["Enums"]["statut_depense"]
        }
        Insert: {
          categorie: string
          created_at?: string
          created_by?: string | null
          date?: string
          description?: string | null
          entreprise_id: string
          id?: string
          justificatif_path?: string | null
          montant_cents: number
          statut?: Database["public"]["Enums"]["statut_depense"]
        }
        Update: {
          categorie?: string
          created_at?: string
          created_by?: string | null
          date?: string
          description?: string | null
          entreprise_id?: string
          id?: string
          justificatif_path?: string | null
          montant_cents?: number
          statut?: Database["public"]["Enums"]["statut_depense"]
        }
        Relationships: [
          {
            foreignKeyName: "depenses_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          chantier_id: string | null
          client_adresse: string | null
          client_email: string | null
          client_id: string | null
          client_nom: string
          client_telephone: string | null
          created_at: string
          created_by: string | null
          date_echeance: string | null
          date_emission: string
          date_prestation: string | null
          date_validite: string | null
          devis_origine_id: string | null
          entreprise_id: string
          id: string
          lignes: Json
          notes: string | null
          numero: string
          relance_envoyee: boolean
          statut: string
          token: string
          type: string
          updated_at: string
        }
        Insert: {
          chantier_id?: string | null
          client_adresse?: string | null
          client_email?: string | null
          client_id?: string | null
          client_nom: string
          client_telephone?: string | null
          created_at?: string
          created_by?: string | null
          date_echeance?: string | null
          date_emission?: string
          date_prestation?: string | null
          date_validite?: string | null
          devis_origine_id?: string | null
          entreprise_id: string
          id?: string
          lignes?: Json
          notes?: string | null
          numero: string
          relance_envoyee?: boolean
          statut?: string
          token?: string
          type: string
          updated_at?: string
        }
        Update: {
          chantier_id?: string | null
          client_adresse?: string | null
          client_email?: string | null
          client_id?: string | null
          client_nom?: string
          client_telephone?: string | null
          created_at?: string
          created_by?: string | null
          date_echeance?: string | null
          date_emission?: string
          date_prestation?: string | null
          date_validite?: string | null
          devis_origine_id?: string | null
          entreprise_id?: string
          id?: string
          lignes?: Json
          notes?: string | null
          numero?: string
          relance_envoyee?: boolean
          statut?: string
          token?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_chantier_id_fkey"
            columns: ["chantier_id"]
            isOneToOne: false
            referencedRelation: "chantiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_devis_origine_id_fkey"
            columns: ["devis_origine_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
        ]
      }
      entreprises: {
        Row: {
          adresse: string | null
          assujetti_tva: boolean
          assurance_nom: string | null
          assurance_zone: string | null
          avis_actif: boolean
          battement_min: number
          code_postal: string | null
          couleur: string
          created_at: string
          created_by: string | null
          delai_min_heures: number
          description: string | null
          domaine_personnalise: string | null
          email: string | null
          email_bienvenue_envoye: boolean
          fenetre_max_jours: number
          forme_juridique: string | null
          id: string
          logo_url: string | null
          mentions_legales: string | null
          metier: string | null
          nb_salaries: number
          nom: string
          numero_tva: string | null
          parrainage_recompense_le: string | null
          parraine_par_id: string | null
          recap_actif: boolean
          recap_avis_actif: boolean
          recap_depenses_actif: boolean
          recap_devis_actif: boolean
          recap_factures_actif: boolean
          recap_rdv_actif: boolean
          recap_stock_actif: boolean
          siret: string | null
          slug: string
          sms_actif: boolean
          stripe_connect_account_id: string | null
          telephone: string | null
          validation_manuelle: boolean
          ville: string | null
          zone_codes: string[]
        }
        Insert: {
          adresse?: string | null
          assujetti_tva?: boolean
          assurance_nom?: string | null
          assurance_zone?: string | null
          avis_actif?: boolean
          battement_min?: number
          code_postal?: string | null
          couleur?: string
          created_at?: string
          created_by?: string | null
          delai_min_heures?: number
          description?: string | null
          domaine_personnalise?: string | null
          email?: string | null
          email_bienvenue_envoye?: boolean
          fenetre_max_jours?: number
          forme_juridique?: string | null
          id?: string
          logo_url?: string | null
          mentions_legales?: string | null
          metier?: string | null
          nb_salaries?: number
          nom: string
          numero_tva?: string | null
          parrainage_recompense_le?: string | null
          parraine_par_id?: string | null
          recap_actif?: boolean
          recap_avis_actif?: boolean
          recap_depenses_actif?: boolean
          recap_devis_actif?: boolean
          recap_factures_actif?: boolean
          recap_rdv_actif?: boolean
          recap_stock_actif?: boolean
          siret?: string | null
          slug: string
          sms_actif?: boolean
          stripe_connect_account_id?: string | null
          telephone?: string | null
          validation_manuelle?: boolean
          ville?: string | null
          zone_codes?: string[]
        }
        Update: {
          adresse?: string | null
          assujetti_tva?: boolean
          assurance_nom?: string | null
          assurance_zone?: string | null
          avis_actif?: boolean
          battement_min?: number
          code_postal?: string | null
          couleur?: string
          created_at?: string
          created_by?: string | null
          delai_min_heures?: number
          description?: string | null
          domaine_personnalise?: string | null
          email?: string | null
          email_bienvenue_envoye?: boolean
          fenetre_max_jours?: number
          forme_juridique?: string | null
          id?: string
          logo_url?: string | null
          mentions_legales?: string | null
          metier?: string | null
          nb_salaries?: number
          nom?: string
          numero_tva?: string | null
          parrainage_recompense_le?: string | null
          parraine_par_id?: string | null
          recap_actif?: boolean
          recap_avis_actif?: boolean
          recap_depenses_actif?: boolean
          recap_devis_actif?: boolean
          recap_factures_actif?: boolean
          recap_rdv_actif?: boolean
          recap_stock_actif?: boolean
          siret?: string | null
          slug?: string
          sms_actif?: boolean
          stripe_connect_account_id?: string | null
          telephone?: string | null
          validation_manuelle?: boolean
          ville?: string | null
          zone_codes?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "entreprises_parraine_par_id_fkey"
            columns: ["parraine_par_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
        ]
      }
      etapes_chantier: {
        Row: {
          chantier_id: string
          created_at: string
          fait: boolean
          fait_le: string | null
          fait_par: string | null
          id: string
          ordre: number
          titre: string
        }
        Insert: {
          chantier_id: string
          created_at?: string
          fait?: boolean
          fait_le?: string | null
          fait_par?: string | null
          id?: string
          ordre?: number
          titre: string
        }
        Update: {
          chantier_id?: string
          created_at?: string
          fait?: boolean
          fait_le?: string | null
          fait_par?: string | null
          id?: string
          ordre?: number
          titre?: string
        }
        Relationships: [
          {
            foreignKeyName: "etapes_chantier_chantier_id_fkey"
            columns: ["chantier_id"]
            isOneToOne: false
            referencedRelation: "chantiers"
            referencedColumns: ["id"]
          },
        ]
      }
      etudes: {
        Row: {
          client_adresse: string | null
          client_email: string | null
          client_id: string | null
          client_nom: string | null
          client_telephone: string | null
          created_at: string
          created_by: string | null
          donnees: Json
          entreprise_id: string
          id: string
          metier: string
          module_id: string | null
          statut: string
          titre: string
          updated_at: string
        }
        Insert: {
          client_adresse?: string | null
          client_email?: string | null
          client_id?: string | null
          client_nom?: string | null
          client_telephone?: string | null
          created_at?: string
          created_by?: string | null
          donnees?: Json
          entreprise_id: string
          id?: string
          metier: string
          module_id?: string | null
          statut?: string
          titre: string
          updated_at?: string
        }
        Update: {
          client_adresse?: string | null
          client_email?: string | null
          client_id?: string | null
          client_nom?: string | null
          client_telephone?: string | null
          created_at?: string
          created_by?: string | null
          donnees?: Json
          entreprise_id?: string
          id?: string
          metier?: string
          module_id?: string | null
          statut?: string
          titre?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "etudes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "etudes_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "etudes_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules_calcul"
            referencedColumns: ["id"]
          },
        ]
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
      lignes_bibliotheque: {
        Row: {
          created_at: string
          designation: string
          entreprise_id: string
          id: string
          prix_unitaire_cents: number
          taux_tva: number
          unite: string
        }
        Insert: {
          created_at?: string
          designation: string
          entreprise_id: string
          id?: string
          prix_unitaire_cents?: number
          taux_tva?: number
          unite?: string
        }
        Update: {
          created_at?: string
          designation?: string
          entreprise_id?: string
          id?: string
          prix_unitaire_cents?: number
          taux_tva?: number
          unite?: string
        }
        Relationships: [
          {
            foreignKeyName: "lignes_bibliotheque_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
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
      materiel_catalogue: {
        Row: {
          actif: boolean
          coefficient: number
          created_at: string
          designation: string
          entreprise_id: string
          famille: string | null
          id: string
          prix_achat_cents: number | null
          reference: string | null
          unite: string
        }
        Insert: {
          actif?: boolean
          coefficient?: number
          created_at?: string
          designation: string
          entreprise_id: string
          famille?: string | null
          id?: string
          prix_achat_cents?: number | null
          reference?: string | null
          unite?: string
        }
        Update: {
          actif?: boolean
          coefficient?: number
          created_at?: string
          designation?: string
          entreprise_id?: string
          famille?: string | null
          id?: string
          prix_achat_cents?: number | null
          reference?: string | null
          unite?: string
        }
        Relationships: [
          {
            foreignKeyName: "materiel_catalogue_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
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
      modules_calcul: {
        Row: {
          champs: Json
          created_at: string
          entreprise_id: string
          formules: Json
          id: string
          metier: string
          nom: string
          ordre: number
          updated_at: string
        }
        Insert: {
          champs?: Json
          created_at?: string
          entreprise_id: string
          formules?: Json
          id?: string
          metier: string
          nom: string
          ordre?: number
          updated_at?: string
        }
        Update: {
          champs?: Json
          created_at?: string
          entreprise_id?: string
          formules?: Json
          id?: string
          metier?: string
          nom?: string
          ordre?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "modules_calcul_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
        ]
      }
      mouvements_stock: {
        Row: {
          created_at: string
          created_by: string | null
          entreprise_id: string
          id: string
          materiel_id: string
          quantite: number
          salarie_id: string | null
          type: Database["public"]["Enums"]["type_mouvement_stock"]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          entreprise_id: string
          id?: string
          materiel_id: string
          quantite: number
          salarie_id?: string | null
          type: Database["public"]["Enums"]["type_mouvement_stock"]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          entreprise_id?: string
          id?: string
          materiel_id?: string
          quantite?: number
          salarie_id?: string | null
          type?: Database["public"]["Enums"]["type_mouvement_stock"]
        }
        Relationships: [
          {
            foreignKeyName: "mouvements_stock_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mouvements_stock_materiel_id_fkey"
            columns: ["materiel_id"]
            isOneToOne: false
            referencedRelation: "materiel_catalogue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mouvements_stock_salarie_id_fkey"
            columns: ["salarie_id"]
            isOneToOne: false
            referencedRelation: "salaries"
            referencedColumns: ["id"]
          },
        ]
      }
      photos_intervention: {
        Row: {
          chemin_stockage: string
          created_at: string
          created_by: string | null
          entreprise_id: string
          id: string
          rendez_vous_id: string
          type: string
        }
        Insert: {
          chemin_stockage: string
          created_at?: string
          created_by?: string | null
          entreprise_id: string
          id?: string
          rendez_vous_id: string
          type?: string
        }
        Update: {
          chemin_stockage?: string
          created_at?: string
          created_by?: string | null
          entreprise_id?: string
          id?: string
          rendez_vous_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "photos_intervention_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photos_intervention_rendez_vous_id_fkey"
            columns: ["rendez_vous_id"]
            isOneToOne: false
            referencedRelation: "rendez_vous"
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
          urgence_active: boolean
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
          urgence_active?: boolean
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
          urgence_active?: boolean
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
      push_subscriptions: {
        Row: {
          cle_auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          profile_id: string
        }
        Insert: {
          cle_auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          profile_id: string
        }
        Update: {
          cle_auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rappels_planifies: {
        Row: {
          client_id: string | null
          created_at: string
          created_by: string | null
          date_prevue: string
          destinataire: string
          entreprise_id: string
          id: string
          message: string | null
          rendez_vous_id: string | null
          statut: string
          titre: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          date_prevue: string
          destinataire?: string
          entreprise_id: string
          id?: string
          message?: string | null
          rendez_vous_id?: string | null
          statut?: string
          titre: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          date_prevue?: string
          destinataire?: string
          entreprise_id?: string
          id?: string
          message?: string | null
          rendez_vous_id?: string | null
          statut?: string
          titre?: string
        }
        Relationships: [
          {
            foreignKeyName: "rappels_planifies_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rappels_planifies_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rappels_planifies_rendez_vous_id_fkey"
            columns: ["rendez_vous_id"]
            isOneToOne: false
            referencedRelation: "rendez_vous"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          cle: string
          cree_le: string
          id: number
        }
        Insert: {
          cle: string
          cree_le?: string
          id?: never
        }
        Update: {
          cle?: string
          cree_le?: string
          id?: never
        }
        Relationships: []
      }
      rendez_vous: {
        Row: {
          acompte_paye: boolean
          adresse_client: string | null
          avis_demande: boolean
          champs_perso: Json
          chantier_id: string | null
          client_id: string | null
          code_postal_client: string | null
          created_at: string
          cree_par: string | null
          debut: string
          entreprise_id: string
          fin: string
          google_event_id: string | null
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
          chantier_id?: string | null
          client_id?: string | null
          code_postal_client?: string | null
          created_at?: string
          cree_par?: string | null
          debut: string
          entreprise_id: string
          fin: string
          google_event_id?: string | null
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
          chantier_id?: string | null
          client_id?: string | null
          code_postal_client?: string | null
          created_at?: string
          cree_par?: string | null
          debut?: string
          entreprise_id?: string
          fin?: string
          google_event_id?: string | null
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
            foreignKeyName: "rendez_vous_chantier_id_fkey"
            columns: ["chantier_id"]
            isOneToOne: false
            referencedRelation: "chantiers"
            referencedColumns: ["id"]
          },
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
      rendez_vous_participants: {
        Row: {
          created_at: string
          google_event_id: string | null
          rendez_vous_id: string
          salarie_id: string
        }
        Insert: {
          created_at?: string
          google_event_id?: string | null
          rendez_vous_id: string
          salarie_id: string
        }
        Update: {
          created_at?: string
          google_event_id?: string | null
          rendez_vous_id?: string
          salarie_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rendez_vous_participants_rendez_vous_id_fkey"
            columns: ["rendez_vous_id"]
            isOneToOne: false
            referencedRelation: "rendez_vous"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rendez_vous_participants_salarie_id_fkey"
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
          google_email: string | null
          google_refresh_token: string | null
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
          google_email?: string | null
          google_refresh_token?: string | null
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
          google_email?: string | null
          google_refresh_token?: string | null
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
      stocks: {
        Row: {
          entreprise_id: string
          id: string
          materiel_id: string
          quantite: number
          salarie_id: string | null
          updated_at: string
        }
        Insert: {
          entreprise_id: string
          id?: string
          materiel_id: string
          quantite?: number
          salarie_id?: string | null
          updated_at?: string
        }
        Update: {
          entreprise_id?: string
          id?: string
          materiel_id?: string
          quantite?: number
          salarie_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stocks_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stocks_materiel_id_fkey"
            columns: ["materiel_id"]
            isOneToOne: false
            referencedRelation: "materiel_catalogue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stocks_salarie_id_fkey"
            columns: ["salarie_id"]
            isOneToOne: false
            referencedRelation: "salaries"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      ajuster_stock_depot: {
        Args: { p_materiel: string; p_quantite: number }
        Returns: undefined
      }
      annuler_rdv_public: { Args: { p_token: string }; Returns: undefined }
      avis_entreprise: { Args: { p_slug: string }; Returns: Json }
      creer_entreprise:
        | {
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
              assujetti_tva: boolean
              assurance_nom: string | null
              assurance_zone: string | null
              avis_actif: boolean
              battement_min: number
              code_postal: string | null
              couleur: string
              created_at: string
              created_by: string | null
              delai_min_heures: number
              description: string | null
              domaine_personnalise: string | null
              email: string | null
              email_bienvenue_envoye: boolean
              fenetre_max_jours: number
              forme_juridique: string | null
              id: string
              logo_url: string | null
              mentions_legales: string | null
              metier: string | null
              nb_salaries: number
              nom: string
              numero_tva: string | null
              parrainage_recompense_le: string | null
              parraine_par_id: string | null
              recap_actif: boolean
              recap_avis_actif: boolean
              recap_depenses_actif: boolean
              recap_devis_actif: boolean
              recap_factures_actif: boolean
              recap_rdv_actif: boolean
              recap_stock_actif: boolean
              siret: string | null
              slug: string
              sms_actif: boolean
              stripe_connect_account_id: string | null
              telephone: string | null
              validation_manuelle: boolean
              ville: string | null
              zone_codes: string[]
            }
            SetofOptions: {
              from: "*"
              to: "entreprises"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: {
              p_adresse: string
              p_code_postal: string
              p_metier: string
              p_nb_salaries?: number
              p_nom: string
              p_parraine_par_id?: string
              p_slug: string
              p_telephone: string
              p_ville: string
            }
            Returns: {
              adresse: string | null
              assujetti_tva: boolean
              assurance_nom: string | null
              assurance_zone: string | null
              avis_actif: boolean
              battement_min: number
              code_postal: string | null
              couleur: string
              created_at: string
              created_by: string | null
              delai_min_heures: number
              description: string | null
              domaine_personnalise: string | null
              email: string | null
              email_bienvenue_envoye: boolean
              fenetre_max_jours: number
              forme_juridique: string | null
              id: string
              logo_url: string | null
              mentions_legales: string | null
              metier: string | null
              nb_salaries: number
              nom: string
              numero_tva: string | null
              parrainage_recompense_le: string | null
              parraine_par_id: string | null
              recap_actif: boolean
              recap_avis_actif: boolean
              recap_depenses_actif: boolean
              recap_devis_actif: boolean
              recap_factures_actif: boolean
              recap_rdv_actif: boolean
              recap_stock_actif: boolean
              siret: string | null
              slug: string
              sms_actif: boolean
              stripe_connect_account_id: string | null
              telephone: string | null
              validation_manuelle: boolean
              ville: string | null
              zone_codes: string[]
            }
            SetofOptions: {
              from: "*"
              to: "entreprises"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      creer_entreprise_avec_parrainage: {
        Args: {
          p_adresse: string
          p_code_postal: string
          p_metier: string
          p_nb_salaries?: number
          p_nom: string
          p_parraine_par_id?: string
          p_slug: string
          p_telephone: string
          p_ville: string
        }
        Returns: {
          adresse: string | null
          assujetti_tva: boolean
          assurance_nom: string | null
          assurance_zone: string | null
          avis_actif: boolean
          battement_min: number
          code_postal: string | null
          couleur: string
          created_at: string
          created_by: string | null
          delai_min_heures: number
          description: string | null
          domaine_personnalise: string | null
          email: string | null
          email_bienvenue_envoye: boolean
          fenetre_max_jours: number
          forme_juridique: string | null
          id: string
          logo_url: string | null
          mentions_legales: string | null
          metier: string | null
          nb_salaries: number
          nom: string
          numero_tva: string | null
          parrainage_recompense_le: string | null
          parraine_par_id: string | null
          recap_actif: boolean
          recap_avis_actif: boolean
          recap_depenses_actif: boolean
          recap_devis_actif: boolean
          recap_factures_actif: boolean
          recap_rdv_actif: boolean
          recap_stock_actif: boolean
          siret: string | null
          slug: string
          sms_actif: boolean
          stripe_connect_account_id: string | null
          telephone: string | null
          validation_manuelle: boolean
          ville: string | null
          zone_codes: string[]
        }
        SetofOptions: {
          from: "*"
          to: "entreprises"
          isOneToOne: true
          isSetofReturn: false
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
      desabonner_client_public: { Args: { p_token: string }; Returns: Json }
      devis_par_token: { Args: { p_token: string }; Returns: Json }
      entreprise_active: { Args: { e: string }; Returns: boolean }
      envoyer_rappels: { Args: never; Returns: undefined }
      envoyer_rappels_planifies: { Args: never; Returns: undefined }
      envoyer_recap_quotidien: { Args: never; Returns: undefined }
      envoyer_relances: { Args: never; Returns: undefined }
      envoyer_relances_factures: { Args: never; Returns: undefined }
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
      prendre_piece_camion: {
        Args: { p_materiel: string; p_quantite: number; p_salarie: string }
        Returns: undefined
      }
      rdv_par_token: { Args: { p_token: string }; Returns: Json }
      reapprovisionner_camion: {
        Args: { p_materiel: string; p_quantite: number; p_salarie: string }
        Returns: undefined
      }
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
      repondre_devis_public: {
        Args: { p_accepter: boolean; p_token: string }
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
      test_simple: { Args: never; Returns: number }
      test2: { Args: never; Returns: number }
      valider_demande_rdv: {
        Args: { p_accepter: boolean; p_rdv: string }
        Returns: undefined
      }
      verifier_limite_assistant: {
        Args: {
          p_entreprise_id: string
          p_fenetre_secondes?: number
          p_max?: number
        }
        Returns: number
      }
    }
    Enums: {
      role_membre: "owner" | "admin" | "salarie"
      statut_abonnement: "essai" | "actif" | "impaye" | "annule"
      statut_chantier: "en_cours" | "termine" | "annule"
      statut_depense: "en_attente" | "validee" | "refusee"
      statut_rdv: "confirme" | "annule" | "honore" | "absent" | "demande"
      type_mouvement_stock: "prise" | "reappro" | "ajustement_depot"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      role_membre: ["owner", "admin", "salarie"],
      statut_abonnement: ["essai", "actif", "impaye", "annule"],
      statut_chantier: ["en_cours", "termine", "annule"],
      statut_depense: ["en_attente", "validee", "refusee"],
      statut_rdv: ["confirme", "annule", "honore", "absent", "demande"],
      type_mouvement_stock: ["prise", "reappro", "ajustement_depot"],
    },
  },
} as const
