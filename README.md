# OkoVision

Supervision de chaudière Ökofen, en cours de réécriture en **SvelteKit 3 / Svelte 5 / TypeScript strict**. Le serveur cible est un unique processus Node.js avec `adapter-node`.

## État de la migration

- L'application historique complète est conservée, sans modification de ses sources, dans [archive/php/](./archive/php/). Elle n'est ni exécutée ni publiée par SvelteKit.
- Le nouveau socle affiche une page de supervision responsive avec les couleurs historiques : anthracite `#222222`, bleu `#428bca`, vert `#5cb85c`, orange `#f0ad4e` et cyan `#5bc0de`. Aucun ancien framework ou script n'est chargé.
- **Aucune connexion MySQL, collecte, authentification ou commande chaudière n'est encore portée.** Les indicateurs restent explicitement indisponibles, sans données simulées.
- `GET /api/v1/health` contrôle uniquement la vitalité HTTP; `database: "not-configured"` ne constitue pas un contrôle de disponibilité MySQL.

Ne pas déployer cette réorganisation sur une installation PHP en service. Conserver cette installation sur sa version existante jusqu'à validation de la parité et de la bascule.

## Développement

Utiliser Node.js 26 LTS (version de référence dans [.nvmrc](./.nvmrc)) et npm. Le [fichier .npmrc](./.npmrc) sélectionne explicitement `https://registry.npmjs.org/`.

```sh
nvm use
npm ci
npm run dev -- --host 127.0.0.1
```

Ouvrir <http://localhost:5173>. Les versions directes sont figées dans [package.json](./package.json) et les résolutions dans [package-lock.json](./package-lock.json). TypeScript reste en `6.0.3`, dernière stable compatible avec les outils retenus; ne pas forcer TypeScript 7.

```sh
npm run check
npm run lint
npm test
npm run build
ORIGIN=http://localhost:3000 npm start
```

Avec SvelteKit 3, le plugin, les options du compilateur et `adapter-node` sont configurés dans [vite.config.ts](./vite.config.ts), selon le générateur officiel `sv`. Les imports internes utilisent `#lib`. Il n'y a pas de `svelte.config.js` dans ce socle.

L'archive est exclue du lint, des tests, de TypeScript et du contexte Docker. Les accès directs Vite aux fichiers archivés sont également refusés. Ne jamais exposer le dépôt lui-même comme racine d'un serveur statique.

## Docker

L'image multi-stage s'exécute sans root, avec un seul processus applicatif. Le contrôle de santé appelle `/api/v1/health`. Aucun SQL historique n'est exécuté au démarrage.

### Application seule

```sh
cp .env.remote.example .env.remote
docker compose --env-file .env.remote -f compose.yaml up --build -d
```

Ce mode ne crée ni service ni volume DB. **Le raccordement à une base distante reste à implémenter**, notamment la configuration validée, la lecture de secrets et le TLS vérifié.

### Préparer une MariaDB locale isolée

```sh
cp .env.local.example .env.local
mkdir -p secrets
```

Créer deux fichiers privés distincts, `secrets/db-password.txt` et `secrets/db-root-password.txt`, contenant chacun un mot de passe fort, puis limiter leurs permissions (`chmod 600`). Ces fichiers sont ignorés par Git et exclus du contexte Docker.

```sh
docker compose --env-file .env.local -f compose.yaml -f compose.db.yaml up --build -d
```

Le complément ajoute MariaDB 11.4, son volume et son contrôle de santé, sans publier son port. L'image MariaDB provisionne seulement une base vide et un compte à la première création du volume; **aucune table métier n'est créée et l'application n'y est pas encore connectée**. Ne pas monter les SQL destructifs de l'archive comme scripts d'initialisation. Une reprise des données devra être explicite, sur une copie isolée et sauvegardée.

Le port applicatif est lié à l'interface locale de l'hôte. En exploitation, placer un reverse proxy HTTPS devant le serveur et définir `ORIGIN` avec l'origine publique exacte. Ne pas activer plusieurs réplicas.

## Validation du socle

L'initialisation a été vérifiée avec Node.js 26.10.0 : contrôle de types sans erreur ni avertissement, lint, deux tests SSR et build `adapter-node` réussis. Le serveur a aussi été démarré depuis une copie du seul build avec `npm ci --omit=dev --ignore-scripts`, sans les sources ni l'archive.

Les contrôles HTTP confirment l'accueil, la feuille de style, la palette et le healthcheck, ainsi que l'absence d'accès public au PHP archivé. Le rendu navigateur a été vérifié en 1440 px et 375 px, sans débordement horizontal ni erreur JavaScript. Les 204 fichiers archivés sont identiques aux originaux; les liens documentaires et ancres de lignes ont été contrôlés.

Les deux compositions passent `docker compose config`. **Le build et le démarrage Docker n'ont pas pu être testés : le moteur Docker local est arrêté.** Les connexions DB locale/distante et le TLS ne sont pas encore implémentés ni validés.

L'audit initial npm signale 14 alertes dans les dépendances de développement (4 faibles, 10 modérées, notamment `deepmerge` et `minimatch`); `npm audit --omit=dev` ne signale aucune vulnérabilité. Les dernières versions directes compatibles sont utilisées, sans rétrogradation forcée ni contournement des dépendances homologues. Réévaluer ces alertes lors des mises à jour des outils.

## Documentation et suite

- [Réorganisation et démarrage](./docs/reorganisation-depot-et-demarrage-sveltekit.md)
- [Architecture cible](./docs/architecture-cible-svelte-node.md)
- [Inventaire historique](./docs/inventaire-fonctionnel-actuel.md)
- [Analyse de faisabilité](./docs/analyse-technique-et-faisabilite-node-svelte.md)

La prochaine tranche est la lecture seule de la matrice et des mesures journalières, un endpoint `/api/v1/mesures`, puis le graphique et ses tests de parité. Les bibliothèques métier seront ajoutées lors de leur portage, pas préinstallées sans usage.
