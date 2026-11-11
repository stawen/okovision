# Réorganisation du dépôt et démarrage du projet SvelteKit

## 1. Décision et objectif

Repartir sur une racine dédiée à la nouvelle application SvelteKit, en déplaçant l'application historique complète dans `archive/php/`.

Il s'agit d'une **réécriture dans le même dépôt**, et non d'une application hybride PHP/Node. L'archive sert à consulter les règles métier et à préparer les tests de parité. La nouvelle application ne charge ni n'exécute le PHP archivé.

**Contrainte de versions : utiliser les dernières versions stables de Svelte et SvelteKit au moment de l'initialisation, avec la version stable de TypeScript la plus récente compatible avec le socle et ses outils**, en mode strict. TypeScript **6.0.3** est retenu pour la matrice actuelle, plutôt que TypeScript 7 dont le support n'est pas déclaré. Exclure les versions alpha, bêta, RC et `next`, sans contournement des dépendances homologues. La matrice figure en section 7.

Ce document décrit des **opérations futures** : il ne déplace aucun fichier et ne crée pas encore le projet SvelteKit, les fichiers Docker ou les commits.

Documents de référence :

- [Analyse technique et faisabilité](./analyse-technique-et-faisabilite-node-svelte.md).
- [Inventaire fonctionnel actuel](./inventaire-fonctionnel-actuel.md).
- [Architecture cible SvelteKit et Node.js](./architecture-cible-svelte-node.md).

## 2. Organisation cible du dépôt

```text
/
├── archive/
│   └── php/                  # Sources historiques figées, non exécutées
├── docs/                     # Études, décisions et documentation cible
├── src/
│   ├── routes/               # Pages, actions et endpoints natifs SvelteKit
│   ├── lib/
│   │   ├── components/
│   │   ├── contracts/
│   │   └── server/
│   │       ├── auth/
│   │       ├── config/
│   │       ├── services/
│   │       ├── repositories/
│   │       ├── boiler/
│   │       └── jobs/         # Planification et traitements intégrés
│   └── hooks.server.ts
├── static/                   # Ressources publiques sélectionnées
├── messages/                 # Traductions de la nouvelle application
├── tests/
│   ├── fixtures/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── package.json
├── package-lock.json
├── svelte.config.js
├── vite.config.ts
├── tsconfig.json
├── Dockerfile
├── .dockerignore
├── compose.yaml
├── compose.db.yaml
├── .env.local.example
├── .env.remote.example
├── .gitignore
└── README.md
```

Cette arborescence est indicative. Les fichiers générés doivent suivre les conventions de la version SvelteKit retenue. Le lockfile illustré suppose npm; conserver un seul gestionnaire de paquets et son lockfile.

Le dossier `archive/php/` n'est ni un second projet à maintenir, ni un répertoire public. Il ne fait partie ni du build applicatif ni de l'image Docker.

## 3. Périmètre de l'archivage

### Déplacer les sources historiques

Archiver l'application entière, pas seulement les extensions `.php` :

| Éléments actuels | Destination et traitement |
|---|---|
| Pages, routeurs, cron, setup et scripts PHP à la racine | Déplacement vers `archive/php/`, avec leurs noms actuels |
| `_include/`, `_templates/`, `_langs/`, `errors/` | Déplacement en conservant l'organisation interne |
| `js/`, `css/`, `fonts/`, `favicon.ico` | Déplacement intégral vers `archive/php/`, sans conserver ces éléments à la racine ni les copier automatiquement dans `static/` |
| `install/`, `.htaccess` | Archivage du SQL et des configurations d'exploitation PHP; ne pas les activer dans la cible |
| `config_sample.php` | Archivage comme référence, après vérification de l'absence de secrets réels |
| `INSTALL.txt`, `api-doc.md`, `changelog.md`, `pensebete.md` | Archivage de la documentation historique |
| `README.md` | Conserver une copie historique dans l'archive, puis remplacer le contenu à la racine par la documentation SvelteKit |
| `_logs/`, `_tmp/` | Déplacement des deux répertoires vers `archive/php/`, y compris leurs contenus locaux, sans les laisser à la racine. Les données d'exécution restent privées et non versionnées; seuls les fichiers explicatifs déjà suivis restent dans Git |

Le dossier de journaux présent dans ce dépôt se nomme `_logs/` (et non `_log/`). Les destinations sont donc explicitement `archive/php/js/`, `archive/php/css/`, `archive/php/fonts/`, `archive/php/favicon.ico`, `archive/php/_logs/` et `archive/php/_tmp/`.

Conserver à la racine :

- Le répertoire Git et son historique, sans déplacement ni réinitialisation du dépôt.
- Le dossier `docs/` et les études de migration.
- Les configurations transversales encore pertinentes, après examen.
- Un `.gitignore` adapté au nouveau projet.

Examiner les configurations d'éditeur, notamment `.vscode/launch.json` : archiver les configurations exclusivement PHP et garder ou créer uniquement celles utiles au nouveau projet.

### Ne pas versionner les données d'exploitation

Avant le déplacement, distinguer fichiers suivis, fichiers ignorés et fichiers locaux non suivis. Une opération fondée seulement sur les fichiers suivis peut laisser des secrets ou données à la racine.

Ne pas ajouter dans l'archive versionnée les configurations réelles, identifiants, secrets, CSV de production, sauvegardes, dumps, sessions, journaux ou fichiers temporaires. Le déplacement local de `_logs/` et `_tmp/` vers l'archive n'autorise pas leur ajout à Git : maintenir des exclusions ciblées sur leurs contenus non versionnés, tout en conservant les fichiers explicatifs déjà suivis. Si ces données doivent être conservées pour une reprise, prévoir également une sauvegarde privée hors dépôt, sans les supprimer aveuglément.

Les scripts et jeux SQL historiques restent des références à inspecter. Ils ne doivent pas être lancés automatiquement contre la base du nouveau projet; l'installateur historique contient des opérations destructives.

## 4. Séquence technique proposée

### Étape 1 — Établir le point de référence

1. Examiner l'état Git et préserver les modifications existantes.
2. Identifier précisément les fichiers sources, configurations et données locales.
3. Créer un commit de référence explicite, après examen des fichiers à inclure. Ne pas utiliser un ajout global susceptible d'embarquer des secrets.
4. Si une installation en fonctionnement est concernée, vérifier séparément ses sauvegardes et sa restauration : un commit de sources ne sauvegarde pas la base ni les secrets.

Les commits sont des étapes recommandées à exécuter lors de la réorganisation, pas des opérations réalisées par cette étude.

### Étape 2 — Archiver et nettoyer la racine

1. Créer `archive/php/`.
2. Déplacer les sources suivies avec `git mv`, par chemins explicites, sans englober `docs/` ni les fichiers transversaux conservés.
   Inclure intégralement `js/`, `css/`, `fonts/`, `favicon.ico`, `_logs/` et `_tmp/`. Inventorier et déplacer aussi leurs contenus locaux ignorés/non suivis, sans les ajouter à Git ni écraser de fichiers; vérifier les exclusions sur les chemins de destination.
3. Préserver le README historique et écrire le nouveau README de transition à la racine.
4. Mettre à jour les liens des études vers les sources déplacées, y compris les ancres de lignes, et les liens entre documents historiques si nécessaire.
5. Adapter les configurations conservées et vérifier qu'aucune donnée privée ou source historique oubliée ne reste à la racine.
6. Vérifier le diff et créer un commit dédié à l'archivage, distinct de l'initialisation SvelteKit.

Ne pas reformater ou corriger les sources archivées : elles doivent rester une référence fidèle. Leur exécution après déplacement n'est pas un objectif. Une reproduction de l'ancien environnement se fait depuis le point de référence Git, dans un environnement isolé.

### Étape 3 — Initialiser SvelteKit à la racine

1. Générer un squelette officiel SvelteKit dans un répertoire temporaire, hors du dépôt, puis intégrer ses fichiers à la racine sans écraser les documents ni les configurations conservées.
2. Retenir les dernières versions stables de Svelte et SvelteKit, avec la version stable de TypeScript la plus récente compatible (actuellement `6.0.3`), TypeScript strict et `@sveltejs/adapter-node`. Choisir une version Node LTS supportée et vérifier la matrice de la section 7 avant toute installation; un conflit de compatibilité doit être résolu explicitement, pas masqué.
3. Adapter `.gitignore` au nouveau projet. La règle historique `test*` exclut notamment le futur dossier `tests/` : la retirer ou la remplacer par des exclusions historiques ciblées. Prévoir les exclusions des dépendances, builds, fichiers d'environnement privés et données d'exécution; vérifier que les modèles `.env.*.example` restent versionnables.
4. Configurer les outils pour analyser le nouveau code et exclure `archive/` du lint, des tests, de la vérification TypeScript et des éventuels scans de ressources.
5. Installer les dépendances, puis valider les types, les tests du socle et le build de production.
6. Vérifier les fichiers réellement suivis par Git, puis créer un commit dédié au socle SvelteKit.

Ne pas réutiliser automatiquement les anciennes dépendances frontend. Sélectionner les ressources à reprendre, leurs licences et leurs usages avant toute copie vers `static/`.

### Étape 4 — Mettre en place Docker et MySQL

- Créer une image multi-stage du serveur SvelteKit; exclure explicitement `archive/`, les secrets, sauvegardes et données du contexte via `.dockerignore`.
- Prévoir un seul service applicatif `app`, un seul processus Node et une seule instance, avec planification et traitements intégrés.
- Créer `compose.yaml` avec `app` seul pour une base distante, sans service ni dépendance `db`.
- Créer `compose.db.yaml`, sélectionné explicitement, pour ajouter MariaDB locale, son volume et son contrôle de santé.
- Documenter configuration runtime, secrets, volumes privés et TLS pour le mode distant.
- Tester initialement sur une base isolée. Ne modifier ni le schéma historique ni les données de production au démarrage.

Les détails d'exploitation, de reprise des tâches et d'arrêt gracieux sont définis dans l'[architecture cible](./architecture-cible-svelte-node.md#9-conteneurs-docker-compose-et-exploitation).

### Étape 5 — Porter une première tranche fonctionnelle

Commencer en lecture seule par une chaîne complète :

1. Configuration serveur et connexion MySQL.
2. Lecture de la matrice des capteurs et des mesures journalières.
3. Endpoint natif `/api/v1/mesures`.
4. Page Svelte affichant une journée et son graphique.
5. Comparaison des points, valeurs, unités et dates avec des références historiques.
6. Validation du build conteneurisé avec base locale et distante.

Ensuite, porter les domaines de l'inventaire : authentification et permissions avant activation des mutations, administration, historique et calculs, imports, collecte planifiée et interactions chaudière.

La nouvelle application appelle ses propres services TypeScript, jamais les routeurs PHP archivés. Les fichiers `+server.ts`, actions et chargements serveur constituent ses interfaces natives. Les tests de parité utilisent des fixtures anonymisées; si une exécution PHP est nécessaire pour constituer les références, elle se fait séparément, depuis l'ancien état Git.

## 5. Coexistence et bascule

Le déplacement des sources dans Git ne doit pas être déployé tel quel sur un serveur PHP en service : ce changement casse volontairement l'organisation historique.

Pendant le développement, l'installation PHP éventuellement utilisée en production reste sur sa version existante. SvelteKit dispose de sa propre configuration et d'une copie isolée de la base. Les collectes et commandes chaudière réelles restent désactivées tant que leur activation n'est pas maîtrisée.

Avant la bascule :

- Démontrer la parité fonctionnelle et la restauration des sauvegardes.
- Migrer les consommateurs des API historiques vers les endpoints SvelteKit.
- Arrêter le cron PHP et les autres écritures historiques avant d'activer les tâches Node.
- Valider la progression persistée des imports, leur récupération après interruption et la réactivité HTTP pendant leur exécution.
- Documenter le retour arrière, notamment les éventuels changements de format des hashes ou secrets incompatibles avec PHP.

L'archive peut rester dans le dépôt après la bascule, mais reste exclue de la livraison. Sa suppression ultérieure peut faire l'objet d'une décision distincte; Git conserve déjà les versions historiques.

## 6. Critères d'acceptation de la réorganisation

- La racine contient le projet SvelteKit et sa documentation, sans dépendance d'exécution au PHP.
- Les sources historiques sont conservées dans `archive/php/`, sans ajout de données privées.
- Aucun des anciens chemins `js/`, `css/`, `fonts/`, `favicon.ico`, `_logs/` ou `_tmp/` ne subsiste à la racine après archivage; leurs contenus ont été préservés sous `archive/php/`, avec les données privées exclues de Git.
- Les liens documentaires restent valides après les déplacements.
- Les tests du nouveau projet sont effectivement suivis par Git et exécutés; la règle `test*` ne les masque plus.
- Les outils de build, lint et tests ne parcourent pas l'archive.
- L'archive est absente du contexte et de l'image Docker, et n'est accessible par aucune route publique.
- Le serveur applicatif fonctionne dans un seul conteneur, avec une seule instance et sans worker séparé.
- Les modes MariaDB locale et MySQL/MariaDB distante sont testés, sans initialisation destructive automatique.

**Conclusion : archiver d'abord l'application historique, puis initialiser SvelteKit à la racine dans une étape séparée.** Cette organisation donne une base propre sans perdre la référence nécessaire au portage des fonctionnalités et calculs existants.

## 7. Versions des bibliothèques et compatibilité

### Méthode et règle de sélection

Versions consultées le **11 novembre 2026** sur le registre public npm, via le tag `latest`, les champs `peerDependencies`, `peerDependenciesMeta` et `engines`. La version Node provient de l'[index officiel des versions Node.js](https://nodejs.org/dist/index.json). Le registre npm configuré localement n'ayant pas fourni ces métadonnées, la consultation a explicitement ciblé `https://registry.npmjs.org`, sans modifier la configuration npm.

Cette liste est une **photographie des publications et de leurs contraintes déclarées**, pas un lockfile ni une certification d'exécution. Aucun paquet n'a été installé et aucun build SvelteKit n'a été exécuté pour cette étude. Refaire la vérification à l'initialisation : retenir les dernières stables de Svelte et SvelteKit et la dernière stable compatible de TypeScript, pas nécessairement les numéros ci-dessous. La ligne TypeScript indique la version compatible sélectionnée, non le tag `latest`.

### Socle SvelteKit et outils de développement

| Paquet / runtime | Version stable observée | Compatibilité déclarée / décision |
|---|---|---|
| Node.js | `26.13.0` LTS | Base proposée pour développement, CI et image Docker; satisfait les contraintes Node du socle ci-dessous |
| `svelte` | `5.57.3` | Dernière stable; satisfait la contrainte Svelte de Kit et des composants retenus |
| `@sveltejs/kit` | `3.2.0` | Demande Svelte `^5.57.1`, Vite `^8.0.12`, plugin Svelte `^7.0.0`; pair TypeScript optionnel mais limité à `^6.0.0` |
| `typescript` | **`6.0.3` retenue** | Dernière stable compatible observée; satisfait Kit `^6.0.0`, svelte-check `^6.0.0` et typescript-eslint `>=4.8.4 <6.1.0`. Ne pas prendre `latest`, actuellement `7.0.2` |
| `@sveltejs/adapter-node` | `6.0.2` | Pair Kit `^3.0.0-next.0`, qui accepte également la stable `3.2.0`; l'adaptateur lui-même est stable |
| `vite` | `8.3.8` | Satisfait la plage de Kit et du plugin Svelte |
| `@sveltejs/vite-plugin-svelte` | `7.3.1` | Accepte Svelte `^5.46.4` et Vite `^8.0.0` |
| `svelte-check` | `4.7.8` | Accepte Svelte 5; TypeScript `^5.0.0 \|\| ^6.0.0`, donc pas TypeScript 7 |
| `@types/node` | `26.6.6` | Dernière version observée dans la branche 26, alignée sur le runtime proposé |
| `vitest` | `5.1.0` | Accepte Vite 8, Node 26 et types Node 26; les tests et le contrôle de types restent nécessaires |
| `@playwright/test` | `1.65.0` | Node `>=20`; conserver cette même version pour les navigateurs/outils Playwright correspondants |
| `eslint` | `10.14.0` | Accepté par les plugins retenus; configuration plate pour le nouveau projet |
| `eslint-plugin-svelte` | `3.24.1` | Accepte Svelte 5 et ESLint 10 |
| `typescript-eslint` | `8.72.2` | Accepte ESLint 10, mais TypeScript `>=4.8.4 <6.1.0`, donc pas TypeScript 7 |

### Interface, composants et traduction

| Paquet | Version stable observée | Conditions d'utilisation |
|---|---|---|
| `bits-ui` | `2.21.0` | Svelte `^5.33.0`; satisfait par `5.57.3` |
| `@internationalized/date` | `3.12.4` | Pair requis par bits-ui, plage `^3.8.1`; à déclarer explicitement |
| `svelte-dnd-action` | `0.9.80` | Plage déclarée acceptant Svelte 5; tester le DnD, le clavier et le démontage des composants |
| `@inlang/paraglide-js` | `3.2.2` | Accepte Vite `>=5` et ESLint 9/10; intégration SSR à tester sur Kit 3 |
| `highcharts` | `13.1.1` | Conditionné à la licence et aux tests de parité; composant Svelte local, chargement navigateur uniquement |

Les pairs PDF `jspdf` et `svg2pdf.js` de Highcharts sont optionnels : ne pas les ajouter sans besoin validé. Aucun wrapper Svelte supplémentaire n'est requis pour les graphiques.

### Services serveur du même projet SvelteKit

Ces paquets ne sont pas des plugins Svelte : leur sélection dépend principalement de Node, de leurs API et des tests métier. L'absence de pair Svelte/TypeScript ne prouve pas une compatibilité complète avec le futur build.

| Paquet | Version stable observée | Usage / condition |
|---|---|---|
| `mysql2` | `3.24.6` | API `mysql2/promise`, schéma historique inchangé |
| `zod` | `4.6.7` | Validation des contrats, configuration et commandes |
| `decimal.js` | `10.6.0` | Calculs décimaux et arrondis caractérisés |
| `luxon` | `3.7.2` | Dates métier et fuseaux |
| `@types/luxon` | `3.7.6` | Dépendance de développement pour les types Luxon |
| `csv-parse` | `7.0.3` | Imports CSV en streaming |
| `iconv-lite` | `0.7.3` | Seulement si les encodages des fichiers réels le nécessitent |
| `busboy` | `1.6.0` | Upload multipart borné et streaming |
| `@types/busboy` | `1.5.5` | Dépendance de développement pour les types Busboy |
| `fetch-cookie` | `3.2.0` | Authentification chaudière avec fetch natif; dépend de tough-cookie `^6.0.0` |
| `tough-cookie` | `6.1.0` | Déclarer directement si le code importe son CookieJar; satisfait fetch-cookie |
| `cheerio` | `1.2.0` | Lecture du listing HTML de la chaudière |
| `pino` | `10.4.0` | Logs structurés et masquage des secrets |
| `node-cron` | `4.6.0` | Planificateur intégré au serveur SvelteKit, pas un worker séparé |

Les API `fetch`, `AbortController`, `node:crypto` et `node:fs/promises` sont fournies par Node.js : aucun paquet de substitution n'est nécessaire.

### Version TypeScript retenue et conditions de démarrage

Les métadonnées de [SvelteKit 3.2.0](https://registry.npmjs.org/@sveltejs%2fkit/3.2.0), [svelte-check 4.7.8](https://registry.npmjs.org/svelte-check/4.7.8) et [typescript-eslint 8.72.2](https://registry.npmjs.org/typescript-eslint/8.72.2) ne déclarent pas le support de TypeScript 7.0.2. Le caractère optionnel du pair TypeScript de Kit ne justifie pas d'ignorer sa plage lorsque TypeScript est effectivement utilisé.

**Retenir TypeScript `6.0.3`**, dernière stable observée dans la branche 6, compatible avec les plages déclarées de ces trois outils. Ce choix remplace l'exigence initiale de TypeScript au tag `latest` : les dernières stables de Svelte et SvelteKit restent prioritaires, avec un TypeScript pris en charge.

- Déclarer explicitement `"typescript": "6.0.3"` dans les dépendances de développement du futur projet et figer cette résolution dans le lockfile.
- Ne pas utiliser `--force`, `--legacy-peer-deps`, une préversion ou un override pour masquer le conflit.
- Conserver les contrôles de types et le lint; la compatibilité déclarée doit être confirmée par l'installation et les validations du socle.
- Réévaluer TypeScript 7 seulement lorsque SvelteKit et les outils retenus déclarent son support, puis valider la montée de version par les mêmes tests.

Pour reproduire la vérification, remplacer le nom du paquet dans cette commande de lecture seule :

```sh
npm view @sveltejs/kit@latest version peerDependencies peerDependenciesMeta engines --json --registry=https://registry.npmjs.org
```

Avec TypeScript `6.0.3`, le conflit de plages identifié est levé; la compatibilité complète à l'exécution reste à démontrer. Figer les versions directes, générer et versionner le lockfile, puis utiliser `npm ci` en CI et dans Docker. Accepter le socle seulement après installation sans conflit, contrôle TypeScript/Svelte, lint, tests et build `adapter-node`, puis démarrage du conteneur avec les deux modes de base. Les mises à jour ultérieures doivent passer les mêmes validations.
