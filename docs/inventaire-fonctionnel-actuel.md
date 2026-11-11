# Inventaire des fonctionnalités actuelles

## 1. Objet et limites

Cet inventaire décrit les fonctionnalités présentes dans le dépôt, pas une application cible ni une certification de bon fonctionnement. Il complète l'[analyse technique](./analyse-technique-et-faisabilite-node-svelte.md) et sert de référentiel à l'[architecture cible Svelte/Node.js](./architecture-cible-svelte-node.md).

La lecture croise les pages, les scripts navigateur, les routeurs et les traitements serveur. Les codes F01 à F18 permettent de suivre la couverture fonctionnelle de la migration.

- **Interface** : parcours effectivement raccordé à une page et à son script.
- **Serveur/API** : capacité accessible par un routeur ou par un traitement système, sans forcément avoir une interface.
- **Dormant** : code présent, mais sans appel actif retrouvé dans les parcours examinés.
- Les droits indiqués sont ceux que présente l'interface, pas une garantie d'autorisation serveur. Les limites de sécurité sont détaillées dans l'analyse technique.
- Aucun échange avec une chaudière, import réel ou modification de base n'a été exécuté pour cette étude.

## 2. Vue d'ensemble des écrans

| Écran | Fonction | Accès présenté par l'application |
|---|---|---|
| [setup.php](../setup.php) | Installation et test MySQL | Assistant indépendant des pages connectées |
| [index.php](../index.php) | Tableau de bord journalier et alertes | Public |
| [histo.php](../histo.php) | Historique mensuel, saisons et stock | Public |
| [rt.php](../rt.php) | Lecture et configuration chaudière en temps réel | Connecté |
| [gstrapport.php](../gstrapport.php) | Gestion des graphiques et courbes | Connecté |
| [amImpBoiler.php](../amImpBoiler.php) | Import de fichiers disponibles sur la chaudière | Connecté; entrée de menu conditionnée au mode IP |
| [amImpUsb.php](../amImpUsb.php) | Téléversement et import de CSV local | Connecté |
| [amImportMass.php](../amImportMass.php) | Import en série des fichiers du répertoire temporaire | Connecté |
| [amSynthese.php](../amSynthese.php) | Calcul et recalcul des synthèses | Connecté |
| [adminParam.php](../adminParam.php) | Paramètres généraux | Connecté |
| [adminSeason.php](../adminSeason.php) | Gestion des saisons | Connecté |
| [adminEvents.php](../adminEvents.php) | Événements de stock et d'entretien | Connecté |
| [adminMatrix.php](../adminMatrix.php) | Matrice de lecture des CSV | Connecté |
| [about.php](../about.php) | Informations, version et mise à jour | Connecté |
| [401.php](../errors/401.php), [404.php](../errors/404.php) | Pages d'erreur dédiées | Pages système |

Sources des accès présentés : [menu.php](../_templates/menu.php), [header.php](../_templates/header.php).

## 3. Catalogue fonctionnel

### F01 — Installation initiale

- Tester une connexion MySQL à partir de l'adresse, de l'utilisateur et du mot de passe saisis.
- Proposer la création d'une base et initialiser les tables avec le SQL fourni.
- Alimenter le calendrier de référence à partir de septembre 2014, jusqu'à septembre 2037 dans le code actuel.
- Saisir le mode de récupération CSV IP/USB, l'adresse chaudière, la température de référence, le poids de granulés par minute de vis et la surface du logement.
- Générer les fichiers de configuration PHP/JSON et le jeton d'installation; initialiser le compte prévu dans le SQL.
- Rediriger l'interface vers l'accueil après installation.

**Limite importante** : ce n'est pas un assistant de reprise non destructif d'une base existante. Le SQL contient des suppressions de tables. Ne pas l'utiliser comme procédure de migration.

Sources : [setup.php](../setup.php), [setup.js](../js/setup.js), [install.sql](../install/install.sql), [config_sample.php](../config_sample.php).

### F02 — Connexion et compte utilisateur

- Ouvrir une fenêtre de connexion depuis la navigation.
- Vérifier l'identifiant et le mot de passe et mémoriser en session l'utilisateur, son type et son état connecté.
- Afficher les entrées de navigation supplémentaires pour l'utilisateur connecté.
- Changer le mot de passe avec une confirmation dans le formulaire.
- Se déconnecter et revenir à l'accueil; signaler un jeton de session invalide.

**Pas de gestion complète des utilisateurs** : aucun parcours d'inscription, récupération de mot de passe, création/suppression de comptes, gestion fine de rôles ou MFA n'est raccordé à l'interface.

Sources : [menu.php](../_templates/menu.php), [custom.js](../js/custom.js), [session.class.php](../_include/session.class.php), [administration.class.php](../_include/administration.class.php#L703).

### F03 — Tableau de bord journalier

- Sélectionner une date par calendrier, saisie ou boutons jour précédent/suivant.
- Afficher les graphiques configurés, dans leur ordre enregistré, avec les capteurs associés et leurs coefficients.
- Consulter les températures extérieures minimale/maximale et les consommations de granulés totale et ECS.
- Zoomer sur une plage horaire et synchroniser le zoom entre graphiques; recalculer les indicateurs sur la plage sélectionnée.
- Déplacer la vue temporelle et consulter les valeurs avec des infobulles.
- Afficher les annotations datées correspondant aux configurations chaudière enregistrées.
- Afficher une alerte stock à 10 % ou moins, les alertes cendrier et une notification de mise à jour disponible.
- Afficher un chargement et des erreurs de communication.

Sources : [index.php](../index.php), [index.js](../js/index.js), [rendu.class.php](../_include/rendu.class.php).

### F04 — Historique mensuel

- Choisir un mois et une année, ou naviguer au mois précédent/suivant.
- Visualiser, jour par jour, les températures extérieures min/max, la consommation de granulés, les DJU et les cycles.
- Afficher les agrégats mensuels : consommations totale/ECS, températures extrêmes, indicateur de température moyenne construit à partir des extrêmes, DJU et nombre de cycles.
- Maintenir les jours sans synthèse dans l'axe temporel grâce au calendrier de référence.
- Afficher l'état du stock et ses informations manquantes.

**Précision** : la consommation ECS existe dans les indicateurs mensuels, mais sa série est commentée dans la production du graphique mensuel actuel.

Sources : [histo.php](../histo.php), [histo.js](../js/histo.js), [rendu.class.php](../_include/rendu.class.php#L392).

### F05 — Synthèse par saison

- Choisir une saison de chauffe enregistrée.
- Afficher les températures extrêmes, consommations totale/ECS, DJU et nombre de cycles de la saison.
- Visualiser les synthèses agrégées par mois : températures, consommation totale, consommation ECS, DJU et cycles.
- Consulter un tableau mensuel récapitulatif avec consommation, ECS, DJU, cycles et ratio de consommation en grammes par DJU et par mètre carré.
- Dans le graphique saisonnier, masquer les valeurs du mois courant selon la règle SQL actuelle.

**Précision** : la « température moyenne » affichée par le navigateur est la moyenne des deux extrêmes, pas une moyenne pondérée des mesures.

Sources : [histo.js](../js/histo.js#L257), [rendu.class.php](../_include/rendu.class.php#L433).

### F06 — Stock de granulés et cendrier

- Gérer un fonctionnement avec silo ou avec approvisionnement en sacs.
- Calculer le stock restant à partir du dernier événement d'approvisionnement pertinent, du reliquat et de la consommation synthétisée après sa date.
- Afficher les kilogrammes restants, le pourcentage et une barre de progression; appliquer les seuils visuels de l'historique autour de 50 % et 25 %.
- Signaler une capacité de silo ou une date d'approvisionnement manquante.
- Déterminer le besoin de vider le cendrier à partir du dernier événement de vidage et du seuil de consommation configuré.
- Signaler l'absence de seuil ou de date de vidage.

**Limites** : le stock repose sur les synthèses disponibles, pas sur un inventaire physique en temps réel. L'estimation de la date d'épuisement du silo est commentée et n'est pas une fonction active.

Sources : [rendu.class.php](../_include/rendu.class.php#L242), [histo.js](../js/histo.js#L213), [index.js](../js/index.js#L342).

### F07 — Journal des approvisionnements et entretiens

- Lister, ajouter, modifier et supprimer des événements datés.
- Types effectivement traités : livraison de granulés `PELLET`, sacs `BAG`, maintenance `MAINT`, ramonage `SWEEP`, vidage du cendrier `ASHES`.
- Adapter les champs du formulaire au type : quantité, reliquat et prix.
- Présenter les détails des achats, notamment un prix ramené à la tonne ou à un sac de 15 kg.
- Utiliser les événements de livraison/sacs et de vidage comme entrées des calculs de stock/cendrier.

Sources : [adminEvents.php](../adminEvents.php), [adminEvents.js](../js/adminEvents.js), [administration.class.php](../_include/administration.class.php#L461).

### F08 — Administration des saisons

- Lister les saisons, leurs dates de début et de fin.
- Créer et modifier une saison à partir d'une date de début; générer une durée d'un an moins un jour et son libellé.
- Tester si une date de début existe déjà.
- Supprimer une saison après confirmation.

Sources : [adminSeason.js](../js/adminSeason.js), [administration.class.php](../_include/administration.class.php#L345), [calcul des dates](../_include/administration.class.php#L937).

### F09 — Configuration des graphiques journaliers

- Lister, créer, renommer et supprimer des graphiques.
- Vérifier l'existence d'un nom et déterminer la dernière position.
- Réordonner les graphiques par glisser-déposer.
- Lister les capteurs disponibles, les associer à un graphique et empêcher via l'interface une association déjà présente.
- Définir/modifier un coefficient de correction par courbe.
- Réordonner les courbes et retirer une association.

Sources : [gstrapport.php](../gstrapport.php), [gstrapport.js](../js/gstrapport.js), [gstGraphique.class.php](../_include/gstGraphique.class.php).

### F10 — Matrice CSV et correspondance des capteurs

- Détecter si une matrice est initialisée.
- Téléverser un CSV pour créer les capteurs depuis son en-tête et ajouter les colonnes historiques `col_n`.
- Appliquer les dictionnaires de correspondance : nom lisible, type métier et identifiant chaudière.
- Afficher les noms originaux/traduits, la disponibilité temps réel et le rôle métier des capteurs.
- Mettre à jour la matrice pour des capteurs déplacés, ajoutés ou disparus; conserver la correspondance aux colonnes historiques existantes.
- Marquer les capteurs absents par une position CSV `-1`, sans supprimer leurs anciennes colonnes.
- Ajouter/maintenir le capteur calculé de début de cycle.
- Supprimer la matrice après confirmation : vider les capteurs et recréer la table d'historique détaillé, tout en conservant les synthèses journalières.

**Attention** : cette suppression détruit les mesures détaillées; l'interface ne propose pas un simple effacement des paramètres.

Sources : [adminMatrix.js](../js/adminMatrix.js), [administration.class.php](../_include/administration.class.php#L237), [initialisation](../_include/administration.class.php#L781), [mise à jour](../_include/administration.class.php#L846).

### F11 — Imports manuels de mesures

- **Depuis la chaudière** : récupérer la liste des CSV disponibles, choisir un fichier, le télécharger puis l'importer.
- **Depuis le poste local/USB** : téléverser le CSV, afficher sa progression, puis déclencher l'import. Le terme USB désigne ici un fichier fourni par l'utilisateur, pas une lecture directe de périphérique par le serveur.
- **En masse** : lister les fichiers présents dans le répertoire temporaire et les importer successivement.
- Utiliser la matrice pour positionner chaque valeur dans sa colonne historique.
- Convertir les décimales à virgule, lire des champs séparés par des points-virgules et interpréter les dates du fichier.
- Arrondir les heures à la minute et ignorer les clés déjà présentes grâce à la clé `(jour, heure)` et à `INSERT IGNORE`.
- Détecter un début de cycle lors du passage du statut vers `4`.

**Limites** : réimporter ne signifie pas mettre à jour une mesure déjà présente; l'import en masse concerne des fichiers préalablement déposés côté serveur. Les fichiers d'import sont actuellement partagés via des noms fixes.

Sources : [amImpBoiler.js](../js/amImpBoiler.js), [amImpUsb.js](../js/amImpUsb.js), [amImportMass.js](../js/amImportMass.js), [okofen.class.php](../_include/okofen.class.php#L96).

### F12 — Calcul et recalcul des synthèses

- Détecter les jours disposant de mesures détaillées sans synthèse, hors journée courante.
- Calculer une journée, toutes les journées proposées, ou une période passée choisie.
- Recalculer une synthèse existante lorsque le calcul est forcé.
- Stocker température extérieure min/max, consommation totale/ECS, DJU et nombre de cycles.
- Calculer les DJU avec `max(0, température de référence - moyenne des extrêmes)`, arrondis à deux décimales.
- Estimer la consommation à partir du rapport temps de vis/(temps de vis + pause), multiplié par le coefficient configuré; filtrer l'ECS sur le capteur `hotwater[0]`.

**Limites de la logique actuelle** : le jour courant est explicitement refusé; l'ECS est calculée sur le premier circuit identifié. Absence de capteur, division nulle et données partielles nécessitent des tests de caractérisation, pas des changements implicites de formule.

Sources : [amSynthese.js](../js/amSynthese.js), [okofen.class.php](../_include/okofen.class.php#L179), [calculs](../_include/rendu.class.php#L70).

### F13 — Temps réel et configurations chaudière

- Se connecter à la chaudière avec les identifiants enregistrés; saisir de nouveaux identifiants depuis l'interface et réinitialiser la session chaudière.
- Lire version du contrôleur, temps et compteurs du brûleur/allumage, températures extérieure/intérieure et consignes.
- Lire les paramètres confort/réduit, pente/pied de courbe, seuils de coupure, températures de départ, paramètres de vanne mélangeuse, consignes chaudière et puissance.
- Traduire les valeurs énumérées et appliquer les diviseurs/unités transmis par la chaudière.
- Choisir un graphique et ajouter des points par interrogation périodique toutes les trois secondes.
- Charger les bornes d'un paramètre, modifier localement sa valeur et marquer les changements non enregistrés.
- Enregistrer une configuration avec description; dans le parcours normal, appliquer les valeurs modifiées à la chaudière.
- Enregistrer une configuration datée manuellement sans l'appliquer à la chaudière, pour conserver une référence historique.
- Lister, recharger dans l'interface et supprimer les configurations sauvegardées.
- Transformer les valeurs à appliquer selon les diviseurs chaudière; produire les annotations visibles dans les graphiques journaliers.

**Distinction importante** : le service sait recevoir un numéro de circuit pour certains appels, mais l'action AJAX `rt.getIndic` n'en transmet pas et utilise le circuit par défaut. La lecture/changement du mode de chauffage est exposée par l'API distincte, pas par ce routeur AJAX.

Sources : [rt.js](../js/rt.js), [realTime.class.php](../_include/realTime.class.php), [okofen.class.php](../_include/okofen.class.php#L203).

### F14 — Paramètres généraux

- Choisir l'import IP ou fichier local et configurer l'hôte/port chaudière.
- Tester la connexion TCP à la chaudière et proposer un lien vers ses fichiers.
- Configurer fuseau horaire, température de référence DJU, poids de granulés pour 60 secondes de vis et surface du logement.
- Choisir silo/sacs, capacité du silo et seuil d'entretien du cendrier.
- Choisir la langue française ou anglaise; enregistrer la configuration et recharger l'interface.

**Précision** : le formulaire actuel envoie `send_to_web: 0`; ce n'est pas un écran d'activation du transfert FTP.

Sources : [adminParam.php](../adminParam.php), [adminParam.js](../js/adminParam.js), [administration.class.php](../_include/administration.class.php#L29).

### F15 — Accès API pour intégrations

- Le routeur navigateur utilise `type`, `action` et un jeton de session `sid`, avec paramètres GET/POST.
- Un deuxième routeur accepte un jeton d'installation et expose une sélection de lectures ainsi que le changement de mode chaudière.
- Les deux routeurs ne sont pas interchangeables : actions exposées et noms des paramètres peuvent différer.
- La liste exhaustive des branches actives est donnée en section 4; la documentation API historique ne suffit pas à définir le contrat réel.

Sources : [ajax.php](../ajax.php), [api.php](../api.php), [api-doc.md](../api-doc.md).

### F16 — Collecte et synthèses automatiques

- Exécuter le traitement prévu pour le cron.
- En mode IP : parcourir les fichiers chaudière, extraire leur date et considérer la journée complète lorsqu'une mesure existe à `23:59:00`.
- Télécharger/importer les jours jugés incomplets, puis forcer leur synthèse; calculer les jours complets uniquement si nécessaire.
- En mode sans récupération IP : demander la synthèse de la veille.
- Journaliser les traitements.

**Limites** : la présence de la dernière minute ne garantit pas l'absence de trous dans la journée. La fréquence d'exécution n'est pas définie par ce script; elle dépend de l'ordonnanceur de l'installation.

Sources : [cron.php](../cron.php), [complétude et dates](../_include/okofen.class.php#L56), [synthèses](../_include/okofen.class.php#L179).

### F17 — Langues, présentation et messages

- Fournir des libellés français/anglais via dictionnaires PHP/JSON et scripts JS de langue.
- Localiser les calendriers et les libellés de graphiques; formater les nombres et unités.
- Fournir notifications de succès, avertissement et erreur, confirmations de suppression et indicateurs de chargement.
- Proposer navigation responsive et fenêtres modales avec Bootstrap.

**Limite** : certains messages restent écrits en dur en français. Les dictionnaires de correspondance capteurs ne doivent pas être confondus avec de simples traductions : ils servent aussi au protocole chaudière.

Sources : [session.class.php](../_include/session.class.php), [footer.php](../_templates/footer.php), [custom.js](../js/custom.js), [dictionnaires](../_langs/).

### F18 — Maintenance, version et mise à jour

- Afficher les informations de l'application et sa version.
- Vérifier les versions disponibles auprès du serveur distant.
- Lors de cette vérification, envoyer au serveur historique des statistiques incluant source et version de l'installation.
- Proposer l'installation d'une mise à jour, télécharger son archive, simuler les contrôles d'installation, copier les fichiers et exécuter le script d'upgrade lorsqu'il est présent.
- Produire des journaux et mesurer certaines durées de traitement.
- Disposer d'un lanceur de simulation d'upgrade; le script d'upgrade fourni ne contient actuellement pas de migration métier entre ses marqueurs de début et de fin.

Sources : [about.php](../about.php), [about.js](../js/about.js), [administration.class.php](../_include/administration.class.php#L562), [AutoUpdate.class.php](../_include/AutoUpdate.class.php), [simu_upgrade.php](../simu_upgrade.php), [_upgrade.php](../_upgrade.php).

## 4. Inventaire des actions serveur actives

Les identifiants ci-dessous correspondent aux branches `case` actives du code; ils ne constituent pas une proposition d'API REST. Les branches commentées sont exclues.

Le contrôle de couverture retrouve **62 actions dans le routeur navigateur et 22 dans le routeur d'intégration**. Ces nombres comptent les branches par routeur, pas 84 fonctionnalités distinctes : plusieurs actions sont communes aux deux interfaces.

### 4.1 Routeur navigateur

Source : [ajax.php](../ajax.php).

| Domaine | Actions actives | Fonctions |
|---|---|---|
| `admin` — configuration | `admin.testIp`, `admin.saveInfoGe` | Test chaudière et sauvegarde des paramètres |
| `admin` — imports | `admin.getFileFromChaudiere`, `admin.importFileFromChaudiere`, `admin.uploadCsv`, `admin.importcsv`, `admin.getFileFromTmp`, `admin.importFileFromTmp` | Téléchargement, upload et imports |
| `admin` — matrice | `admin.getHeaderFromOkoCsv`, `admin.statusMatrice`, `admin.deleteMatrice` | Consultation, état et suppression |
| `admin` — saisons | `admin.getSaisons`, `admin.existSaison`, `admin.setSaison`, `admin.deleteSaison`, `admin.updateSaison` | Gestion des saisons |
| `admin` — événements | `admin.getEvents`, `admin.setEvent`, `admin.deleteEvent`, `admin.updateEvent` | Gestion du journal |
| `admin` — synthèses | `admin.makeSyntheseByDay`, `admin.getDayWithoutSynthese` | Calcul et journées à calculer |
| `admin` — maintenance | `admin.checkUpdate`, `admin.makeUpdate`, `admin.getVersion` | Vérification, installation et version |
| `admin` — compte | `admin.login`, `admin.logout`, `admin.changePassword` | Session et mot de passe |
| `graphique` — graphiques | `graphique.getLastGraphePosition`, `graphique.grapheNameExist`, `graphique.addGraphe`, `graphique.getGraphe`, `graphique.updateGraphe`, `graphique.updateGraphePosition`, `graphique.deleteGraphe` | Création, consultation et ordre |
| `graphique` — capteurs | `graphique.getCapteurs`, `graphique.grapheAssoCapteurExist`, `graphique.addGrapheAsso`, `graphique.getGrapheAsso`, `graphique.updateGrapheAsso`, `graphique.updateGrapheAssoPosition`, `graphique.deleteAssoGraphe` | Associations, coefficients et ordre |
| `rendu` — journalier | `rendu.getGraphe`, `rendu.getGrapheData`, `rendu.getIndicByDay`, `rendu.getAnnotationByDay` | Liste, séries, indicateurs et annotations |
| `rendu` — historique | `rendu.getIndicByMonth`, `rendu.getHistoByMonth`, `rendu.getTotalSaison`, `rendu.getSyntheseSaison`, `rendu.getSyntheseSaisonTable` | Mois et saisons |
| `rendu` — stock | `rendu.getStockStatus`, `rendu.getAshtrayStatus` | Silo/sacs et cendrier |
| `rt` — lecture | `rt.getIndic`, `rt.getData`, `rt.getSensorInfo` | Indicateurs, points et métadonnées |
| `rt` — identifiants | `rt.setOkoLogin` | Enregistrement des identifiants chaudière |
| `rt` — configurations | `rt.saveBoilerConfig`, `rt.getListConfigBoiler`, `rt.deleteConfigBoiler`, `rt.getConfigBoiler`, `rt.applyBoilerConfig` | Historisation et application chaudière |

### 4.2 Routeur d'intégration distinct

Source : [api.php](../api.php).

| Domaine | Actions actives |
|---|---|
| `admin` | `admin.getFileFromChaudiere`, `admin.getHeaderFromOkoCsv`, `admin.getSaisons`, `admin.checkUpdate`, `admin.getVersion` |
| `graphique` | `graphique.getCapteurs`, `graphique.getGrapheAsso` |
| `rendu` | `rendu.getGraphe`, `rendu.getGrapheData`, `rendu.getIndicByDay`, `rendu.getIndicByMonth`, `rendu.getStockStatus`, `rendu.getAshtrayStatus`, `rendu.getHistoByMonth`, `rendu.getTotalSaison`, `rendu.getSyntheseSaison`, `rendu.getSyntheseSaisonTable`, `rendu.getAnnotationByDay` |
| `rt` | `rt.getIndic`, `rt.getData`, `rt.getBoilerMode`, `rt.setBoilerMode` |

Différences à préserver ou à corriger explicitement :

- Les lectures journalières utilisent `jour` dans le routeur navigateur, contre `day` dans le routeur d'intégration.
- Les saisons utilisent `saison` dans le premier, contre `id` dans le second.
- L'association de capteurs utilise `graphe` côté AJAX, contre `id` côté intégration; les points temps réel utilisent `id` contre `idgraphe`.
- L'API d'intégration transmet `way` pour `rt.getIndic` et `rt.getBoilerMode`.
- Elle exige `way` pour `rt.setBoilerMode`, mais n'en transmet pas la valeur à la méthode appelée : le circuit par défaut reste utilisé. Il s'agit d'une limite actuelle, pas d'un support multicircuit complet.
- Certaines actions mutatrices sont déclenchables par GET; elles ne devront pas être reproduites sans protection dans la cible.

### 4.3 Autres entrées

- Installation : `setup.connect`, `setup.install`, via le paramètre `type` de l'[assistant](../setup.php).
- Collecte/synthèses : [cron.php](../cron.php).
- Outil de simulation : [simu_upgrade.php](../simu_upgrade.php).

## 5. Données fonctionnelles existantes

| Table | Rôle |
|---|---|
| `oko_user` | Compte, type utilisateur et identifiants chaudière |
| `oko_saisons` | Dates et libellés des saisons |
| `oko_dateref` | Calendrier pour les jours sans mesure/synthèse |
| `oko_historique_full` | Mesures par jour/minute, timestamp et colonnes dynamiques de capteurs |
| `oko_capteur` | Nom, correspondance CSV, colonne historique, type métier et identifiant chaudière |
| `oko_graphe` | Graphiques et ordre d'affichage |
| `oko_asso_capteur_graphe` | Courbes, ordre et coefficient par graphique |
| `oko_resume_day` | Synthèses journalières |
| `oko_silo_events` | Journal des livraisons, sacs et entretiens |
| `oko_boiler` | Configurations chaudière horodatées et descriptions |

Source : [install.sql](../install/install.sql). Les paramètres non métier et secrets d'installation sont également répartis entre les fichiers PHP/JSON, les cookies chaudière et la session PHP.

## 6. Code présent mais non assimilable à une fonctionnalité active

| Capacité | État observé |
|---|---|
| Transfert d'un CSV par FTP | Classe [oko2ftp](../_include/oko2ftp.class.php) et constantes présentes, mais aucun appel actif retrouvé; le [formulaire de paramètres](../js/adminParam.js) force la désactivation. |
| Prédiction de date d'épuisement du silo | Calcul et affichages commentés dans le [rendu stock](../_include/rendu.class.php#L242) et l'[historique](../js/histo.js#L213). |
| Anciennes actions de migration de données | Branches `getDateForMigrate`, `migrateDataForDate` et `importFileFromUpload` commentées dans le [routeur AJAX](../ajax.php). |
| Export PDF/Excel, rapports programmés ou alertes mail | Pas de parcours applicatif raccordé identifié. La présence de modules tiers d'export dans le dépôt ne suffit pas à établir une fonction produit. |
| Gestion multi-installations, multiutilisateurs avancée ou circuits arbitraires dans l'interface | Non établie; distinguer les paramètres de certaines méthodes d'un parcours réellement disponible. |

## 7. Utilisation de cet inventaire pour la migration

Chaque fonctionnalité F01–F18 doit recevoir une destination dans la cible, un scénario de validation et un traitement explicite de ses limites actuelles. La conservation fonctionnelle n'impose pas de conserver l'installation destructive, les erreurs, les faiblesses d'autorisation ou les transmissions de statistiques sans décision.

Les fonctionnalités dormantes ne sont pas incluses automatiquement dans le périmètre de réécriture. Toute réactivation ou nouvelle fonction doit faire l'objet d'une décision distincte.
