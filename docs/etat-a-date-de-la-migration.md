# État à date de la migration

**Date du bilan : 15 novembre 2026**

Ce bilan recense les chantiers et actions identifiés dans l'[inventaire
historique](./inventaire-fonctionnel-actuel.md), l'[architecture
cible](./architecture-cible-svelte-node.md), l'[analyse de
faisabilité](./analyse-technique-et-faisabilite-node-svelte.md), les
[actions à faire](./actions-a-faire.md), le [guide
d'exploitation](./installation-et-exploitation.md) et le code du dépôt.
Les pistes issues d'autres projets sont distinguées du portage historique :
elles ne sont pas automatiquement approuvées.

## Lecture des états

| État | Signification |
|---|---|
| **À faire** | Action ou validation identifiée, non démontrée comme réalisée. |
| **En cours** | Travail engagé dont l'achèvement reste à démontrer; cet état ne présume pas qu'une personne y travaille actuellement. |
| **Terminé** | Périmètre précis de la ligne réalisé dans le dépôt; ne signifie pas que la migration ou la validation en production est terminée. |
| **Non repris** | Fonction historique ou piste identifiée sans implémentation correspondante dans la nouvelle application. |
| **Partiellement repris** | Une partie existe : la dernière colonne précise ce qui est repris et ce qui manque ou reste à valider. |

Une page, un test ou un composant présent ne prouve ni la parité PHP, ni
l'exécution réussie sur une installation réelle. Les états ci-dessous
décrivent le dépôt, pas une certification opérationnelle.

**Bascule en production : non validée.** La parité, la reprise après
interruption, la sécurité, les sauvegardes et les deux modes de déploiement
restent à démontrer. Ne pas modifier une installation PHP en service pour
réaliser ces essais.

## Socle et environnement

| Chantier / action | État | Réalisé, limites ou suite |
|---|---|---|
| Archivage du PHP et séparation des applications | **Terminé** | Sources conservées dans [`archive/php/`](../archive/php/) comme référence, sans chargement par SvelteKit ni publication de l'archive. |
| Socle SvelteKit / Node | **Terminé** | Svelte 5, TypeScript strict, Vite et `adapter-node`, dans un processus applicatif unique; versions et lockfile présents. |
| Accès MySQL/MariaDB | **Partiellement repris** | Pool partagé, repositories et paramètres DB/TLS existent; vérifier les schémas, droits, moteurs, modes SQL et versions réellement rencontrés sur copies isolées. Les tables historiques sont conservées, avec ajout de `oko_configuration` par migration. |
| Configuration métier | **Partiellement repris** | Les paramètres sont lus et enregistrés dans `oko_configuration`, plus dans `config.json`; le fichier PHP existant n'est pas importé automatiquement. Définir la reprise des valeurs et secrets, ainsi que leur sauvegarde. |
| Migrations de structure Knex | **Partiellement repris** | CLI, verrou et suivi des migrations appliquées; migrations de configuration et retrait de paramètres obsolètes. Les migrations sont explicites, sauf setup validé et `dev:local` jetable. Prévoir contrôle des migrations futures, écran de mise à niveau, préconditions legacy et reprise après DDL partielle. |
| Bases locales de développement | **Terminé** | Modes séparés pour base V2 migrée, base vierge et base V1; bases jetables recréées par les commandes de développement. |
| Tests et outils de qualité | **Partiellement repris** | Tests unitaires et tests d'intégration sur bases jetables, contrôle TypeScript, lint et build existent. Compléter les tests de parité, de sécurité, de reprise et les validations sur environnements représentatifs. |
| Image Docker et compositions | **Partiellement repris** | Image multi-stage et modes base distante ou MariaDB locale préparés; le volume privé des jobs n'est pas monté dans les compositions d'exploitation. Démontrer les deux modes avec données métier, permissions, TLS et sauvegardes. |
| Santé et journalisation | **Partiellement repris** | Logs applicatifs et endpoint de vitalité HTTP; ce dernier ne teste ni la base ni la chaudière. Définir et valider disponibilité DB, surveillance et exploitation des journaux. |

## Portage fonctionnel historique

Les références F01 à F18 correspondent au
[catalogue historique](./inventaire-fonctionnel-actuel.md#3-catalogue-fonctionnel).
Une fonction présente mais sans preuve complète de parité reste classée
« Partiellement repris ».

| Réf. / chantier | État | Ce qui est repris et ce qui reste |
|---|---|---|
| F01 — Installation et post-installation | **Partiellement repris** | `/setup` détecte une base vierge, partielle ou à configurer; formulaire sans connexion préalable tant que l'installation est incomplète, mot de passe admin choisi et migrations à la validation. Une base partielle exige une confirmation destructive. Tester les schémas incompatibles et la reprise après interruption du SQL initial, uniquement sur copie sauvegardée. |
| F01 — Première saison et calendrier | **Partiellement repris** | Une première saison est créée au jour courant, dans le fuseau configuré, lors d'une installation neuve ou forcée. Compléter le calendrier de référence et vérifier les saisons pertinentes et les limites calendaires. |
| F01 — Test chaudière et initialisation de matrice | **Partiellement repris** | Test HTTP depuis le navigateur; après résultat positif et enregistrement, tentative serveur de création à partir du CSV du jour. Une panne conserve la configuration, bloque la collecte et permet un nouvel essai administrateur. Le test navigateur ne prouve pas l'accès serveur ni la présence du CSV. |
| F02 — Connexion et déconnexion | **Partiellement repris** | Authentification compatible avec les empreintes historiques et scrypt, routes privées et déconnexion POST; sessions Node en mémoire, invalidées au redémarrage. Compléter les tests de permissions et décider de la persistance et des parcours de récupération. |
| F02 — Changement de mot de passe | **Terminé** | Mot de passe actuel et confirmation exigés, nouveau hash scrypt, invalidation de la session courante. Les autres sessions restent actives; scrypt n'est pas compatible avec la connexion PHP historique. |
| F02 — Récupération et gestion des comptes | **Non repris** | Pas de réinitialisation de mot de passe ni de gestion complète des utilisateurs, rôles ou MFA; préciser les besoins avant portage. |
| F03 — Tableau de bord journalier | **Partiellement repris** | Date, graphiques et capteurs configurés, mesures et annotations, zoom/déplacement synchronisés et recalcul des indicateurs de plage. Comparer les résultats et alertes aux références PHP, avec plusieurs capteurs et firmwares. |
| F04 — Historique mensuel | **Partiellement repris** | Lecture des synthèses, graphiques et récapitulatifs, y compris les périodes sans données. Vérifier agrégats, bornes, années et jours sans relevés; les axes fixes peuvent tronquer des valeurs signalées. |
| F05 — Synthèse saisonnière | **Partiellement repris** | Graphiques, totaux et tableau mensuel; le mois courant est exclu du graphique mais reste dans les totaux et le tableau. Vérifier arrondis, totaux, changements d'heure et années bissextiles. |
| F06 — Stock et cendrier | **Partiellement repris** | Estimations à partir des événements, paramètres et synthèses, avec états indisponibles lorsque les entrées manquent. Vérifier reliquats, données partielles et seuils; ce ne sont pas des mesures physiques ni des prévisions. |
| F07 — Approvisionnements et entretiens | **Partiellement repris** | Consultation et CRUD des événements pris en charge : livraison, sacs, entretien, ramonage et vidage. Vérifier dates, unités, valeurs et effets sur stock/cendrier avec des références. |
| F08 — Administration des saisons | **Partiellement repris** | Consultation, création, modification et suppression en espace privé. Vérifier règles historiques de dates, doublons, suppression et cas limites. |
| F09 — Graphiques journaliers | **Partiellement repris** | Gestion des graphiques, associations de capteurs, coefficients et ordre. Les commandes haut/bas accessibles remplacent volontairement le glisser-déposer; vérifier contraintes et ordre face au PHP. |
| F10 — Matrice CSV | **Partiellement repris** | Création automatique au setup ou manuelle depuis le CSV du jour, mise à jour des capteurs et colonnes en conservant les données historiques; verrou partagé avec la collecte. Vérifier firmwares et reprise après écriture partielle. Téléversement local, prévisualisation et suppression destructive historiques ne sont pas repris. |
| F11 — Import depuis la chaudière | **Partiellement repris** | Liste des fichiers `touch_YYYYMMDD.csv`, import asynchrone, mapping historique, arrondi à la minute, dédoublonnage et marqueur de cycle. Valider dialectes, firmwares et reprises; les CSV sont chargés en mémoire et limités à 16 Mio. |
| F11 — Import local/USB et import en masse | **Non repris** | Téléversement d'un fichier local et traitement en série de fichiers déposés côté serveur à porter avec validation, limites et reprise. |
| F12 — Synthèses journalières | **Partiellement repris** | Calcul et recalcul déclenchés par la collecte IP; le jour courant n'est pas synthétisé. Vérifier formules, null/zéro, ECS, dates et précision par comparaison au PHP. |
| F12 — Calcul manuel des synthèses | **Non repris** | Page de calcul/recalcul d'une journée, de plusieurs journées ou d'une période non fonctionnelle. |
| F13 — Lecture temps réel | **Partiellement repris** | Lecture de valeurs chaudière en espace privé et endpoint d'indicateurs; la page utilise le circuit 1. Vérifier l'ensemble des valeurs, circuits, unités et comportements sur les firmwares concernés. |
| F13 — Graphiques et configurations temps réel | **Non repris** | Graphiques à interrogation périodique, gestion des configurations datées et historique des réglages ne sont pas fonctionnels. |
| F13 — Écriture et commandes chaudière | **Non repris** | Réglage et pilotage non portés; aucune activation implicite. Une éventuelle reprise nécessite décision explicite, permissions, garde-fous et essais isolés. |
| F14 — Paramètres généraux | **Partiellement repris** | Saisie au setup et édition administrateur après installation en base, avec test HTTP navigateur de l'adresse chaudière. Le mode d'import local/USB, la sélection de langue dans le formulaire et une procédure de reprise des secrets chaudière restent à traiter; la langue est configurée par `APP_LANG`. |
| F15 — API et intégrations | **Partiellement repris** | Endpoints natifs de santé et d'indicateurs, ainsi que suivi privé des jobs. Les routeurs `ajax.php` et `api.php` ne sont pas reproduits : recenser les clients, mapper les contrats, migrer et valider permissions et jetons. |
| F16 — Collecte et synthèses automatiques | **Partiellement repris** | Collecte IP intégrée, tâche au démarrage puis à la minute 02 toutes les deux heures selon le fuseau; file persistée et verrou d'écriture. La présence de 23:59 ne garantit pas une journée sans trous. Valider MyISAM, interruptions, reprise et mono-écrivain; le mode sans IP n'est pas porté. |
| F17 — Langues, présentation et accessibilité | **Partiellement repris** | Libellés FR/EN, navigation responsive, notifications et gestion des erreurs pour les pages portées. Vérifier couverture, claviers, focus, formulaires privés et affichage mobile. |
| F18 — Informations et mises à jour | **Partiellement repris** | Page d'information et visualisation des mises à jour disponibles. Définir livraison et retour arrière; l'auto-mise-à-jour et l'envoi de statistiques historiques ne sont pas reconduits. |

## Fiabilité, sécurité et mise en service

Ces actions conditionnent la bascule indépendamment de la présence des écrans.

| Chantier / action | État | Réalisé, limites ou suite |
|---|---|---|
| Inventaire des pages et actions PHP | **Partiellement repris** | Catalogue F01–F18 et inventaire des routeurs disponibles; compléter les contrats, paramètres, méthodes, effets et usages effectifs des clients externes. |
| Jeux de référence et parité métier | **En cours** | Fixtures V1/V2 et tests existent; constituer des données anonymisées représentatives et comparer PHP/Node pour mesures, indicateurs, synthèses, saisons, stock et cendrier, aux précisions stockées. |
| Cas limites des données et du temps | **À faire** | Caractériser matrices et firmwares, journée partielle/complète, trous, réimport, ECS absente, null/zéro, heures d'été et années bissextiles; fixer des critères d'acceptation par parcours. |
| Compatibilité des installations | **À faire** | Recenser versions PHP/MySQL/MariaDB, moteurs, schémas, volumes, navigateurs, firmwares et contraintes d'hébergement réellement utilisés. |
| Écritures MyISAM et reprise | **Partiellement repris** | Verrous Node et signalement des tâches interrompues existent; tester erreurs à mi-parcours, perte du verrou, postconditions, dédoublonnage et restauration sur copie. MyISAM et les DDL ne sont pas transactionnels. |
| File, progression et arrêt des jobs | **Partiellement repris** | Demandes, états et progression persistés dans un répertoire privé; tâche en cours marquée interrompue au redémarrage, arrêt du planificateur et du gestionnaire prévus. Tester arrêt gracieux/forcé, reprise, rétention et absence de faux succès. |
| Performance des imports | **À faire** | Fixer et mesurer latence HTTP, durée et mémoire sur volumes représentatifs; introduire streaming et lots bornés si les seuils opérationnels le nécessitent. |
| Persistance des jobs en exploitation | **Partiellement repris** | `JOBS_DIR` et stockage privé existent, mais le volume n'est pas monté dans les compositions d'exploitation. Définir montage, droits, espace, sauvegarde et rétention. |
| Mono-instance et coexistence PHP/Node | **Partiellement repris** | Ordonnanceur et verrouillage intégrés côté Node; démontrer un seul écrivain, arrêter l'ancien cron PHP avant activation de Node et tester les interruptions. Les verrous Node ne protègent pas des écrivains externes. |
| Authentification, permissions et CSRF | **Partiellement repris** | Sessions, limites de tentatives et protections de routes/formulaires existent. Recenser toutes les mutations et tester autorisations, CSRF, endpoints JSON et limitation côté proxy/application. |
| Mots de passe et secrets | **Partiellement repris** | Scrypt pour les mots de passe nouvellement définis et compatibilité de lecture SHA-1 historique; secrets DB par fichier possibles. Définir rotation, protection des identifiants chaudière, absence de secrets dans les logs et stratégie de retour à PHP après changement de hash. |
| Validation des imports et fichiers | **Partiellement repris** | Taille bornée et validation des fichiers chaudière/matrice; compléter les essais de contenu malformé, autorisations et limites, notamment avant tout upload local. |
| Clients et contrats API externes | **À faire** | Identifier les consommateurs de `ajax.php` et `api.php`, documenter méthodes/réponses/droits, prévoir jetons et rotation, migrer et valider chaque client nécessaire. |
| Sauvegarde et restauration | **À faire** | Démontrer sauvegarde/restauration de la base, configuration, jobs et éventuelles archives sur environnement isolé; documenter droits, contrôles et rétention. |
| Déploiement et exploitation Docker | **Partiellement repris** | Socle Compose distant/local, TLS et healthcheck HTTP documentés; valider raccordement métier, volumes, disponibilité DB, arrêt, logs et surveillance sans création implicite de données. |
| Bascule et retour arrière | **À faire** | Définir procédure mono-instance, arrêt du cron PHP, point de non-retour des données/configurations/mots de passe, restauration et retour à PHP; répéter l'exercice avant décision GO/NO-GO. |
| Dépendances et licences | **À faire** | Relancer l'audit avant livraison et confirmer les conditions de licence des bibliothèques graphiques. L'audit initial documenté signalait 14 alertes de développement et aucune en production; ce n'est pas un état courant vérifié. |
| Expérience utilisateur et erreurs | **Partiellement repris** | États vides et erreurs existent sur les parcours portés; harmoniser configuration incomplète, données absentes, panne DB et chaudière indisponible, puis vérifier clavier et responsive sur les pages privées. |

## Pistes fonctionnelles complémentaires à cadrer

Ces propositions proviennent notamment du site de référence et du dépôt
`bertrandgorge/okovision`; elles ne définissent pas à elles seules la parité
avec l'application PHP archivée.

| Chantier / action | État | Réalisé, limites ou suite |
|---|---|---|
| Journée détaillée et cycles | **Partiellement repris** | Graphiques, indicateurs et marqueur de début de cycle existent; frise brûleur/pompes, analyse de combustion, caractérisation des cycles et synthèse journalière enrichie restent à cadrer. |
| Analyse du chauffage | **Non repris** | Expliquer arrêts/reprises selon limites de chauffe, consigne, hystérésis, horaires et états; relier les courbes aux réglages actifs. |
| Loi d'eau et optimisation | **Non repris** | Caractériser la formule, la courbe et sa qualité d'ajustement avant visualisation, estimation des besoins et recommandations; ne pas généraliser une formule observée sur une seule installation. |
| Analyse ECS enrichie | **Partiellement repris** | Consommation ECS dans les indicateurs et synthèses; analyse du ballon, plages, charges, cycles anti-légionelles et explication des réglages non reprises. |
| Comparaison enrichie des saisons | **Partiellement repris** | Historique saisonnier avec consommation et DJU disponible; compléter comparaisons entre saisons, euros et ratios aux DJU après validation des agrégats. |
| Prévisions silo et cendrier | **Partiellement repris** | Estimations courantes de stock et de cendrier; projections, dates d'épuisement/vidage et dépassements de capacité non repris. |
| Comparaison des lots de granulés | **Non repris** | Définir périodes entre livraisons, correction météo et indicateurs d'énergie relative. |
| Catalogue et programmation des réglages | **Non repris** | Décrire types, unités, bornes, choix, valeurs d'usine et programmes horaires/soirée/vacances. Toute écriture éventuelle exige validation, simulation, relecture et journalisation. |
| Historique des réglages chaudière | **Non repris** | Définir profils datés, dédoublonnage et affichage des valeurs anciennes ou indisponibles; aucun profil actuel ne doit être présenté comme historiquement vérifié. |
| Alertes et notifications externes | **Partiellement repris** | Indicateurs et alertes d'interface stock/cendrier existent; règles étendues et canaux e-mail, Slack, Telegram ou webhook signé ne sont pas repris. |
| Diagnostic exportable | **Non repris** | Définir un rapport d'installation, réglages, cycles et mesures expurgé des secrets. |
| Archivage des mesures et restauration | **Non repris** | Définir archivage, contrôles de lignes/empreintes, relecture et restauration, cohérence des vues après purge et sauvegarde des archives. |
| Reprise de données vers un nouveau modèle | **Non repris** | Si une migration distincte est décidée : correspondance des capteurs, import par lots, événements et profils, recalcul et comparaison des volumes/indicateurs sur copie isolée. L'accès actuel aux tables historiques n'est pas cette reprise. |
| Connexion par lien unique e-mail | **À faire** | Option à décider séparément : expiration, usage unique, limitation et dépendance au service de messagerie; ne remplace pas implicitement la connexion actuelle. |

## Compatibilité firmware ÖkoFEN V4

Le connecteur actuel utilise les CSV du répertoire `/logfiles/pelletronic/`.
La documentation communautaire décrit une API JSON V4, mais ne prouve pas la
compatibilité de toutes ses variantes. Voir les
[actions détaillées](./actions-a-faire.md#compatibilité-ökofen-touch-avec-le-firmware-v4).

| Chantier / action | État | Réalisé, limites ou suite |
|---|---|---|
| Caractérisation V4 | **À faire** | Vérifier sur réponses anonymisées versions, configuration API, signification de `log0`, `/all?`, encodage, unités, champs absents et fréquence acceptable. |
| Acquisition et import V4 en lecture seule | **Non repris** | Ajouter si requis un mode séparé transport/validation/normalisation, préserver les CSV V2/V3, mapper les capteurs, gérer fuseau, bornes, doublons et reprises sans exposer les secrets. |
| Fixtures et parité V2/V3/V4 | **À faire** | Tester facteurs d'échelle, valeurs énumérées, null/zéro, plusieurs circuits, dates, réponses invalides et téléchargements partiels sans chaudière en service. |
| Instantanés et temps réel V4 | **Non repris** | Évaluer l'ingestion de `/all?`, avec fréquence mesurée, délais et reprises bornés; si persistée, calculer les transitions de cycle chronologiquement et tester changement de jour et réimports. |
| Commandes V4, Home Assistant et calculs énergie/coût | **À faire** | Décisions séparées du support V4 en lecture seule; ne pas porter les commandes sans autorisation et validation de sécurité explicites. |

## Précisions documentaires et validations

| Chantier / action | État | Réalisé, limites ou suite |
|---|---|---|
| Cohérence des documents de configuration | **À faire** | La dernière section d'[actions-a-faire.md](./actions-a-faire.md#clarifier-le-stockage-de-la-configuration) et certains passages de l'architecture décrivent encore `config.json` comme actuel; le code lit désormais `oko_configuration`. Réviser ces documents séparément sans confondre cible et état constaté. |
| Vérifications initiales du socle | **Terminé** | Le [guide d'exploitation](./installation-et-exploitation.md#vérifications-initiales-documentées) rapporte les contrôles initiaux de types, lint, SSR, build, HTTP, rendu et accès à l'archive. Ils précèdent les ajouts métier et ne valident pas l'état courant. |
| Validation complète de l'état courant | **À faire** | Exécuter et dater les contrôles adaptés au code courant, les tests de parité et les essais d'exploitation; préciser l'environnement, notamment copie isolée ou simulateur. |

La prochaine étape est de compléter les parcours requis et surtout d'apporter
les preuves de parité et d'exploitation nécessaires avant toute bascule.
