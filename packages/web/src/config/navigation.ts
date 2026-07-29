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
  items: NavItemData[];
};

export const navGroups: NavGroupData[] = [
  {
    items: [
      { id: 'search', title: 'Recherche', icon: Search, action: 'search', shortcut: '⌘K' },
      { id: 'dashboard', title: 'Tableau de bord', icon: LayoutDashboard, to: '/' },
      { id: 'alertes', title: 'Alertes', icon: Bell, to: '/alertes', badge: 3 },
    ],
  },
  {
    heading: 'Gestion',
    items: [
      { id: 'clients', title: 'Clientes', icon: Users, to: '/clients' },
      {
        id: 'articles',
        title: 'Articles & Dépôts',
        icon: Package,
        to: '/articles',
        children: [
          { id: 'a-on-sale', title: 'En vente', icon: Tag, to: '/articles?status=on_sale' },
          { id: 'a-sold', title: 'Vendus', icon: CheckCircle2, to: '/articles?status=sold' },
          { id: 'a-returned', title: 'Retournés', icon: Undo2, to: '/articles?status=returned' },
          { id: 'a-expired', title: 'Expirés', icon: Clock, to: '/articles?filter=expired' },
        ],
      },
      { id: 'retrocessions', title: 'Rétrocessions', icon: Banknote, to: '/retrocessions' },
      { id: 'documents', title: 'Documents', icon: FileText, to: '/documents' },
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
