# Règle de Sécurité : Prévention des fuites de secrets

Tu ne dois **JAMAIS** inclure de secrets en clair dans le code (mots de passe, clés d'API, URI de base de données, tokens, clés privées, etc.) lors de l'écriture ou de la modification de code.

## Directives strictes
1. Toute valeur sensible doit être extraite depuis les variables d'environnement (`process.env.NOM_VARIABLE`).
2. Les secrets d'exemple doivent être documentés **uniquement** dans des fichiers de type `.env.example` avec des valeurs factices ou des instructions claires (ex: `super_secret_key_change_me_in_prod`).
3. **INTERDICTION ABSOLUE DE COMMITTER DES ARCHIVES DE DÉPLOIEMENT** : Tu ne dois **JAMAIS** ajouter, committer ou pousser sur GitHub des archives de déploiement (`.zip`, `.tgz`, `gmfront.zip`, `gmback.zip`, `finalflash_*.zip`, etc.), des dossiers de packaging (`FINAL FANTASY/`, `Last Last/`, `backend_build/`) ou des fichiers `.bak`, car les archives backend contiennent le fichier `.env` de production et les builds.
4. Avant d'exécuter une commande `git commit` ou `git push`, tu dois impérativement vérifier avec `git status` et `git diff --cached` qu'aucun secret en clair ni aucune archive `.zip` / `.tgz` n'a été insérée par mégarde.
