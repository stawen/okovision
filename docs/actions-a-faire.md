# Actions à faire

## Premier lancement et suivi des mises à jour de la base

- Utiliser `npm run appsetup` avec le fichier privé `.env.appsetup` pour démarrer
  l'application contre une base locale sans tables ni données. Ce mode est
  distinct du développement avec fixtures et ne doit jamais réinitialiser une
  base existante. Voir le [guide local](./installation-et-exploitation.md#tester-le-premier-lancement-avec-une-base-vierge).
- Porter le provisioning initial dans le setup : vérifier la connexion définie
  par les variables d'environnement, détecter une base vierge, créer le schéma
  et les seules données de référence nécessaires, puis initialiser le compte
  administrateur sans mot de passe public ni mesures de démonstration.
- Prévoir dès ce provisioning des migrations versionnées et un registre
  persistant des migrations appliquées (identifiant, date et résultat), afin de
  suivre aussi les futures mises à jour. Séparer installation, mise à niveau
  d'un schéma reconnu et refus d'un schéma inconnu ou incompatible.
- Sérialiser les migrations et prévoir sauvegarde, erreurs explicites et reprise
  après échec, en tenant compte des DDL non transactionnelles de MySQL/MariaDB.
  Ne pas marquer une migration échouée comme appliquée; ne jamais réutiliser le
  SQL historique destructif comme mécanisme de mise à jour.
- Tester sur bases jetables : installation vierge, second lancement sans
  réinitialisation, mise à niveau préservant les données, échec/reprise et suivi
  des versions. La page setup actuelle reste descriptive tant que ce parcours
  n'est pas implémenté.

## Écarts avec le site de référence

Le [site de présentation d'Okovision](https://bertrandgorge.github.io/okovision/)
décrit des fonctionnalités plus larges que celles actuellement portées dans
cette migration. La liste ci-dessous les compare à l'[état à date](./etat-a-date-de-la-migration.md)
du dépôt; la présence d'une fonction sur le site ne signifie pas qu'elle est
déjà disponible ici.

### Déjà en place dans cette migration

- Tableau de bord journalier avec graphiques configurés, mesures et annotations;
  zoom et déplacement synchronisés, indicateurs recalculés sur la plage choisie.
- Consultation de l'historique mensuel et saisonnier, avec graphiques et
  récapitulatifs.
- Indicateurs calculés de stock et de cendrier, saisons, événements et
  configuration des graphiques.
- Import des CSV disponibles sur la chaudière configurée, suivi des tâches et
  collecte planifiée en mode IP.
- Connexion membre, pages privées, endpoints de santé/recalcul et page
  d'information sur la version.

Ces fonctions restent soumises aux limites et validations décrites dans l'état
de migration; elles ne prouvent pas à elles seules la parité avec l'application
historique ni le fonctionnement sur une installation réelle.

### À porter ou compléter d'après le site de référence

- **Journée détaillée** : frise des états du brûleur et des pompes, graphiques de
  combustion, détection et caractérisation des cycles (dont les allumages à
  froid), et synthèse journalière complète avec cycles et DJU.
- **Analyse du chauffage** : page dédiée expliquant les arrêts et reprises à
  partir des limites de chauffe, de la consigne et de l'hystérésis d'ambiance,
  des plages horaires et des états du brûleur/pompes; relier les courbes aux
  réglages actifs et à leurs explications.
- **Loi d'eau et optimisation** : calcul et visualisation de la courbe, analyse
  des consignes réellement produites, accompagnement au réglage, estimation du
  besoin de la maison et recommandations chiffrées sur les cycles courts.
- **Eau chaude sanitaire** : analyse des températures, consignes, plages et
  charges du ballon, suivi des cycles anti-légionelles et explication des
  réglages associés.
- **Historique enrichi** : comparaison des saisons en kilogrammes, euros, DJU
  et consommation rapportée aux DJU; vérifier et compléter les agrégats déjà
  portés.
- **Prévisions du silo et du cendrier** : reconstituer puis projeter le stock et
  le remplissage du cendrier, estimer les dates d'épuisement et de vidage et
  signaler les dépassements de capacité.
- **Comparaison des lots de granulés** : calculer des indicateurs de consommation
  corrigés de la météo et l'énergie relative, par période entre livraisons.
- **Catalogue et programmation des réglages** : présenter les réglages, bornes,
  valeurs conseillées et d'usine, puis les programmes horaires, soirée et
  vacances; prévoir relecture et journalisation pour toute écriture.
- **Alertes et notifications** : règles sur les défauts, l'indisponibilité, les
  mesures, le stock, le cendrier, les températures, les cycles et l'entretien;
  canaux e-mail, Slack, Telegram ou webhook signé.
- **Diagnostic exportable** : produire un rapport Markdown d'installation,
  réglages, cycles et mesures pour analyse externe, sans exposer de secrets.
- **Archivage et reprise de données** : archiver les mesures anciennes et
  définir un import de l'historique d'Okovision v1, avec contrôles et essais sur
  une copie isolée.
- **Installation guidée** : compléter la page descriptive par un parcours
  d'installation et de validation de configuration sûr, sans réexécuter le SQL
  historique destructif sur une base existante.

Ces ajouts sont des pistes à cadrer, pas une autorisation à piloter la
chaudière. Les écritures de réglages et tout pilotage expérimental nécessitent
une décision explicite, des permissions, des garde-fous et des essais isolés
avant toute implémentation.

## Apports du dépôt `bertrandgorge/okovision`

Le [dépôt de l'application](https://github.com/bertrandgorge/okovision) complète
le site par son code et sa [documentation de conception](https://github.com/bertrandgorge/okovision/blob/main/docs/CONCEPTION.md).
Il s'agit d'une réécriture Laravel/PHP avec un schéma propre, pas d'un portage
direct vers SvelteKit. Surtout, sa documentation cible le Pelletronic Touch
V02.00j : son client lit les CSV et utilise l'API web du régulateur pour les
réglages. Ce dépôt n'est donc pas une implémentation de l'API JSON V4 décrite
dans la section suivante.

### Évolutions pertinentes à intégrer aux actions

- **Import de l'historique** : préciser la procédure de reprise depuis une base
  source isolée, avec correspondance des capteurs par en-tête et type, import
  par lots, reprise des événements et profils, puis recalcul des synthèses et
  calibration. Comparer les volumes importés et des indicateurs représentatifs
  avant d'accepter la reprise; ne jamais lancer la migration sur la base en
  service.
- **Historique des réglages** : enregistrer des profils datés après une
  modification et à intervalles réguliers, sans dupliquer les profils
  inchangés. Les exploiter pour retrouver les réglages effectifs au moment
  d'une mesure et afficher clairement quand une valeur n'est qu'un dernier
  relevé ancien ou indisponible.
- **Modèle de loi d'eau** : caractériser la formule et la courbe apprise à
  partir des relevés, avec nombre de points, plage de températures et qualité
  d'ajustement. La formule du dépôt est identifiée empiriquement sur une
  installation V2 et un circuit; la vérifier sur nos références avant de
  l'appliquer à d'autres firmwares ou configurations.
- **Catalogue chaudière** : documenter par variable le type, l'unité, le
  diviseur, les bornes, les choix et le caractère modifiable. Pour toute
  écriture autorisée, conserver validation, simulation, relecture après
  écriture et journal des changements; conserver le mode lecture seule tant
  que ces garde-fous ne sont pas validés.
- **Archives restaurables** : compléter l'action d'archivage par des essais de
  relecture et restauration, contrôle des lignes et empreintes, et vérification
  que les vues historiques restent cohérentes après purge. Sauvegarder aussi
  configuration et fichiers d'archives avant une mise à jour ou purge.

### À décider séparément

- Le dépôt utilise des liens de connexion à usage unique envoyés par e-mail.
  Évaluer ce parcours comme une option d'authentification, avec expiration,
  consommation unique, limitation des demandes et dépendance au service mail;
  ne pas remplacer le parcours de connexion existant sans décision.
- Le déploiement Laravel/PHP et ses tables propres ne sont pas à reprendre tels
  quels : garder l'architecture Node/SvelteKit et le schéma historique tant
  qu'une migration de données explicite et validée n'est pas décidée.

## Compatibilité ÖkoFEN Touch avec le firmware V4

Le fork [`nicouchot/okovision-ha-api`](https://github.com/nicouchot/okovision-ha-api)
documente une intégration V4.00b par API JSON : configuration d'un port et
d'un mot de passe, récupération des journaux via `log0` et lecture des valeurs
instantanées via `/all?`. Le [legacy](../archive/php/pensebete.md) s'appuie sur
les CSV HTTP du Touch et indique que l'accès aux journaux change à partir du
firmware 4; le portage actuel liste encore les CSV de
`/logfiles/pelletronic/` dans [boiler-import.ts](../src/lib/server/boiler-import.ts).

La documentation de l'[API JSON ÖkoFEN](https://github.com/chaozmc/oekofen-json-documentation)
est communautaire, issue en partie d'essais et comporte des champs non décrits.
Le fork décrit lui-même `log0` de façons différentes selon les passages
(fichier de la veille ou fenêtre glissante de 24 h). Il faut vérifier ces
comportements sur des réponses anonymisées du firmware réellement ciblé avant
de figer le contrat.

### Priorité — acquisition et import V4 en lecture seule

- Caractériser les versions V4 visées, les réglages nécessaires à l'API JSON,
  les réponses de `log0` et `/all?`, leur encodage, leurs unités, les champs
  absents et la fréquence de requêtes acceptée. Ne pas considérer V4.00b comme
  preuve de compatibilité avec toutes les variantes V4.
- Ajouter un mode d'acquisition configurable qui préserve les chemins CSV V2/V3.
  Garder les ports et mots de passe dans la configuration privée, sans les
  versionner ni les écrire dans les journaux.
- Créer un adaptateur V4 séparant transport, validation JSON et normalisation
  métier. Faire correspondre les clés structurées (chaudière, circuits de
  chauffage, ECS, etc.) aux capteurs existants plutôt que reprendre le mapping
  à positions fixes du fork.
- Caractériser les facteurs d'échelle et les valeurs énumérées; distinguer une
  mesure égale à zéro d'une donnée absente ou invalide, sans remplacer cette
  dernière par un zéro plausible.
- Importer les journaux V4 avec contrôle de complétude, bornes de journée et
  fuseau, dédoublonnage, reprise après téléchargement partiel et erreurs
  explicites. Confirmer d'abord la signification réelle de `log0` avant de
  décider comment compléter ou recalculer une journée.
- Ajouter des fixtures anonymisées V2/V3/V4 et tester la normalisation, les
  capteurs manquants, plusieurs circuits, les limites de date, les doublons,
  les réponses HTTP/JSON invalides et les reprises, sans chaudière en service.

### Complément — données instantanées et affichage temps réel

- Évaluer séparément l'ingestion périodique de `/all?` pour alimenter la
  journée courante; respecter une limite de fréquence mesurée, avec délai
  d'expiration et reprises bornées plutôt que des appels rapprochés.
- Si ces instantanés sont enregistrés, calculer les débuts de cycle à partir
  des transitions chronologiques de statut, y compris au changement de jour.
  Tester les réimports et éviter qu'une ligne isolée ou un redémarrage du
  processus crée de faux cycles.
- Compléter le temps réel en lecture seule à partir des champs V4 validés.
  L'application de réglages à la chaudière et toute commande restent exclues
  jusqu'à une décision et une validation de sécurité distinctes.

L'API Home Assistant et les calculs supplémentaires d'énergie/coût du fork
(kWh, cumuls et prix FIFO) ne sont pas requis pour la compatibilité V4. Les
évaluer comme fonctionnalités indépendantes, après validation de leurs besoins,
formules et impacts sur les données historiques.

## Clarifier le stockage de la configuration

- La configuration est actuellement lue depuis `config.json`. L'architecture cible ne prévoit pas de modification du schéma métier; décider d'abord si un besoin concret justifie de déplacer certains paramètres en base.
- Si cette évolution est retenue, définir les champs, les droits et la procédure de migration avant toute modification du schéma. Tester les écritures et la migration uniquement sur une copie isolée et sauvegardée.
- Pour les tests de connexion, utiliser les paramètres du fichier privé `.env` sans les recopier dans le dépôt. Sur la base existante, limiter les vérifications à la lecture.
