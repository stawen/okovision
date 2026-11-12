# OkoVision

Supervision de chaudière Ökofen, en cours de réécriture en **SvelteKit 3 / Svelte 5 / TypeScript strict**. Le serveur cible est un unique processus Node.js avec `adapter-node`.

## État de la migration

- L'application historique complète est conservée, sans modification de ses sources, dans [archive/php/](./archive/php/). Elle n'est ni exécutée ni publiée par SvelteKit.
- Le nouveau socle affiche une page de supervision responsive avec les couleurs historiques : anthracite `#222222`, bleu `#428bca`, vert `#5cb85c`, orange `#f0ad4e` et cyan `#5bc0de`. Aucun ancien framework ou script n'est chargé.
- L'accueil lit les indicateurs et graphiques journaliers configurés en lecture seule depuis MySQL. Le zoom et le déplacement temporel sont synchronisés entre graphiques; les quatre indicateurs sont recalculés sur la plage sélectionnée. La collecte et les commandes chaudière ne sont pas encore portées.
- La page Historique lit les synthèses mensuelles et saisonnières et le stock estimé en lecture seule. Les autres pages de la [cartographie](./archive/screenshot/cartographie.json) décrivent leur périmètre et leur indisponibilité, sans action métier. L'installation dispose aussi d'une page descriptive.
- Chaque page possède son propre dossier et son fichier `+page.svelte` dans [src/routes/](./src/routes/). Les URL et noms de dossiers sont en anglais (`/history`, `/login`, `/setup`, `/private/realtime/settings`, etc.), indépendamment de la langue de l'interface. Toutes les pages et actions privées sont regroupées sous [src/routes/private/](./src/routes/private/), avec des URL préfixées par `/private`. Aucune route générique ne remplace cette arborescence.
- `GET /api/v1/health` contrôle uniquement la vitalité HTTP; `database: "not-configured"` ne reflète pas la configuration ni la disponibilité MySQL.

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

Définir `APP_LANG=FR` ou `APP_LANG=EN` dans `.env` pour choisir la langue de l'interface et des messages applicatifs ; le français est utilisé si la variable est absente, et une valeur vide ou inconnue est signalée comme erreur. Redémarrer l'application après modification. La langue est commune à toute l'installation, sans sélection par utilisateur. Tous les textes de l'interface, y compris les titres et périmètres des pages, sont centralisés et typés dans [i18n.ts](./src/lib/i18n.ts). [navigation.ts](./src/lib/navigation.ts) contient uniquement les métadonnées de navigation et leurs clés de traduction ; les messages techniques sont dans [messages.ts](./src/lib/server/messages.ts). Les nombres sont formatés en `fr-FR` ou `en-GB` ; le fuseau des dates reste celui de l'installation. Pour les journaux applicatifs, utiliser [logger.ts](./src/lib/server/logger.ts) : leurs codes d'événement restent stables quelle que soit la langue. Les détails d'erreurs provenant de bibliothèques externes restent dans leur langue d'origine et ne sont pas exposés à l'utilisateur.

## Connexion à la base

Configurer un fichier privé `.env` à partir de [.env.remote.example](./.env.remote.example). `DB_ADRESSE` contient le nom DNS ou l'adresse IP et, facultativement, le port (`3306` par défaut) ; `DB_NAME`, `DB_USER` et `DB_PASSWORD` identifient la base et le compte. Utiliser un compte limité à la lecture. Ne pas partager ni versionner le fichier `.env`.

Créer un fichier privé `config.json` à la racine à partir de [config.example.json](./config.example.json). Renseigner `poidsPellet` avec le poids réel de granulés en grammes par minute de fonctionnement de la vis et `timezone` avec le fuseau IANA de l'installation. Pour la page Temps réel, `chaudiere` indique l'adresse IP ou le nom d'hôte de la chaudière, avec un port facultatif; remplacer impérativement l'adresse indicative de l'exemple. Les mesures sont lues au chargement de la page, sans actualisation périodique. Les identifiants de connexion à la chaudière restent dans les colonnes `login_boiler` et `pass_boiler` de la ligne `admin` de `oko_user`; le mot de passe est conservé dans son format historique Base64. L'application les lit sans les afficher ni les modifier. Pour le suivi du cendrier, renseigner aussi `ashtray` : quantité positive de granulés brûlés en kg correspondant à son remplissage. Pour l'historique, `surfaceMaison` est la surface positive en m², `hasSilo` vaut `1` pour un silo ou `0` pour les sacs, et `siloSize` indique la capacité positive du silo en kg. Ces champs sont facultatifs : sans eux les indicateurs correspondants restent indisponibles. Les autres champs sont ignorés. Ce fichier est ignoré par Git et n'est pas publié par l'application.

La configuration utilise exclusivement des clés camelCase : les clés historiques contenant `_` sont refusées, même si leurs équivalents camelCase sont également présents. Pour reprendre une configuration historique, travailler sur une copie et renommer `tc_ref` en `tcRef`, `poids_pellet` en `poidsPellet`, `surface_maison` en `surfaceMaison`, `get_data_from_chaudiere` en `getDataFromChaudiere`, `send_to_web` en `sendToWeb`, `has_silo` en `hasSilo` et `silo_size` en `siloSize`. Ne pas modifier le fichier utilisé par une installation PHP en service. Les tables, colonnes et types de capteurs historiques restent inchangés en base.

Le TLS vérifie par défaut le certificat et le nom du serveur. Si nécessaire, `DB_TLS_CA_FILE` indique un fichier PEM d'autorité de certification accessible au processus. `DB_TLS_MODE=disabled` désactive explicitement le chiffrement et la vérification : à réserver à un réseau de confiance lorsque le serveur ne propose pas TLS. Il n'y a jamais de repli automatique non chiffré.

```sh
npm run db:check
```

Cette commande charge `.env`, établit une connexion, exécute uniquement `SELECT 1` et la ferme. Le serveur charge également `.env` s'il existe, y compris si Vite est lancé directement ; les variables déjà présentes dans l'environnement ont priorité. À l'ouverture de l'accueil, l'application lit les capteurs et les relevés du jour sélectionné sans modifier la base. Le changement de date conserve l'URL de l'accueil. Une journée vide, un capteur absent ou une erreur de connexion ne sont pas présentés comme une valeur nulle.

La sélection d'une plage ou le déplacement avec Maj enfoncée applique les mêmes bornes temporelles à tous les graphiques. `GET /api/v1/indicators?jour=YYYY-MM-DD&min=…&max=…` recalcule les consommations totale/ECS et températures extrêmes pour cette journée et cet intervalle. Les bornes sont en millisecondes Unix, converties en secondes et inclusives comme dans le legacy. Les heures de début et de fin sont affichées au format `HH:mm` à côté du libellé de la plage, en UTC comme les axes des graphiques. Les interactions rapprochées sont regroupées et les anciennes requêtes annulées. Les valeurs sont signalées comme indisponibles pendant le recalcul ou en cas d'erreur, plutôt que conserver les totaux de journée comme s'ils décrivaient la sélection. Le bouton unique « Retirer le zoom » et le changement de date restaurent les indicateurs journaliers ; le bouton natif de Highcharts est masqué.

Le suivi du cendrier reprend la règle historique : somme de `oko_resume_day.conso_kg` pour les jours strictement postérieurs au dernier événement `ASHES` dans `oko_silo_events`, comparée à `ashtray`. Il ne dépend pas de la journée sélectionnée. Sans seuil, vidage ou consommation disponible, son état est signalé comme indisponible ; la saisie des événements n'est pas encore portée.

L'historique reprend les synthèses existantes de `oko_resume_day` : extrêmes, sommes de consommation, ECS, DJU et cycles sur les dates sélectionnées. La température moyenne est la moyenne des deux extrêmes, comme dans l'interface historique. Les graphiques et le récapitulatif s'appuient également sur `oko_dateref` et les bornes de `oko_saisons` ; les données du mois en cours sont exclues du graphique saisonnier comme dans le legacy, mais restent incluses dans les totaux et le tableau. Le ratio g/DJU/m² est indisponible sans surface positive ou avec un DJU nul. Le stock estimé reprend le dernier événement `PELLET` ou `BAG` et soustrait la consommation des jours strictement postérieurs ; sans remplissage ou consommation, il reste indisponible. Sa barre est bleue au-dessus de 50 %, orange de 25 à 50 % et rouge en dessous de 25 %, comme dans le legacy. Aucun calcul de synthèse ni événement n'est écrit en base.

La liste des années contient celles présentes dans les synthèses quotidiennes, et non les années futures du calendrier technique. Les flèches permettent de parcourir les mois tant que l'année cible est disponible ; les sélections sont appliquées immédiatement, ou avec le bouton « Afficher » lorsque JavaScript est désactivé.

Les sélections sont transmises par formulaire sans paramètres dans l'URL. Un rechargement de la page revient aux périodes par défaut ; les anciennes URL avec paramètres sont redirigées vers l'historique.

Pour faciliter les comparaisons, le graphique mensuel utilise des axes fixes : −10 à 50 °C, 0 à 80 pour les kg et DJU, et 0 à 60 cycles. Les maxima du graphique saisonnier sont fixés à 50 °C, 2 000 kg/DJU et 400 cycles. Les valeurs hors limites sont signalées ; elles ne sont pas entièrement visibles sur les graphiques.

### Organisation des accès aux données

[data-access.ts](./src/lib/server/data-access.ts) est le point de câblage serveur : `getDataAccess()` assemble les repositories au premier besoin puis réutilise cet assemblage et le pool partagé. Les routes utilisent `getDataAccess().measurements` ou `getDataAccess().maintenance`, sans importer le gestionnaire du pool. L'import du module ne crée pas de pool et l'assemblage n'exécute aucune requête.

Les [repositories](./src/lib/server/repositories/) regroupent les accès SQL par domaine et reçoivent leur client à leur création, limité aux méthodes nécessaires (`execute`, `query`). Ils ne récupèrent ni ne ferment le pool et laissent remonter les erreurs. Les tests injectent un faux client, sans connexion réelle. Une connexion dédiée peut également être injectée lorsqu'une opération l'exige ; cela ne rend pas les tables MyISAM transactionnelles.

Pour les prochains modules, ajouter les repositories et leur câblage au même endroit. Ajouter des services métier uniquement pour des règles ou coordinations concrètes, puis les partager entre routes, API et tâches planifiées sans dépendance au contexte HTTP. L'assemblage partagé ne doit conserver aucune donnée propre à une requête ou un utilisateur. Aucun ORM ni conteneur d'injection n'est nécessaire.

### Connexion membre

L'accès membre est placé à droite du bandeau. `/login` vérifie les comptes existants de `oko_user` en lecture seule, via le même câblage de repositories. Le compte MySQL doit pouvoir lire cette table. Aucun compte n'est créé et aucun mot de passe n'est modifié. La vérification reproduit le SHA-1 historique, y compris l'échappement PHP avant hachage : il s'agit d'une compatibilité transitoire, pas d'un format recommandé pour de nouveaux comptes.

Les menus privés ne sont affichés qu'après connexion ; le hook serveur protège chaque requête vers une route sous `/private`, y compris les navigations internes. Comme dans les menus historiques, tous les membres connectés y ont accès, sans nouveau modèle de rôles. La page « Mon compte » reste descriptive : le changement de mot de passe n'est pas porté.

La nouvelle application utilise une session indépendante de PHP, valable huit heures, stockée en mémoire serveur avec un cookie HttpOnly et SameSite=Lax (Secure en HTTPS). Le POST `/private/logout` révoque la session et supprime le cookie ; un GET ne déconnecte pas. Un redémarrage invalide les sessions. Rester sur un seul processus, sans réplica. Les réponses ne sont pas mises en cache. Les formulaires conservent la protection d'origine de SvelteKit.

La connexion est limitée à dix tentatives par adresse sur quinze minutes, réussies ou non. Les compteurs sont en mémoire et réinitialisés au redémarrage. Derrière un reverse proxy, configurer `ORIGIN` et l'adresse client selon la documentation d'`adapter-node` (`ADDRESS_HEADER` et `XFF_DEPTH` uniquement si le proxy de confiance remplace les en-têtes). Sans cette configuration, les clients peuvent partager la limite du proxy. Utiliser HTTPS en exploitation ; aucun identifiant, mot de passe ou jeton de session n'est journalisé.

## Docker

L'image multi-stage s'exécute sans root, avec un seul processus applicatif. Le contrôle de santé appelle `/api/v1/health`. Aucun SQL historique n'est exécuté au démarrage.

Les configurations Docker existantes ne montent pas encore le fichier `config.json` nécessaire aux indicateurs ; leur adaptation reste à faire.

### Application seule

```sh
cp .env.remote.example .env.remote
docker compose --env-file .env.remote -f compose.yaml up --build -d
```

Ce mode ne crée ni service ni volume DB. Renseigner les variables du modèle avant le démarrage. Pour tester la connexion depuis le conteneur :

```sh
docker compose --env-file .env.remote -f compose.yaml exec app node scripts/check-db.ts
```

Pour une CA privée, monter le fichier en lecture seule dans le conteneur via une configuration Compose complémentaire et définir `DB_TLS_CA_FILE` avec son chemin dans le conteneur. Le mot de passe distant passé par Compose est visible dans la configuration du conteneur ; protéger l'accès à Docker et au fichier d'environnement.

### Préparer une MariaDB locale isolée

```sh
cp .env.local.example .env.local
mkdir -p secrets
```

Créer deux fichiers privés distincts, `secrets/db-password.txt` et `secrets/db-root-password.txt`, contenant chacun un mot de passe fort, puis limiter leurs permissions (`chmod 600`). Ces fichiers sont ignorés par Git et exclus du contexte Docker.

```sh
docker compose --env-file .env.local -f compose.yaml -f compose.db.yaml up --build -d
```

Le complément ajoute MariaDB 11.4, son volume et son contrôle de santé, sans publier son port. L'image MariaDB provisionne seulement une base vide et un compte à la première création du volume; **aucune table métier n'est créée et les mesures ne sont pas encore raccordées**. Le contrôle ci-dessus s'exécute aussi avec `-f compose.yaml -f compose.db.yaml`. Le secret applicatif est monté dans le conteneur et lu via `DB_PASSWORD_FILE`, à la place de `DB_PASSWORD`. Ne pas monter les SQL destructifs de l'archive comme scripts d'initialisation. Une reprise des données devra être explicite, sur une copie isolée et sauvegardée.

Le port applicatif est lié à l'interface locale de l'hôte. En exploitation, placer un reverse proxy HTTPS devant le serveur et définir `ORIGIN` avec l'origine publique exacte. Ne pas activer plusieurs réplicas.

## Validation du socle

L'initialisation a été vérifiée avec Node.js 26.10.0 : contrôle de types sans erreur ni avertissement, lint, deux tests SSR et build `adapter-node` réussis. Le serveur a aussi été démarré depuis une copie du seul build avec `npm ci --omit=dev --ignore-scripts`, sans les sources ni l'archive.

Les contrôles HTTP confirment l'accueil, la feuille de style, la palette et le healthcheck, ainsi que l'absence d'accès public au PHP archivé. Le rendu navigateur a été vérifié en 1440 px et 375 px, sans débordement horizontal ni erreur JavaScript. Les 204 fichiers archivés sont identiques aux originaux; les liens documentaires et ancres de lignes ont été contrôlés.

Ces vérifications décrivent le socle initial, avant l'ajout du contrôle explicite de connexion à la base.

L'audit initial npm signale 14 alertes dans les dépendances de développement (4 faibles, 10 modérées, notamment `deepmerge` et `minimatch`); `npm audit --omit=dev` ne signale aucune vulnérabilité. Les dernières versions directes compatibles sont utilisées, sans rétrogradation forcée ni contournement des dépendances homologues. Réévaluer ces alertes lors des mises à jour des outils.

## Documentation et suite

- [Réorganisation et démarrage](./docs/reorganisation-depot-et-demarrage-sveltekit.md)
- [Architecture cible](./docs/architecture-cible-svelte-node.md)
- [Inventaire historique](./docs/inventaire-fonctionnel-actuel.md)
- [Analyse de faisabilité](./docs/analyse-technique-et-faisabilite-node-svelte.md)
- [Actions à faire](./docs/actions-a-faire.md)

La prochaine tranche concerne les séries journalières, le graphique et leurs tests de parité. Les bibliothèques métier seront ajoutées lors de leur portage, pas préinstallées sans usage.
