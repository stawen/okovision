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

Pour développer avec une base Docker temporaire, suivre les
[instructions locales](./docs/installation-et-exploitation.md#base-docker-pour-le-développement-et-les-tests),
puis choisir :

- `npm run dev:local` : jeu V2 et migrations à jour.
- `npm run dev:setup` : base vide, sans tables, pour tester `/setup`.
- `npm run dev:v1` : jeu historique V1, pour tester la post-installation.

Chaque commande recrée sa propre base en mémoire : ses modifications sont
perdues au prochain lancement ou à l'arrêt du conteneur. Ces bases sont
indépendantes des compositions d'exploitation et ne remplacent pas votre `.env`.

1. Préparer le fichier privé `.env` en suivant le
   [guide d'installation et d'exploitation](./docs/installation-et-exploitation.md).
2. Installer et lancer le serveur :

   ```sh
   nvm use
   npm ci
   npm run dev -- --host 127.0.0.1
   ```

3. Ouvrir <http://localhost:5173> et compléter la post-installation si demandée.

La vérification de connexion à la base peut être lancée avec
`npm run db:check` (elle exécute seulement `SELECT 1`).

Les évolutions de structure utilisent [Knex et ses commandes npm](./docs/installation-et-exploitation.md#migrations-de-structure-avec-knex).
Elles sont exécutées explicitement par la CLI ou par validation du setup, et
automatiquement uniquement pour la base jetable `dev:local`. La configuration
métier est lue dans `oko_configuration`; `config.json` n'est plus utilisé par
l'application Node.

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
