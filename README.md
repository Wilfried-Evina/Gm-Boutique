# GM Boutique

Application de gestion digitalisée pour la boutique de dépôt-vente GM Boutique (Genève).

## 🚀 Prérequis

- Node.js (v18+)
- Un compte MongoDB Atlas (pour la base de données)

## 📦 Installation (Sprint 1)

1. Cloner le projet :
   ```bash
   git clone https://github.com/Wilfried-Evina/Gm-Boutique.git
   cd Gm-Boutique
   ```

2. Installer les dépendances du monorepo :
   ```bash
   npm install
   ```

3. Configurer l'environnement :
   ```bash
   cp .env.example .env
   # Modifier .env en y insérant ton URI MongoDB Atlas
   ```

## 🛠️ Développement

Démarrer simultanément le backend et le frontend en mode développement :

```bash
npm run dev
```

- **Frontend (Vue 3)** : http://localhost:5173 
- **Backend API (Express)** : http://localhost:5000

## 🏗️ Structure du Monorepo

- `packages/api` : Backend Node.js / Express / TypeScript
- `packages/web` : Frontend Vue 3 / Vite
- `shared/` : Types et utilitaires partagés entre front et back
