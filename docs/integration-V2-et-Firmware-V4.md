# Plan d'intégration des évolutions V2 et du firmware V4

**État du plan :** proposition à exécuter par étapes, sans modification de
l'installation PHP en service.

Ce document transforme les évolutions décrites dans le dépôt
[`nicouchot/okovision-ha-api`](https://github.com/nicouchot/okovision-ha-api)
en un plan de portage vers l'application Node/SvelteKit de ce dépôt. Il compare
le fork au PHP historique archivé et aux fonctions Node déjà présentes. Il ne
vaut ni validation de compatibilité avec une chaudière réelle ni autorisation
de modifier une base en service.

Le code distant a été consulté sur `master`, commit
[`9d871c7`](https://github.com/nicouchot/okovision-ha-api/tree/9d871c7afc3a91afffc5af0bd5b02d23435b475d).
Les contenus de ce plan décrivent cette révision; une PR n'est pas nécessaire
pour réaliser cette comparaison. Si une PR précise doit être intégrée ensuite,
son numéro permettra de figer les changements et commentaires à prendre en
compte.

## 1. Résultat de la comparaison

Dans ce document, « évolutions V2 » désigne les fonctions ajoutées par le fork
(énergie, cumulatifs, prix et API Home Assistant), et non une version du
firmware. Le README cible principalement le **firmware V4.00b**.

| Domaine | Fork `okovision-ha-api` | Legacy archivé | Application Node actuelle | Décision de portage |
|---|---|---|---|---|
| Import historique | Télécharge `log0`, le passe par `csv2bdd()`, complète avec `/all?` et retente si la veille semble incomplète. Le README décrit `log0` tantôt comme le fichier de la veille, tantôt comme une fenêtre glissante de 24 h. | [`okofen.class.php`](../archive/php/_include/okofen.class.php) importe les CSV `touch_YYYYMMDD.csv`, mappe les positions CSV aux capteurs et arrondit l'heure à la minute. | [`boiler-import.ts`](../src/lib/server/boiler-import.ts), [`repositories/boiler-import.ts`](../src/lib/server/repositories/boiler-import.ts) et [`collection.ts`](../src/lib/server/collection.ts) importent les CSV V2/V3, avec validation, mapping en base, verrou et dédoublonnage. | Garder le connecteur CSV existant. Ajouter un connecteur V4 distinct, puis normaliser les données validées vers le modèle métier existant; ne pas transformer une réponse V4 en CSV positionnel synthétique. |
| Mesures instantanées | `/all?` est converti en ligne CSV à positions fixes; plusieurs champs absents sont remplacés par zéro. | Le temps réel historique (`rt.php`, `js/rt.js`, `realTime.class.php`) utilise l'interface HTTP avec session/cookies et ne fournit pas l'API JSON V4. | [`boiler.ts`](../src/lib/server/boiler.ts) utilise encore le protocole HTTP de session legacy et normalise les indicateurs de circuit. | Implémenter séparément le transport JSON V4 et son adaptateur de capteurs. Ne pas traiter une mesure absente comme une mesure nulle; préserver le chemin temps réel legacy tant que V4 n'est pas validé. |
| Synthèses et énergie | Ajoute `conso_kwh`, avec `conso_kg × PCI × rendement`, et recalcule les synthèses. | [`rendu.class.php`](../archive/php/_include/rendu.class.php) calcule consommation kg, ECS, températures, DJU et cycles; [`okofen.class.php`](../archive/php/_include/okofen.class.php) écrit ces indicateurs dans la synthèse. | [`indicators/daily.ts`](../src/lib/indicators/daily.ts), [`repositories/measurements.ts`](../src/lib/server/repositories/measurements.ts) et [`repositories/daily-summary.ts`](../src/lib/server/repositories/daily-summary.ts) reprennent les calculs historiques mais ne stockent pas les colonnes kWh/cumul/prix du fork. | Ajouter les calculs énergétiques comme évolution métier distincte, avec paramètres configurés et migration Knex non destructive. Comparer les résultats aux références PHP avant affichage. |
| Cumulatifs et coûts | Ajoute cumuls kg/kWh/cycles et prix FIFO à partir des événements `PELLET`; le README mentionne aussi le coût cumulé. | Les événements existent dans `oko_silo_events`; les synthèses historiques ne portent pas ces nouvelles colonnes. | Les événements et vues silo/cendrier sont déjà portés, mais pas les agrégats énergétiques et les prix FIFO. | Réutiliser les événements et les synthèses existants. Définir les règles de cumul, la gestion des jours manquants et des livraisons avant de persister ces valeurs. |
| API Home Assistant | Ajoute `ha_api.php`, avec actions `today`, `daily`, `monthly`, `status` et, dans le code, `live`. | [`api.php`](../archive/php/api.php) est une API legacy distincte à jeton; elle ne représente pas ce nouveau contrat. | Les endpoints `/api/v1` sont natifs SvelteKit; [`api/v1/indicators`](../src/routes/api/v1/indicators/+server.ts) sert les indicateurs et [`api/v1/chaudiere/indicateurs`](../src/routes/api/v1/chaudiere/indicateurs/+server.ts) exige actuellement une session membre. | Définir une API externe en lecture seule et versionnée, avec contrat stable et authentification dédiée. Ne pas exposer les routes PHP ni supposer qu'une session navigateur convient à Home Assistant. |
| Paramètres | Le fork stocke port/mot de passe JSON chaudière, PCI, rendement et token dans `config.json`/constantes PHP. | La configuration chaudière historique et ses identifiants sont répartis entre `config.json`, les paramètres et le compte admin. | La configuration métier est dans `oko_configuration`; les identifiants legacy de chaudière sont lus par le repository des utilisateurs. | Définir l'emplacement privé de chaque valeur et ses droits avant toute collecte. Aucun secret dans le code, les fixtures, les logs ou les paramètres d'URL. |

### Détection proposée du mode d'acquisition dans le setup

Le setup actuel ne détecte pas le firmware : le bouton « Tester » vérifie depuis
le navigateur si `/logfiles/pelletronic/` répond, avec `no-cors`. La réponse est
opaque; le test confirme tout au plus que le chemin CSV est joignable, pas
qu'il s'agit de V2 ou V3 et encore moins la version exacte. Le connecteur temps
réel sait déjà demander `CAPPL:LOCAL.touch[0].version`, mais cette lecture passe
par l'interface legacy authentifiée; elle n'est pas faite par le test du setup.
Le README du fork choisit le mode API JSON V4 par configuration et ne garantit
pas une détection automatique.

Le comportement cible est donc une **suggestion de mode**, pas une décision
irrévocable :

1. Après saisie de l'hôte, le test serveur effectue uniquement des lectures
   bornées vers les endpoints chaudière attendus. Il ne doit pas devenir un
   proxy HTTP arbitraire : valider l'hôte et le port, refuser les redirections,
   limiter les destinations aux paramètres testés et ne pas journaliser les
   identifiants.
2. Pour V2/V3, la disponibilité du répertoire CSV peut suggérer « CSV
   (V2/V3) », mais ne doit pas prétendre identifier la version exacte. Si un
   nom/version est affiché par une autre lecture authentifiée, ne l'associer à
   une version qu'après validation de cette correspondance.
3. Pour V4, une détection du mode JSON exige le port et le secret JSON ainsi
   qu'une réponse reconnue et validée. N'effectuer qu'une requête de test,
   respecter le délai/rate-limit caractérisé et ne pas déduire une version
   précise si la réponse n'expose pas un champ de version dont le sens est
   vérifié.
4. Afficher la proposition dans une liste déroulante explicite, par exemple
   « CSV V2/V3 », « API JSON V4 » et « Détection impossible — choisir ».
   L'administrateur peut la modifier; en cas d'échec, de valeur inconnue ou
   d'informations d'accès manquantes, ne pas sélectionner automatiquement V4.
5. Persister le mode choisi avec la configuration du setup, après confirmation.
   Le mode pilote le connecteur d'import; il ne change pas implicitement de
   protocole au premier échec réseau.

Si les identifiants nécessaires ne sont pas encore configurés, le setup doit
indiquer que la détection est partielle et laisser le choix manuel. Le test et
les tests automatisés restent sans commande chaudière; les probes réseau de
tests utilisent `fetch` simulé.

### Éléments à ne pas recopier tels quels

- Le fork est une modification PHP du legacy, pas un adaptateur Node prêt à
  intégrer. `cron.php` écrit directement et orchestre téléchargement, import,
  synthèse et fallback mail; le nouvel ordonnanceur et les jobs Node existent
  déjà et doivent rester le point d'entrée.
- `storeLiveSnapshot()` dans le fork fabrique une ligne selon un ordre de
  colonnes figé et fournit des zéros à plusieurs champs non exposés. Cette
  conversion peut créer des mesures plausibles mais inconnues et ne couvre pas
  les circuits/configurations de façon générique.
- Le README signale un refus des requêtes espacées de moins de 2 500 ms, tandis
  que `cron.php` attend 2 secondes entre certains appels. La fréquence et la
  réponse au rate-limit doivent être mesurées/caractérisées; ne pas reprendre
  ce délai contradictoire comme garantie.
- `log0` est décrit différemment selon les sections du README et le code du
  fork recalcule à la fois hier et aujourd'hui. La signification exacte, les
  bornes temporelles et la complétude doivent être établies sur des réponses
  anonymisées avant de fixer le comportement Node.
- Les scripts `migrate_conso_kwh.php` et `migrate_v2.php` sont des exemples de
  changements de schéma/calculs, pas une procédure à exécuter ici. Ne pas les
  lancer sur une base en service ni recopier leurs migrations navigateur/DDL
  telles quelles; utiliser des migrations Knex versionnées, revues et testées
  sur une base jetable puis une copie isolée sauvegardée.
- Le token Home Assistant du README est transmis dans la query string et
  tronqué à 12 caractères. Ne pas reprendre ce mécanisme : les URL peuvent être
  conservées dans des journaux, historiques et outils intermédiaires.
- Les correctifs PHP 8.2 du fork concernent les accès `$_POST` de PHP; ils ne
  sont pas à porter dans Node. Toute validation équivalente doit suivre les
  schémas/contrats TypeScript et les contrôles de requête déjà utilisés.
- Les fichiers du fork comportent un avis « Utilisation commerciale interdite
  sans mon accord »; aucun fichier de licence n'apparaît à la racine consultée.
  Avant toute reprise de code, clarifier les droits avec les auteurs. Le présent
  plan décrit les comportements et une stratégie de réimplémentation, pas une
  autorisation de copier le code.

## 2. Ordre d'exécution proposé

Chaque étape ci-dessous peut être demandée séparément. Ne pas commencer la
suivante avant d'avoir satisfait ses critères de sortie. Les tests de données
et de migration se font sur des fixtures ou bases jetables; toute comparaison
à une installation existante se fait sur une copie sauvegardée et isolée.

### Étape 0 — Cadrer les variantes et les décisions métier

**But :** fixer ce qui sera réellement livré, sans modifier le code métier ni
la base.

- Distinguer les firmwares V2/V3 (CSV actuels) et V4 (API JSON), et préciser
  quelles variantes V4 sont visées; V4.00b seul ne démontre pas la compatibilité
  des autres versions.
- Décider si le périmètre comprend toutes les nouveautés du README ou seulement
  le support V4. Traiter séparément : énergie/cumul/prix, instantanés temps
  réel, et API Home Assistant.
- Établir les besoins matériels et leurs propriétaires : port/secret JSON,
  fréquence de collecte, circuits à supporter, fuseau, limites réseau et
  politique de rétention.
- Décider le niveau de détection attendu dans `/setup` : mode CSV V2/V3 ou API
  JSON V4, version exacte si elle est réellement identifiable, et possibilité
  de sélection manuelle en cas d'incertitude. Déterminer à quel moment les
  identifiants legacy ou JSON sont disponibles pour le test.
- Vérifier les droits d'utilisation du code du fork avant toute copie ou
  adaptation; en attendant, s'appuyer sur le contrat fonctionnel documenté et
  réimplémenter selon les conventions de ce dépôt.
- Définir l'usage Home Assistant et ses données nécessaires; fixer la
  signification attendue de `today`, la politique de jours incomplets et les
  valeurs absentes.
- Confirmer que le premier raccordement restera strictement en lecture seule.
  Les écritures/réglages chaudière sont hors de ce plan.

**Critères de sortie :** matrice versions/fonctions approuvée; source et
destination des secrets définies; aucun besoin n'implique de commande chaudière.

**Demande à envoyer :**

> Réalise uniquement l'étape 0 du fichier
> `docs/integration-V2-et-Firmware-V4.md`. Examine le dépôt sans modifier le
> schéma, les paramètres ou le code. Propose la matrice de compatibilité V2/V3/V4,
> les variantes à prendre en charge et les décisions métier ouvertes pour
> l'API Home Assistant et les calculs énergie/coût. Termine par les critères
> d'acceptation à faire valider avant l'étape 1.

### Étape 1 — Constituer les références et caractériser V4 hors chaudière

**But :** produire des preuves de format et de calcul, sans réseau vers une
chaudière réelle.

- Obtenir des exemples anonymisés de CSV V2/V3 et de réponses JSON V4 pour
  `log0` et `/all?`; supprimer adresses, mots de passe, identifiants et données
  qui peuvent identifier une installation.
- Documenter version, encodage, structure, clés, unités, facteurs d'échelle,
  états énumérés, valeurs sentinelles, champs optionnels, circuits et bornes de
  date. Distinguer zéro, absence et invalidité.
- Caractériser `log0` : intervalle couvert, jour(s) inclus, présence des heures
  locales/UTC, ordre et doublons, marqueur de fin, comportement à minuit et
  fichier partiel.
- Caractériser `/all?` : réponse valide, erreur de fréquence, timeout, champs
  absents et fréquence minimale réellement tolérée. Ne pas effectuer de
  balayage ni multiplier les requêtes à une chaudière.
- Créer des fixtures sans secret dans l'arborescence de tests; comparer les
  valeurs normalisées aux mesures CSV correspondantes lorsqu'une paire de
  référence existe.

**Critères de sortie :** jeux anonymisés versionnés et testables; contrat de
normalisation documenté; incertitudes de `log0` et de fréquence résolues, ou
explicitement bloquantes.

**Demande à envoyer :**

> Réalise l'étape 1 du plan V2/V4. Ne contacte aucune chaudière et n'utilise
> aucune base réelle. À partir des seuls exemples anonymisés fournis, caractérise
> `log0` et `/all?`, constitue des fixtures et des tests de parsing couvrant
> unités, facteurs d'échelle, null/zéro, circuits, dates, doublons et réponses
> invalides. N'implémente pas encore l'acquisition ni l'import.

### Étape 2 — Ajouter l'adaptateur JSON V4 en lecture seule

**But :** séparer transport, validation et normalisation, sans perturber le
connecteur CSV, et permettre au setup de proposer un mode d'acquisition.

- Ajouter un connecteur serveur V4 distinct du code de
  [`boiler-import.ts`](../src/lib/server/boiler-import.ts) et du protocole de
  [`boiler.ts`](../src/lib/server/boiler.ts).
- Valider strictement la forme JSON, les types, les clés reconnues, les dates,
  les valeurs numériques finies et les erreurs HTTP. Préserver les absences
  comme données absentes; ne pas inventer de valeurs.
- Normaliser les signaux V4 vers des objets métier typés puis les associer aux
  capteurs configurés. Ne pas coder en dur une ligne de 50 colonnes ni réutiliser
  les positions de matrice du fork.
- Utiliser des délais bornés, un nombre limité de tentatives, une attente
  compatible avec la limite caractérisée et des erreurs distinctes. Ne jamais
  journaliser le secret ou le corps complet d'une réponse sensible.
- Ajouter un paramètre de mode d'acquisition explicite qui conserve le mode CSV
  V2/V3. Le choix du mode doit être visible et validé; ne pas basculer
  automatiquement vers V4 à partir d'une erreur CSV.
- Remplacer/compléter le test navigateur de `/setup` par un résultat typé
  obtenu côté serveur : joignabilité CSV, réponse V4 reconnue, version
  textuelle vérifiée si disponible, ou détection indéterminée. Le test
  `no-cors` actuel ne peut pas lire le contenu.
- Afficher ce résultat comme présélection modifiable dans une liste, enregistrer
  le mode seulement après confirmation et conserver le choix manuel lorsque
  les identifiants nécessaires sont absents. Restreindre les requêtes serveur
  à l'hôte et aux endpoints chaudière attendus; délais courts, aucune
  redirection et aucune journalisation de secrets.

**Critères de sortie :** tests unitaires avec `fetch` simulé; aucun appel réseau
réel; le connecteur CSV et les tests existants restent inchangés; le setup ne
confond pas joignabilité CSV, détection du protocole et version exacte, et
permet de corriger la présélection.

**Demande à envoyer :**

> Réalise l'étape 2 uniquement, selon le plan. Implémente un connecteur JSON V4
> en lecture seule, séparant transport, validation et normalisation, avec
> fixtures et tests ciblés. Dans `/setup`, fais proposer le mode CSV V2/V3 ou
> API JSON V4 après le test, avec sélection manuelle et état indéterminé si
> les preuves ou identifiants manquent. Garde le chemin CSV V2/V3 inchangé, ne
> persiste pas encore les relevés V4 et n'ajoute aucune commande chaudière.

### Étape 3 — Importer `log0` dans les données historiques

**But :** ajouter l'ingestion V4 en réutilisant le schéma historique existant
et les services de jobs/collecte.

- Définir la conversion `log0` → mesures/capteurs selon le contrat validé à
  l'étape 1. Contrôler le jour attendu, les heures, le fuseau et l'ordre
  chronologique avant écriture.
- Réutiliser le verrou d'écriture, les jobs, les repositories et les limites
  de taille existants. Garder une reprise explicite pour téléchargement partiel
  et interruption; une erreur ne doit pas produire un job réussi.
- Garantir l'idempotence sur la clé historique pertinente `(jour, heure)` sans
  écraser une mesure antérieure différente en silence. Détecter et signaler les
  conflits de doublons.
- Enregistrer les marqueurs de cycle à partir des transitions de statut
  chronologiques, y compris au changement de jour et lors d'un réimport. Ne
  pas dépendre du premier statut arbitraire `0` de chaque fichier.
- Recalculer les synthèses suivant la règle actuelle : elles ignorent
  aujourd'hui et exigent des mesures suffisantes. Toute règle V4 différente
  concernant une journée incomplète doit être décidée et testée d'abord.
- Préserver complètement les chemins CSV existants et ne changer aucun schéma
  métier pour cette seule adaptation.

**Critères de sortie :** import V4 idempotent et reprenable sur fixture/base
jetable; comparaison de lignes, dates et indicateurs avec références; test
explicite de non-régression V2/V3.

**Demande à envoyer :**

> Réalise l'étape 3 du plan. Ajoute l'import `log0` V4 au pipeline Node existant
> sans modifier le modèle historique ni le parcours CSV. Couvre bornes de jour,
> complétude, fuseau, réimports, doublons, interruption et transitions de cycle
> dans les tests. Ne lance aucune migration ni opération sur une base partagée.

### Étape 4 — Ajouter les instantanés V4 et le temps réel

**But :** décider puis mettre en œuvre le flux `/all?` sans confondre état
instantané et journal quotidien.

- Décider si les réponses `/all?` sont seulement servies à l'écran ou aussi
  persistées dans `oko_historique_full`; documenter la fréquence, l'expiration
  (stale) et la rétention.
- Si elles sont persistées, les distinguer de `log0` comme source, et choisir
  une clé/horodatage qui empêche les doublons en cas de deux appels dans la
  même minute.
- Respecter la fréquence caractérisée, avec planification bornée, pas de
  boucles agressives et reprise limitée après erreur. Un refus de fréquence doit
  rester une erreur explicite et ne pas créer un snapshot.
- Reprendre l'adaptateur du temps réel Node (noms, unités, circuits,
  indicateurs) seulement si les champs V4 ont une correspondance vérifiée;
  afficher « indisponible » pour le reste.
- Si l'historique instantané est stocké, tester le recalcul des transitions de
  cycle après réimport, redémarrage et changement de jour.

**Critères de sortie :** politique de persistance et fréquence approuvées;
tests sans chaudière; états absents/expirés visibles comme tels; aucune
modification de réglage envoyée à l'équipement.

**Demande à envoyer :**

> Réalise l'étape 4 du plan après validation de la politique `/all?`. Ajoute la
> collecte et/ou l'affichage en lecture seule selon la décision documentée,
> respecte les délais mesurés et teste expiration, champs manquants,
> redémarrage, réimport et changement de jour. Ne contacte pas une chaudière
> réelle et n'implémente pas d'écriture de paramètres.

### Étape 5 — Porter l'énergie, les cumuls et les prix FIFO

**But :** ajouter les calculs du README sans altérer les anciennes données ni
masquer une configuration inconnue.

- Valider les paramètres PCI (kWh/kg) et rendement (%) avec l'administrateur;
  ne pas traiter les valeurs par défaut du fork (4,90 et 89,50) comme adaptées
  à toutes les installations.
- Formaliser si `conso_kwh` signifie énergie utile (formule du README) ou
  énergie combustible, et documenter unités, arrondis, précision et effets
  d'une modification ultérieure des paramètres.
- Définir calcul des cumuls lorsque des jours manquent, des synthèses sont
  recalculées ou une période ancienne est corrigée. Préférer une source de
  vérité recalculable à l'enchaînement aveugle d'un cumul précédent.
- Formaliser les règles FIFO : événement de livraison, quantité/prix invalides,
  dates identiques, consommation antérieure à la première livraison, cumul
  supérieur aux livraisons connues, changement de PCI/rendement et coût cumulé.
  Sans donnée de coût fiable, exposer `null`/indisponible plutôt qu'un prix
  supposé.
- Ajouter les colonnes nécessaires par une migration Knex versionnée,
  réversible lorsque cela est sûr, non destructive et compatible avec les
  installations legacy. Les calculs de remplissage sont une étape distincte
  de l'ajout DDL; produire un rapport de simulation avant toute écriture de
  reprise sur une copie isolée sauvegardée.
- Mettre à jour le repository de synthèses et l'accès historique; garder les
  calculs existants kg/ECS/DJU/cycles identiques.

**Critères de sortie :** tests de formules et de cas FIFO; vérification de
parité sur jeux anonymisés; migration testée sur bases jetables vierge et
legacy; valeurs absentes conservées; aucune migration exécutée en service.

**Demande à envoyer :**

> Réalise l'étape 5 du plan. Commence par les formules et cas limites, puis
> implémente uniquement les paramètres et calculs acceptés, avec tests et
> migration Knex non destructive. N'exécute pas de DDL ni de recalcul sur une
> base réelle; prévois une simulation et un rapport de vérification sur fixtures.

### Étape 6 — Présenter les indicateurs d'énergie dans l'interface

**But :** rendre les nouvelles valeurs compréhensibles sans brouiller les
indicateurs historiques.

- Ajouter l'énergie (kWh) aux synthèses journalières, historiques mensuels et
  saisonniers uniquement après validation des agrégats de l'étape 5.
- Décider séparément de la présentation des cumuls et du prix; distinguer
  estimation, valeur calculée et indisponibilité.
- Réutiliser les patterns des pages et graphiques Svelte existants; ne pas
  reprendre le HTML/Bootstrap du fork.
- Prévoir libellés, unités, format numérique français, valeurs nulles et
  accessibilité clavier/mobile.

**Critères de sortie :** tests SSR ciblés, validations TypeScript/lint et build;
les données non disponibles ne sont jamais affichées comme zéro ou données
réelles.

**Demande à envoyer :**

> Réalise l'étape 6 après validation des calculs. Ajoute l'affichage kWh aux
> vues convenues en respectant les conventions Svelte 5 du dépôt, le format
> français et les états indisponibles. Ajoute des tests des seules vues
> modifiées et lance les contrôles documentés.

### Étape 7 — Exposer une API Home Assistant en lecture seule

**But :** concevoir un contrat Node versionné, pas recopier `ha_api.php`.

- Établir le contrat et les dates exactes des actions nécessaires. Ne pas
  reprendre l'ambiguïté `today` (README : dernière journée synthétisée, souvent
  hier; code PHP : choix de date/fallback variables); définir aussi ce que
  `daily` renvoie pour jour courant, hier sans synthèse et jour absent.
- Commencer par des ressources explicites sous `/api/v1` pour les données
  journalières, historiques et statut silo/cendrier/maintenance qui existent
  déjà; ajouter énergie/prix/live uniquement quand leurs sources sont validées.
- Utiliser un secret dédié à Home Assistant envoyé par un en-tête
  d'autorisation, avec stockage protégé (au minimum empreinte côté base),
  comparaison sûre, création/rotation/révocation documentées, droits en
  lecture seule et limitation de requêtes. Exclure les secrets des URL,
  journaux, erreurs et réponses.
- Valider dates/mois/années et répondre avec des codes HTTP et schémas JSON
  stables; documenter les unités, les champs nullables et les règles de
  fallback. Désactiver le cache des données privées.
- Ajouter tests d'accès sans token, token invalide/révoqué, autorisation
  lecture seule, validation des paramètres, valeurs absentes et contrat JSON.
  Ne pas exposer les anciennes routes PHP ni réutiliser le token historique
  tronqué.

**Critères de sortie :** contrat validé avec un client Home Assistant de test;
tests d'authentification et de permissions; aucune donnée ou commande non
autorisée accessible par l'API.

**Demande à envoyer :**

> Réalise l'étape 7 du plan. Propose d'abord le contrat API et la politique de
> jeton; après accord, implémente les seules ressources lecture seule convenues
> sous `/api/v1`, avec validation, erreurs explicites et tests. Ne reprends pas
> `ha_api.php` ni le token en query string et ne porte aucune commande chaudière.

### Étape 8 — Valider l'ensemble et préparer une décision de mise en service

**But :** prouver la compatibilité sans faire de bascule implicite.

- Exécuter `npm run check`, `npm run lint`, les tests unitaires ciblés, les tests
  DB sur bases jetables et `npm run build` pour les changements de routes ou de
  rendu.
- Comparer les imports et indicateurs V2/V3/V4 à des fixtures de référence :
  nombres de lignes, dates, valeurs nulles/zéro, cycles, synthèses, kWh et prix.
- Tester interruptions et reprise, erreurs chaudière, stockage privé des jobs,
  fréquence et mono-instance; conserver un seul écrivain et ne pas lancer
  simultanément collecte PHP et Node.
- Sur une copie isolée sauvegardée, faire un essai de migration/restauration
  et vérifier les volumes avant/après. Ne pas utiliser les migrations PHP du
  fork ni le SQL historique destructif.
- Mettre à jour [l'état de migration](./etat-a-date-de-la-migration.md) et
  [les actions à faire](./actions-a-faire.md) seulement avec les contrôles
  réellement effectués. La bascule et le retour arrière restent une décision
  d'exploitation séparée.

**Critères de sortie :** preuves de test datées, limites connues, restauration
répétée et décision GO/NO-GO explicite. Le succès d'un build ou d'un test ne
certifie ni une chaudière, ni une base ou un déploiement réels.

**Demande à envoyer :**

> Réalise l'étape 8 du plan sans déploiement et sans toucher à une installation
> en service. Exécute les contrôles adaptés, compare les résultats aux fixtures,
> vérifie `git diff --check` et rapporte les preuves, échecs et limites. Ne
> déclare pas de compatibilité réelle sans essai autorisé sur copie isolée ou
> simulateur.

## 3. Priorités si le périmètre doit être réduit

1. **Indispensable au support V4 :** étapes 0 à 3 (cadrage, fixtures,
   adaptateur, import journalier) et validations non-régression V2/V3.
2. **À traiter si l'affichage temps réel V4 est demandé :** étape 4, après
   caractérisation séparée de `/all?`.
3. **Évolutions métier du fork, indépendantes du V4 :** étapes 5 et 6 pour
   énergie/cumuls/prix et leur affichage.
4. **Intégration externe optionnelle :** étape 7 pour Home Assistant, fondée
   sur des contrats et sources de données validés.
5. **Avant toute mise en service :** étape 8 et les prérequis de sauvegarde,
   restauration, mono-instance et retour arrière de
   [l'état de migration](./etat-a-date-de-la-migration.md).

L'archive PHP reste une référence de comportement : ne pas la charger depuis
Node, ne pas la publier, et ne pas modifier ses fichiers pendant ce portage.
