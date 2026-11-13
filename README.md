# OkoVision

Application de supervision de chaudière Ökofen, en cours de migration de PHP
vers SvelteKit, Svelte 5 et Node.js. Le nouveau serveur utilise un processus
Node unique et se connecte à une base MySQL/MariaDB existante.

La migration est partielle : certaines fonctions de supervision et
d'administration sont portées, d'autres restent à faire. L'application PHP
historique est conservée dans [`archive/php/`](./archive/php/) comme référence;
elle n'est ni exécutée ni publiée par la nouvelle application. **Ne pas
remplacer une installation PHP en service avant validation de la parité et du
plan de bascule.**

## Démarrage local

Prérequis : Node.js 26 (voir [`.nvmrc`](./.nvmrc)) et npm.

Pour développer sans base existante, utiliser la
[base Docker locale avec fixtures](./docs/installation-et-exploitation.md#base-docker-pour-le-développement-et-les-tests).
Elle est indépendante des compositions d'exploitation et ne remplace pas votre `.env`.

Pour préparer les essais du tout premier lancement, `npm run appsetup` utilise
une [base locale sans tables](./docs/installation-et-exploitation.md#tester-le-premier-lancement-avec-une-base-vierge),
avec connexion définie dans `.env.appsetup`. Le provisioning du setup reste à porter.

1. Préparer les fichiers privés `.env` et `config.json` en suivant le
   [guide d'installation et d'exploitation](./docs/installation-et-exploitation.md).
2. Installer et lancer le serveur :

   ```sh
   nvm use
   npm ci
   npm run dev -- --host 127.0.0.1
   ```

3. Ouvrir <http://localhost:5173>.

La vérification de connexion à la base peut être lancée avec
`npm run db:check` (elle exécute seulement `SELECT 1`).

## Build et contrôles

```sh
npm run check
npm run lint
npm run test:unit -- --run
npm run build
```

Pour lancer le build Node en local : `ORIGIN=http://localhost:3000 npm start`.
Pour Docker Compose, les modes base distante et MariaDB locale sont décrits
dans le [guide d'installation et d'exploitation](./docs/installation-et-exploitation.md).

## Documentation

- [État à date : réalisé, reste à faire et améliorations](./docs/etat-a-date-de-la-migration.md)
- [Installation et exploitation](./docs/installation-et-exploitation.md)
- [Inventaire fonctionnel historique](./docs/inventaire-fonctionnel-actuel.md)
- [Architecture cible Svelte/Node](./docs/architecture-cible-svelte-node.md)
- [Analyse technique et faisabilité](./docs/analyse-technique-et-faisabilite-node-svelte.md)
- [Réorganisation du dépôt et démarrage SvelteKit](./docs/reorganisation-depot-et-demarrage-sveltekit.md)
- [Actions à clarifier](./docs/actions-a-faire.md)
