import { apiClient } from './client';

/**
 * Texte de repli affiché tant que l'endpoint backend `GET /api/settings/cgu`
 * n'est pas disponible. Il sera automatiquement remplacé par le texte officiel
 * dès que le backend fournira l'endpoint (tâche backend de l'issue #10).
 */
export const DEFAULT_CGU = `Conditions Générales de dépôt-vente — GM Boutique

(Texte provisoire — en attente de la version officielle)

1. Objet
Les présentes conditions régissent le dépôt d'articles par la cliente déposante
en vue de leur mise en vente par GM Boutique.

2. Propriété des articles
La déposante certifie être l'unique propriétaire des articles confiés et disposer
du droit de les mettre en vente. Elle garantit qu'ils ne proviennent d'aucune
activité illicite et qu'ils sont libres de tout droit de tiers.

3. Mise en vente et prix
GM Boutique met les articles en vente au prix public convenu lors du dépôt.
Une dégressivité de prix ou une restitution peut être prévue à une date butoir.

4. Rétrocession
En cas de vente, la déposante perçoit le gain net convenu lors du dépôt, déduction
faite de la commission de GM Boutique.

5. Durée et restitution
Passé le délai convenu, les articles invendus peuvent faire l'objet d'une baisse
de prix ou être restitués à la déposante selon l'option choisie au dépôt.

6. Protection des données
Les coordonnées de la déposante sont utilisées uniquement dans le cadre de la
gestion du dépôt-vente, conformément à la législation applicable.

En cochant la case de consentement, la déposante reconnaît avoir pris connaissance
des présentes conditions et les accepter sans réserve.`;

export interface CguDocument {
  content: string;
  version?: string;
  updatedAt?: string;
}

/**
 * Récupère le texte des CGU. Tente l'endpoint backend puis retombe sur le
 * texte par défaut si l'endpoint n'est pas encore disponible.
 */
export async function getCgu(): Promise<CguDocument> {
  try {
    const { data } = await apiClient.get('/settings/cgu');
    const content =
      typeof data === 'string' ? data : data?.content ?? data?.text ?? data?.cgu;
    if (content && typeof content === 'string') {
      return { content, version: data?.version, updatedAt: data?.updatedAt };
    }
  } catch {
    // Endpoint pas encore disponible : on utilise le texte de repli.
  }
  return { content: DEFAULT_CGU };
}
