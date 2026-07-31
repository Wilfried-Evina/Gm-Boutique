import type { Component } from 'vue';
import {
  LayoutDashboard,
  Users,
  Package,
  Tag,
  CheckCircle2,
  Undo2,
  Clock,
  Banknote,
  FileText,
  Bell,
  Search,
  Settings,
  LogOut,
  CreditCard,
} from 'lucide-vue-next';

export type NavItemData = {
  id: string;
  title: string;
  icon: Component;
  /** Destination vue-router. Absent pour les actions (recherche, déconnexion). */
  to?: string;
  /** Type d'action spéciale déclenchée au clic au lieu d'une navigation. */
  action?: 'search' | 'logout';
  badge?: number | string;
  shortcut?: string;
  children?: NavItemData[];
};

export type NavGroupData = {
  heading?: string;
  icon?: Component;
  items: NavItemData[];
};

export const navGroups: NavGroupData[] = [
  {
    items: [
      { id: 'dashboard', title: 'Tableau de bord', icon: LayoutDashboard, to: '/' },
      { id: 'alertes', title: 'Alertes', icon: Bell, to: '/alertes', badge: 3 },
    ],
  },
  {
    icon: Users,
    items: [
      { id: 'caisse', title: 'Caisse', icon: CreditCard, to: '/caisse' },
      { id: 'clients', title: 'Clientes', icon: Users, to: '/clients' },
      { id: 'articles', title: 'Articles', icon: Package, to: '/articles' },
      { id: 'a-on-sale', title: 'En vente', icon: Tag, to: '/articles/en-vente' },
      { id: 'a-sold', title: 'Vendus', icon: CheckCircle2, to: '/articles/vendus' },
      { id: 'a-returned', title: 'Retournés', icon: Undo2, to: '/articles/retournes' },
      { id: 'a-expired', title: 'Expirés', icon: Clock, to: '/articles/expires' },
      { id: 'retrocessions', title: 'Rétrocessions', icon: Banknote, to: '/retrocessions' },
      { id: 'factures', title: 'Factures', icon: FileText, to: '/factures' },
    ],
  },
];

export const bottomItems: NavItemData[] = [
  { id: 'settings', title: 'Paramètres', icon: Settings, to: '/settings', shortcut: '⌘,' },
  { id: 'logout', title: 'Déconnexion', icon: LogOut, action: 'logout' },
];

/** Aplati tous les éléments (y compris enfants) — utile pour la recherche. */
export function flattenNav(): NavItemData[] {
  const all = [...navGroups.flatMap((g) => g.items), ...bottomItems];
  const flatten = (items: NavItemData[]): NavItemData[] =>
    items.reduce<NavItemData[]>((acc, item) => {
      acc.push(item);
      if (item.children) acc.push(...flatten(item.children));
      return acc;
    }, []);
  return flatten(all);
}
