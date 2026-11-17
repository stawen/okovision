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

## Utiliser OkoVision avec Docker

Prérequis : Docker Engine avec Docker Compose. Choisir une image publiée dans
les [releases GitHub](https://github.com/stawen/okovision/releases), puis
télécharger et extraire le code source de cette même release pour obtenir les
fichiers Compose et les exemples de configuration. Aucune installation de Node
ni compilation n'est nécessaire. Une image privée sur GHCR nécessite une
authentification Docker.

Choisir **un seul** des deux modes ci-dessous. Renseigner `OKOVISION_IMAGE`
dans le fichier d'environnement avec l'image et le tag publiés, par exemple
`ghcr.io/stawen/okovision:v2.0.0-rc.1` si cette release existe. Il n'y a pas
de tag `latest` automatique.

### 1. Application et MariaDB locale persistante

Ce mode crée une base MariaDB vide, sans importer d'historique. Ses données
restent dans un volume Docker nommé après un arrêt ou une recréation des
conteneurs.

```sh
test -e .env.local || cp .env.local.example .env.local
mkdir -p secrets
chmod 700 secrets
```

Modifier `.env.local` : renseigner `OKOVISION_IMAGE`, vérifier `DB_NAME` et
`DB_USER`, et adapter `ORIGIN` au navigateur. Créer les fichiers privés
`secrets/db-password.txt` et `secrets/db-root-password.txt`, chacun contenant
un mot de passe distinct. Ne pas écraser de fichiers existants. Puis :

```sh
chmod 600 .env.local
chmod 644 secrets/db-password.txt secrets/db-root-password.txt
docker compose --env-file .env.local -f compose.yaml -f compose.db.yaml up -d
```

Le dossier `secrets` reste privé sur l'hôte ; les fichiers doivent être
lisibles par les utilisateurs non root dans leurs conteneurs respectifs.
Restreindre aussi l'accès à Docker. MariaDB ne réapplique pas ces identifiants
à un volume déjà initialisé : les modifier dans les fichiers ne change pas les
comptes existants.

### 2. Application avec MariaDB distante

Ce mode ne crée ni serveur ni volume de base de données. Utiliser une base
accessible depuis le conteneur ; `localhost` désigne le conteneur lui-même.

```sh
test -e .env.remote || cp .env.remote.example .env.remote
```

Modifier `.env.remote` : renseigner `OKOVISION_IMAGE`, `DB_ADRESSE` (hôte et
port éventuel), `DB_NAME`, `DB_USER`, `DB_PASSWORD` et `ORIGIN`. La connexion
TLS est vérifiée par défaut. Choisir les droits de base nécessaires aux
opérations prévues ; le setup et les fonctions d'écriture ne fonctionnent pas
avec un compte en lecture seule.

```sh
chmod 600 .env.remote
docker compose --env-file .env.remote -f compose.yaml up -d
```

Le mot de passe transmis à Compose est visible dans la configuration du
conteneur : protéger le fichier et l'accès à Docker. Pour une CA privée, voir
le [guide d'exploitation](./docs/installation-et-exploitation.md#base-distante).

### Premier accès et précautions

Par défaut, ouvrir <http://localhost:3000> sur la machine qui héberge Docker.
Le port est lié à son interface locale ; pour un accès distant, prévoir un
reverse proxy HTTPS et configurer `ORIGIN` avec l'URL publique. Ne pas utiliser
plusieurs réplicas.

Sur une base vierge, le formulaire `/setup` crée les tables et le compte
administrateur **après validation**. Réserver son accès à l'administrateur.
La collecte peut démarrer après le setup : vérifier les paramètres de la
chaudière avant de valider. Sur une base existante ou partielle, sauvegarder et
tester d'abord sur une copie isolée ; une réinstallation confirmée peut
supprimer et recréer des tables. Ne pas utiliser ce parcours sur une
installation PHP en service.

Sauvegarder et tester la restauration de la base, y compris le volume MariaDB
local. Pour arrêter le mode local sans supprimer son volume :

```sh
docker compose --env-file .env.local -f compose.yaml -f compose.db.yaml down
```

Ajouter `-v` à cette commande supprimerait le volume et ses données.
Le démarrage et le healthcheck HTTP ne certifient ni la connexion à la base ni
la parité fonctionnelle. Consulter le
[guide d'installation et d'exploitation](./docs/installation-et-exploitation.md)
avant toute mise en service.

## Développement local

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

## Recalcul des synthèses journalières

La page membre `/private/configuration/daily-summaries` permet de choisir deux
dates incluses et d'afficher toutes les journées de la période, de la plus
ancienne à la plus récente. Le jour courant, selon le fuseau de l'installation,
est exclu.

Chaque ligne permet de recalculer sa synthèse. **Tout recalculer** traite les
lignes successivement, en commençant par la plus ancienne. Après une écriture
réussie, la ligne clignote en vert puis disparaît (sans clignotement si les
animations réduites sont activées). En cas d'échec, le traitement continue
avec la journée suivante ; la ligne reste affichée en rouge avec son erreur
pour permettre une nouvelle tentative, sans bandeau d'erreur en doublon.
Si aucun relevé n'existe dans `oko_historique_full` pour la journée, la ligne
affiche « Aucune donnée journalière pour ce jour » plutôt que l'erreur générique.
Le bouton **Tout recalculer** est situé
à droite au-dessus du tableau.

Le calcul réutilise les relevés enregistrés et les paramètres actuels
(`poidsPellet`, `tcRef`) ; il remplace la synthèse existante dans
`oko_resume_day` sous le verrou d'écriture partagé avec la collecte.
Il n'importe aucun fichier et n'envoie aucune commande à la chaudière.

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
La [publication d'une release candidate Docker sur GHCR](./docs/installation-et-exploitation.md#publication-dune-release-candidate)
se lance manuellement depuis GitHub Actions.

## Documentation

- [État à date : réalisé, reste à faire et améliorations](./docs/etat-a-date-de-la-migration.md)
- [Installation et exploitation](./docs/installation-et-exploitation.md)
- [Inventaire fonctionnel historique](./docs/inventaire-fonctionnel-actuel.md)
- [Architecture cible Svelte/Node](./docs/architecture-cible-svelte-node.md)
- [Analyse technique et faisabilité](./docs/analyse-technique-et-faisabilite-node-svelte.md)
- [Réorganisation du dépôt et démarrage SvelteKit](./docs/reorganisation-depot-et-demarrage-sveltekit.md)
- [Actions à clarifier](./docs/actions-a-faire.md)
