import { apiClient } from './client';

/**
 * Catalogue dynamique (marques, couleurs, types) pour l'autocomplétion.
 *
 * Tente d'abord les endpoints backend (`GET/POST /api/brands|colors|types`).
 * Tant qu'ils n'existent pas (tâche backend de l'issue #13), on retombe sur des
 * listes locales de valeurs courantes, complétées en mémoire par les entrées
 * ajoutées pendant la session. Le basculement vers l'API est automatique.
 */

type Resource = 'brands' | 'colors' | 'types';

// Valeurs de repli (seed local) — reprises tant que le backend n'est pas prêt.
const fallback: Record<Resource, string[]> = {
  brands: [
    'Zara', 'H&M', 'Gucci', 'Nike', 'Adidas', 'Chanel', 'Dior', 'Louis Vuitton',
    'Hermès', 'Prada', 'Balenciaga', 'Céline', 'Saint Laurent', 'Sézane', 'COS',
    'Maje', 'Sandro', 'Ba&sh', 'Zadig & Voltaire', 'The Kooples', 'Mango',
    'Uniqlo', "Levi's", 'Lacoste', 'Ralph Lauren',
  ],
  colors: [
    'Noir', 'Blanc', 'Gris', 'Beige', 'Marron', 'Camel', 'Rouge', 'Bordeaux',
    'Rose', 'Orange', 'Jaune', 'Vert', 'Kaki', 'Bleu', 'Marine', 'Violet',
    'Or', 'Argent', 'Multicolore',
  ],
  types: [
    'Sac à main', 'Robe', 'Manteau', 'Veste', 'Blouson', 'Pull', 'Gilet',
    'Chemise', 'Top', 'T-shirt', 'Jupe', 'Pantalon', 'Jean', 'Short',
    'Chaussures', 'Bottes', 'Escarpins', 'Foulard', 'Écharpe', 'Ceinture',
    'Lunettes',
  ],
};

function normalize(data: any): string[] {
  const arr = Array.isArray(data) ? data : data?.data ?? [];
  return arr
    .map((x: any) => (typeof x === 'string' ? x : x?.name ?? x?.label ?? x?.value))
    .filter((v: any): v is string => typeof v === 'string' && v.length > 0);
}

async function search(resource: Resource, query: string): Promise<string[]> {
  const q = query.trim();
  try {
    const { data } = await apiClient.get(`/${resource}`, { params: { search: q } });
    return normalize(data);
  } catch {
    const needle = q.toLowerCase();
    return fallback[resource]
      .filter((v) => (needle ? v.toLowerCase().includes(needle) : true))
      .slice(0, 8);
  }
}

async function create(resource: Resource, name: string): Promise<string> {
  const value = name.trim();
  try {
    const { data } = await apiClient.post(`/${resource}`, { name: value });
    return data?.name ?? value;
  } catch {
    // Backend absent : on mémorise l'entrée localement pour la session.
    if (!fallback[resource].some((v) => v.toLowerCase() === value.toLowerCase())) {
      fallback[resource].unshift(value);
    }
    return value;
  }
}

export const searchBrands = (q: string) => search('brands', q);
export const createBrand = (name: string) => create('brands', name);
export const searchColors = (q: string) => search('colors', q);
export const createColor = (name: string) => create('colors', name);
export const searchTypes = (q: string) => search('types', q);
export const createType = (name: string) => create('types', name);
