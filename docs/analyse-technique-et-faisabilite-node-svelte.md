# Analyse technique et faisabilité d'une migration vers Node.js et Svelte

## Synthèse et verdict provisoire

**Une migration complète PHP → Node.js et interface → Svelte est techniquement possible**, tout en conservant MySQL et la structure actuelle des données. Elle ne paraît toutefois ni sûre ni vérifiable comme réécriture « big bang » dans l'état actuel du projet : les règles métier sont dispersées dans des pages, des classes PHP, des scripts AJAX et des traitements cron, et le dépôt ne fournit pas de suite de tests permettant d'établir la parité.

La recommandation est de **ne pas commencer par réécrire l'application**. Il faut d'abord caractériser les contrats et les calculs existants, fermer les risques d'accès les plus sérieux, établir des tests de référence, puis migrer par domaines avec comparaison des résultats. Le modèle MySQL et les données existantes doivent rester inchangés durant cette étude et le premier portage.

Ce verdict est une étude de faisabilité statique, pas une certification : le code n'a pas été exécuté contre une base réelle, une chaudière ou un environnement de déploiement.

**Cadrage cible précisé depuis cette analyse** : l'[architecture cible](./architecture-cible-svelte-node.md) retient un seul projet SvelteKit sur Node.js, dans un seul conteneur applicatif incluant planification et traitements asynchrones, sans worker séparé. Elle prévoit des endpoints natifs sous `/api/v1` sans routes PHP de compatibilité, et Docker Compose avec MariaDB locale optionnelle ou MySQL/MariaDB distante. Les constats ci-dessous décrivent toujours l'existant; les clients API historiques devront être migrés vers les nouveaux contrats.

## Périmètre et méthode

L'analyse couvre les principaux points d'entrée et chemins applicatifs PHP, les classes de persistance et métier, les scripts front de première partie, les endpoints, l'installation, le cron, les mises à jour et le SQL d'installation. Les bibliothèques tierces embarquées et minifiées n'ont pas fait l'objet d'une revue ligne par ligne.

Les éléments ci-dessous sont des constats de code. Les conséquences dépendant de l'exposition réseau, de la configuration du serveur ou des usages réels sont signalées comme telles. Aucun test automatisé, environnement d'intégration ni donnée représentative n'a été trouvé ou utilisé dans cette analyse.

## Cartographie de l'application

| Domaine | Fonctionnement actuel | Enjeu pour le portage |
|---|---|---|
| Pages | Les pages PHP composent le HTML et incluent leurs scripts propres. Le tableau de bord, l'historique et le temps réel sont des surfaces distinctes. [index.php](../index.php#L8-L44), [histo.php](../histo.php#L1-L14), [rt.php](../rt.php#L1-L15) | Refaire les layouts, formulaires, navigation, état, chargement et erreurs dans Svelte. |
| Frontend | jQuery et Bootstrap manipulent le DOM; Highstock/Highcharts dessinent les séries; des fichiers JS de langue complètent les dictionnaires PHP/JSON. [footer.php](../_templates/footer.php#L6-L13), [index.js](../js/index.js#L1-L25), [custom.js](../js/custom.js#L61-L86) | Décider comment remplacer les widgets et graphiques et réunifier les contrats de traduction. |
| API internes | `ajax.php` route des actions par `type`/`action`; `$.api` ajoute le `sid`, sérialise les paramètres et centralise une partie de la gestion d'erreur. [ajax.php](../ajax.php#L8-L38), [custom.js](../js/custom.js#L61-L86) | Documenter toutes les actions, paramètres, méthodes, formes JSON et erreurs avant de remplacer les appels. |
| API distincte | `api.php` expose un autre routeur à jeton, décrit dans `api-doc.md`, pour des consommateurs tiers. [api.php](../api.php#L8-L42), [api-doc.md](../api-doc.md#L1-L68) | Maintenir une compatibilité ou prévoir une version, une période de coexistence et une politique d'arrêt. |
| Métier et persistance | Les classes `administration`, `rendu`, `gstGraphique`, `realTime`, `okofen` et `capteur` combinent accès aux données et opérations métier. [administration.class.php](../_include/administration.class.php#L1-L20), [rendu.class.php](../_include/rendu.class.php#L1-L20), [realTime.class.php](../_include/realTime.class.php#L1-L20) | Extraire les règles et leurs entrées/sorties sans changer les résultats observables. |
| Données et imports | L'installateur crée le schéma; les colonnes `col_n` de la table historique dépendent de la matrice de capteurs. Les imports CSV alimentent l'historique et les synthèses journalières. [install.sql](../install/install.sql#L68-L117), [administration.class.php](../_include/administration.class.php#L800-L840), [okofen.class.php](../_include/okofen.class.php#L96-L153) | Préserver le schéma, l'ordre des capteurs, la conversion des valeurs, l'idempotence et les calculs de synthèse. |
| Échanges et opérations | Le code dialogue avec la chaudière par HTTP, lit des fichiers CSV, gère des identifiants chaudière, exécute un cron et sait s'auto-mettre à jour. [cron.php](../cron.php#L8-L27), [okofen.class.php](../_include/okofen.class.php#L16-L40), [AutoUpdate.class.php](../_include/AutoUpdate.class.php#L70-L90) | Remplacer aussi ces tâches, leurs secrets, fichiers temporaires et opérations de déploiement; ce n'est pas qu'un portage d'interface. |

## Faiblesses et risques constatés

Priorité : **P0** = risque de sécurité ou de perte de données à traiter avant exposition; **P1** = risque important pour la sûreté ou la parité; **P2** = dette et fiabilité à intégrer au plan. La priorité indique le risque du code si les routes sont accessibles comme prévu, pas une preuve d'incident en production.

| Priorité | Constat et preuve | Conséquence / portée |
|---|---|---|
| **P0 — critique si `setup.php` est accessible en HTTP** | Le flux `type=install` est déclenché par une requête XHR sans vérification visible d'une installation déjà effectuée ni authentification applicative. Il exécute le SQL d'installation et écrit les fichiers de configuration. Le SQL commence par supprimer les tables existantes. [setup.php](../setup.php#L34-L111), [install.sql](../install/install.sql#L1-L8) | Une installation ré-exécutée peut détruire les données existantes. La protection serveur n'a pas été vérifiée. Le nouvel installateur devra être verrouillé après usage et conçu pour ne jamais réinitialiser une base existante sans sauvegarde et confirmation explicite. |
| **P0/P1 — autorisations d'actions incohérentes** | Le template refuse certaines pages aux utilisateurs non connectés, mais `ajax.php` vérifie le marqueur XHR et l'égalité du `sid`, puis note explicitement que le contrôle des droits reste à ajouter. Le `sid` est généré dans toute session et injecté dans la page. [header.php](../_templates/header.php#L1-L20), [ajax.php](../ajax.php#L8-L27), [session.class.php](../_include/session.class.php#L9-L23) | Le contrôle d'accès des pages ne protège pas en soi les actions serveur. Si l'endpoint est accessible, des actions d'administration peuvent ne pas être réservées à un utilisateur authentifié. Le routeur Node doit appliquer une autorisation par action, indépendamment de l'interface. |
| **P1 — upload insuffisamment borné** | L'action `uploadCsv` est routée par `ajax.php`; le gestionnaire accepte par défaut tout nom de fichier et ne fixe pas de taille ni de nombre maximum. [ajax.php](../ajax.php#L48-L56), [UploadHandler.class.php](../_include/UploadHandler.class.php#L84-L101) | Risques de téléversement non prévu, saturation disque ou traitement d'entrées malformées, renforcés par le contrôle d'accès AJAX ci-dessus. Valider le contenu CSV, le nom, la taille et l'autorisation avant toute écriture/import. |
| **P1 — API externe à authentification statique** | `api.php` ne demande qu'un préfixe de 12 caractères du jeton global et comporte le même TODO d'autorisation par action. L'installateur crée ce jeton par `sha1(rand())`. [api.php](../api.php#L14-L37), [setup.php](../setup.php#L82-L87) | Le modèle de secret et de permissions est fragile pour un endpoint prévu pour des consommateurs tiers. Il faut recenser les clients, les droits et les appels réels avant de renouveler le mécanisme; une rotation peut casser l'intégration. |
| **P1 — stockage des mots de passe dépassé** | Les mots de passe utilisateurs sont calculés par SHA-1 sans sel dans `login` et `changePassword`; le SQL d'installation contient un hash initial fixe et des identifiants chaudière encodés en Base64, qui n'est pas un chiffrement. [administration.class.php](../_include/administration.class.php#L703-L760), [install.sql](../install/install.sql#L47-L59), [okofen.class.php](../_include/okofen.class.php#L345-L374) | Faible résistance à la compromission des empreintes et secret chaudière récupérable. Prévoir un format de hash moderne avec migration transparente à la connexion, rotation des secrets chaudière et nettoyage des installations déjà déployées. |
| **P1 — SQL concaténé et JSON construit à la main** | Plusieurs requêtes interpolent des valeurs dans le SQL (par exemple les graphes); certains résultats sont également assemblés en chaînes JSON incluant des noms de capteurs. [gstGraphique.class.php](../_include/gstGraphique.class.php#L53-L116), [rendu.class.php](../_include/rendu.class.php#L9-L51), [administration.class.php](../_include/administration.class.php#L402-L455) | Risque d'injection ou de réponses JSON invalides selon les valeurs. L'étendue exploitable doit être vérifiée action par action; côté Node, utiliser des requêtes préparées, validation stricte et sérialisation JSON native partout. |
| **P1 — schéma fragile et sans transactions** | Les tables utilisent MyISAM; la table d'association capteur/graphe ne définit ni clé primaire ni contrainte d'unicité. L'import fait une requête par ligne et utilise `INSERT IGNORE`; la structure historique est modifiée par `ALTER TABLE` lors de la matrice. [install.sql](../install/install.sql#L68-L117), [okofen.class.php](../_include/okofen.class.php#L96-L153), [administration.class.php](../_include/administration.class.php#L800-L840) | Absence de garanties transactionnelles/référentielles et risque de divergence en cas d'échec au milieu d'un import ou d'une mise à jour de matrice. Même en conservant le schéma, le portage doit détecter les doublons, les écritures partielles et les collisions de traitements. |
| **P1 — contrats de réponse hétérogènes** | L'API renvoie selon les actions des objets JSON, des tableaux ou des chaînes assemblées manuellement; les noms de propriétés varient selon les domaines. [rendu.class.php](../_include/rendu.class.php#L9-L51), [api.php](../api.php#L35-L160), [custom.js](../js/custom.js#L61-L86) | Une nouvelle API « nettoyée » casserait les scripts et clients existants. Établir des fixtures métier, documenter la correspondance vers les endpoints natifs SvelteKit et migrer les clients avant bascule, sans conserver les URLs PHP. |
| **P2 — gestion d'erreurs trop permissive** | Les appels DB, fichiers, téléchargements et requêtes chaudière n'ont pas partout des résultats contrôlés; l'installation parcourt les résultats de `multi_query` sans remonter clairement l'erreur d'une instruction. [connectDb.class.php](../_include/connectDb.class.php#L83-L99), [setup.php](../setup.php#L48-L75), [okofen.class.php](../_include/okofen.class.php#L96-L153) | Des traitements peuvent laisser des données partielles ou une configuration incomplète sans erreur exploitable côté utilisateur. Le backend Node doit distinguer validation, erreur d'intégration, erreur DB et reprise possible, avec logs sans secrets. |
| **P2 — couplage et performance** | Les mêmes classes mélangent routes, SQL, calculs et sérialisation. Les graphes exécutent des requêtes par capteur; le temps réel lance une interrogation toutes les trois secondes. [rendu.class.php](../_include/rendu.class.php#L9-L51), [rt.js](../js/rt.js#L145-L173) | Maintenance et tests ciblés difficiles; sur réseau lent, les requêtes de polling peuvent se chevaucher. Mesurer les latences et le volume réel; éviter de déplacer ce couplage tel quel dans Node. |
| **P2 — base de validation et livraison absente** | Aucun `package.json`, `composer.json`, configuration PHPUnit ou suite de tests n'a été repéré; les dépendances front sont servies depuis `js/` sans chaîne de build identifiée. L'historique documente une compatibilité PHP 5.6 / 7.2, mais ne fixe pas le runtime actuellement utilisé. [changelog.md](../changelog.md#L45-L60), [footer.php](../_templates/footer.php#L6-L13) | Pas de filet de sécurité pour une réécriture et pas de preuve de compatibilité moderne. Avant le portage, définir les versions supportées, la CI, les outils de dépendances, les scans de dépendances et la procédure de livraison. |

## Contraintes fonctionnelles à préserver

1. **Données** : conserver MySQL, les tables et les colonnes actuelles, y compris les colonnes historiques `col_n` déterminées par la matrice; aucune conversion de moteur ou migration destructive n'est implicite dans ce plan.
2. **CSV** : documenter les dialectes/firmwares, les positions de colonnes, l'arrondi à la minute, les marqueurs de cycle, les imports USB et chaudière, les réimports et le recalcul des journées.
3. **Calculs** : comparer les consommations chauffage/ECS, températures min/max, DJU, cycles, synthèses journalières/mensuelles/saisonnières et effets des corrections de capteurs.
4. **Temps** : préserver dates métier, fuseau configuré, timestamps UTC, conversions millisecondes pour les graphiques et cas de changement d'heure.
5. **Échanges** : garder les fonctions temps réel et commandes chaudière, le stockage des configurations, les intégrations tierces et les éventuels usages de `api.php`.
6. **Opérations** : remplacer explicitement `cron.php`, le setup PHP, l'auto-update, les répertoires `_tmp`/`_logs` et la configuration secrète. Les traitements de fond ne doivent pas être exécutés deux fois pendant la coexistence.
7. **Interface** : inventorier les pages d'administration, traductions, graphiques synchronisés, filtres temporels, uploads et messages d'erreur, pas seulement la page d'accueil.

## Faisabilité de la cible Node.js + Svelte

La séparation logique est possible, mais elle n'est pas encore matérialisée : les règles métier et la persistence sont étroitement couplées aux classes PHP et à leurs routes. La priorité est de rendre les comportements observables et testables avant de les transcrire.

Le choix cible est désormais un seul projet SvelteKit avec `adapter-node`, dans un seul processus Node et un seul conteneur applicatif. La planification et l'exécution des tâches sont des modules serveur intégrés, sans worker, service ni build séparés. Docker Compose fournit un socle `app` seul pour le raccordement distant et un complément ajoutant MariaDB pour le mode local. L'hôte doit donc supporter ce déploiement, ses volumes et ses accès réseau, plutôt qu'un simple hébergement PHP. Le détail des fichiers Compose à réaliser et des variables de connexion figure dans l'[architecture cible](./architecture-cible-svelte-node.md#9-conteneurs-docker-compose-et-exploitation).

**Verdict : faisable sous conditions, confiance moyenne.** Les inconnues majeures sont l'accès réel aux installations, les versions de PHP/MySQL effectivement supportées, les consommateurs de l'API distincte, les formats CSV rencontrés, les volumes et l'hébergement Node. Le facteur de risque principal n'est pas Svelte : c'est l'absence de tests de référence pour une logique métier sensible aux données, aux dates et aux échanges chaudière.

## Plan de faisabilité et de migration

### Étape 0 — Conditions de sécurité et d'exploitation

- Confirmer les sites accessibles (pages, `ajax.php`, `api.php`, `setup.php`, `cron.php`) et les protections du serveur.
- Fermer ou isoler les routes d'installation/update et établir une sauvegarde/restauration vérifiée avant tout autre essai.
- Inventorier versions de PHP, MySQL/MariaDB, système, serveur web, ordonnanceur, espace disque, règles réseau vers chaudière et possibilité de faire tourner un service Node.
- Décider qui gère les secrets, les journaux, les fichiers temporaires, les mises à jour et la surveillance.

**Porte A —** aucun test destructif ou portage de données avant une sauvegarde restaurable et un environnement de test isolé.

### Étape 1 — Cartographie contractuelle et références

- Lister chaque page, action de `ajax.php`, action de `api.php`, paramètres, méthodes, authentification, réponse et effets de bord.
- Identifier les clients externes de `api.php` et les consommateurs éventuels des formulaires d'import.
- Créer des jeux de données représentatifs anonymisés couvrant plusieurs matrices/firmwares, journée partielle/complète, réimport, trous de données et changements d'heure.
- Enregistrer des réponses de référence et formaliser les calculs métier, les règles de validation et les codes d'erreur.

**Porte B —** chaque parcours important a un contrat ou un test de caractérisation; une liste de compatibilité API est approuvée.

### Étape 2 — Socle Node et parité DB/API

- Créer le projet SvelteKit unique, isolé de l'installation PHP, avec configuration serveur validée au démarrage, logs, gestion d'erreurs, tests et accès MySQL par requêtes préparées.
- Lire/écrire d'abord sur une copie de la base; garder tables, colonnes et types inchangés.
- Porter par domaines, dans l'ordre choisi après inventaire : authentification/permissions, configuration, événements et graphes, rendus/calculs, imports, temps réel et intégrations.
- Exposer les ressources par les endpoints natifs SvelteKit; documenter le passage des anciennes actions aux nouvelles méthodes/URLs et migrer les clients externes avant bascule, sans adaptateurs de routes PHP.

**Porte C —** résultats Node équivalents aux fixtures PHP et pas de divergence d'écriture sur les tables existantes.

### Étape 3 — Remplacement progressif de l'interface

- Migrer une page à la fois vers Svelte, en réutilisant le service Node et les contrats stabilisés.
- Valider graphes, zoom, navigation dans les dates, traduction, tableaux, flux d'upload et erreurs sur navigateurs cibles.
- Remplacer jQuery/Bootstrap progressivement; confirmer l'API et les conditions de licence des bibliothèques de graphiques avant de les embarquer.

**Porte D —** aucun parcours fonctionnel ni contrat externe requis n'a régressé; mesure de performance sur données proches de la production.

### Étape 4 — Tâches d'arrière-plan et exploitation

- Porter import périodique, synthèses et accès chaudière vers des modules serveur du même projet SvelteKit, avec demandes/progression persistées, reprise, limites de durée et verrouillage anti-chevauchement.
- Initialiser le planificateur une seule fois au démarrage du serveur, hors build/prerender et requêtes HTTP; traiter les tâches indépendamment des requêtes, sans processus séparé. Prévoir arrêt gracieux, streaming et lots bornés pour préserver la boucle événementielle et mesurer la latence HTTP pendant les imports.
- Remplacer l'installation destructive par des migrations versionnées et non destructives, une procédure de sauvegarde et une configuration par secrets.
- Remplacer l'auto-update par un déploiement reproductible, contrôlé et réversible.
- Exécuter les deux implémentations en mode comparaison/lecture seule lorsque possible; n'autoriser qu'un seul écrivain pour les imports et synthèses.

### Étape 5 — Décision de bascule et retour arrière

**GO** seulement si :

- la restauration de sauvegarde est démontrée et MySQL reste conforme au schéma existant;
- les calculs et réponses sont équivalents sur données historiques et cas limites, sans perte ni duplication d'import;
- les rôles, permissions, sessions, CSRF, uploads, validation et stockage des secrets ont des tests dédiés;
- chaque API tierce à maintenir a été identifiée et validée avec son client;
- le conteneur applicatif unique avec ses tâches intégrées, Docker Compose en modes base locale et distante, les logs, mises à jour, surveillance et retour à PHP sont validés et documentés;
- l'initialisation unique du planificateur, la reprise après interruption et la réactivité HTTP pendant les traitements sont démontrées avec une seule instance applicative;
- les seuils de performance/fiabilité sont définis puis mesurés sur une base représentative.

**NO-GO / report** si l'hébergement ne permet pas de maintenir Node, si l'équivalence des calculs/imports n'est pas démontrée, si des consommateurs externes restent inconnus ou si une restauration fiable n'est pas disponible. Dans ce cas, l'amélioration de sécurité et la mise en place de tests peuvent se faire sans migration complète.

## Questions à lever avant estimation ou lancement

- Quel est l'environnement de production réel et accepte-t-il un conteneur SvelteKit permanent avec planificateur intégré, ses volumes et une procédure de remplacement sans instances concurrentes?
- Combien d'installations et de clients utilisent l'API documentée? Existe-t-il des clients non recensés?
- Quels firmwares et variantes CSV sont utilisés, et quels volumes/durées couvre la table `oko_historique_full`?
- Quels tests de référence ou sauvegardes anonymisées sont disponibles? Peut-on accéder à une chaudière de test?
- Les traductions, la licence des bibliothèques graphiques et les compatibilités navigateurs sont-elles toujours requises?
- La migration doit-elle être déployée par installation ou peut-elle s'appuyer sur un serveur central?

## Références principales

- Entrées : [ajax.php](../ajax.php), [api.php](../api.php), [setup.php](../setup.php), [cron.php](../cron.php).
- Frontend : [index.php](../index.php), [histo.php](../histo.php), [rt.php](../rt.php), [custom.js](../js/custom.js), [index.js](../js/index.js), [rt.js](../js/rt.js).
- Métier : [administration.class.php](../_include/administration.class.php), [rendu.class.php](../_include/rendu.class.php), [gstGraphique.class.php](../_include/gstGraphique.class.php), [realTime.class.php](../_include/realTime.class.php), [okofen.class.php](../_include/okofen.class.php).
- Données et installation : [install.sql](../install/install.sql), [config_sample.php](../config_sample.php), [api-doc.md](../api-doc.md), [changelog.md](../changelog.md).
