/**
 * Décodage léger d'un JWT côté client (sans dépendance).
 * Sert uniquement à lire la date d'expiration — la validité réelle
 * reste vérifiée par le serveur (endpoint /auth/me).
 */

interface JwtPayload {
  userId?: string;
  role?: string;
  exp?: number; // secondes epoch
  iat?: number;
  [key: string]: unknown;
}

export function decodeJwt(token: string): JwtPayload | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

/** true si le token est absent, illisible ou expiré (marge de 10 s). */
export function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  const payload = decodeJwt(token);
  if (!payload?.exp) return true;
  return Date.now() >= payload.exp * 1000 - 10_000;
}
