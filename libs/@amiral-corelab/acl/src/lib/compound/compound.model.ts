import type { CompoundCompanyModel } from './compound-company.model';
import type { UuidV7 } from '../primitives/uuid-v7';
import type { CompoundDocumentModel } from './compound-document.model';

export interface CompoundModel {
  id: UuidV7;
  externalId: string;
  internalId: string;
  internalSurname: string;
  customerExternalId: string;
  inchi: string;
  cas: string;
  companies: CompoundCompanyModel[];
  documents: CompoundDocumentModel[];
}

/**
 1. Identification du composé

 Données nécessaires pour lever toute ambiguïté :
 •	Nom chimique (IUPAC si possible)
 •	Nom usuel / alias
 •	Numéro CAS
 •	Identifiant interne (ID LIMS)
 •	Fournisseur
 •	Numéro de lot (batch / lot number)
 •	Référence commande / client

 ⸻

 2. Informations physico-chimiques

 Permet d’anticiper les conditions de manipulation :
 •	État physique (solide, liquide, gaz)
 •	Apparence (couleur, texture)
 •	Pureté (%)
 •	Concentration (si solution)
 •	Masse / volume reçu
 •	Solvant (si applicable)
 •	pH (si pertinent)
 •	Hygroscopicité (oui/non)
 •	Volatilité

 ⸻

 3. Conditions de stockage

 Critique pour éviter la dégradation :
 •	Température requise (ex: -20°C, 4°C, ambiant)
 •	Sensibilité à la lumière (photosensible)
 •	Sensibilité à l’air / humidité
 •	Atmosphère requise (inerte : N₂, Ar)
 •	Conditions spécifiques (ex: cryo, sec, sous vide)
 •	Durée de stabilité / date d’expiration

 ⸻

 4. Conditions de manipulation

 Contraintes opérationnelles :
 •	Température de manipulation
 •	Nécessité de hotte (chimique / flux laminaire)
 •	Temps maximal hors stockage
 •	Précautions particulières (ex: décongélation lente)

 ⸻

 5. Risques et sécurité (HSE)

 Données critiques pour la sécurité :
 •	Classification GHS / CLP
 •	Pictogrammes de danger
 •	Mentions H (Hazard statements)
 •	Mentions P (Precautionary statements)
 •	Toxicité (orale, cutanée, inhalation)
 •	Cancérogène / mutagène / reprotoxique
 •	Corrosif / irritant
 •	Inflammable / explosif
 •	Réactif (eau, air, acides, bases, oxydants)
 •	Fiche de Données de Sécurité (FDS / SDS)

 ⸻

 6. Équipements de protection (EPI)

 À déduire ou explicitement fournis :
 •	Gants (type requis)
 •	Lunettes / visière
 •	Blouse / combinaison
 •	Protection respiratoire
 •	Manipulation sous hotte obligatoire ou non

 ⸻

 7. Conformité réglementaire

 Selon contexte laboratoire / client :
 •	Statut réglementaire (REACH, etc.)
 •	Restrictions d’usage
 •	Transport (ADR, IATA)
 •	Produit contrôlé / réglementé

 ⸻

 8. Intégrité et contrôle à réception

 Contrôle qualité immédiat :
 •	Intégrité du contenant
 •	Correspondance avec commande
 •	Étiquetage conforme
 •	Conditions de transport respectées (température, etc.)
 •	Présence de contamination visible
 •	Quantité conforme

 ⸻

 9. Traçabilité

 Fondamental pour un LIMS :
 •	Date/heure de réception
 •	Opérateur ayant réceptionné
 •	Emplacement initial de stockage
 •	Historique des manipulations (à initier)
 •	Statut (reçu, en quarantaine, validé, rejeté)

 ⸻

 10. Statut opérationnel

 Workflow métier :
 •	En attente de contrôle
 •	Validé pour usage
 •	Bloqué (non conforme)
 •	En quarantaine
 •	Détruit / rejeté

 ⸻

 11. Documents associés
 •	FDS (obligatoire)
 •	Certificat d’analyse (CoA)
 •	Fiche fournisseur
 •	Instructions spécifiques client
 •	Bon de livraison
 */
