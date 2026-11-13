# État à date de la migration

**Date du bilan : 13 novembre 2026**

Ce document distingue les fonctions effectivement présentes dans le dépôt des
éléments seulement prévus par l'architecture cible. Il s'appuie sur le code,
les tests et la documentation disponibles à cette date, notamment l'[inventaire
fonctionnel](./inventaire-fonctionnel-actuel.md), l'[architecture
cible](./architecture-cible-svelte-node.md), l'[analyse de faisabilité](./analyse-technique-et-faisabilite-node-svelte.md),
le [README](../README.md) et les [actions à clarifier](./actions-a-faire.md).

La présence d'une page, d'un repository ou d'un test unitaire ne constitue pas
à elle seule une preuve de parité avec PHP ni une validation sur une base ou une
chaudière réelle. Aucun test contre une installation en service, aucune bascule
et aucune validation opérationnelle complète ne sont établis par ce bilan.

## Synthèse

La migration est bien engagée : le PHP historique est archivé, le nouveau
socle SvelteKit/Node est en place et plusieurs domaines métier sont utilisables,
notamment le tableau de bord, l'historique en lecture, les graphiques, les
saisons, les événements et l'import depuis la chaudière. La collecte IP et les
traitements asynchrones ont également été portés à un premier niveau.

**La migration n'est pas terminée et n'est pas prête pour une bascule de
production.** Plusieurs fonctions historiques ne sont pas portées ou ne le
sont que partiellement; la parité, les scénarios de reprise, la sécurité, la
persistance d'exploitation et les déploiements avec les deux modes de base
doivent encore être démontrés.

## Réalisé

### Dépôt et socle technique

- L'application PHP historique est conservée dans [`archive/php/`](../archive/php/)
  comme référence; la nouvelle application ne la charge pas et ne l'exécute pas.
- Le socle SvelteKit, Svelte 5, TypeScript strict, `adapter-node`, Vite, ESLint
  et Vitest est installé avec versions verrouillées.
- La navigation, la mise en page, les langues FR/EN, le thème inspiré de
  l'application historique et les pages de transition sont en place.
- L'accès MySQL est organisé autour d'un pool partagé et de repositories par
  domaine. Les lectures métier conservent les tables et colonnes historiques;
  aucun changement du schéma métier n'est inclus dans ce portage.
- Des tests unitaires couvrent déjà plusieurs domaines : accès aux données,
  authentification, graphiques, historique, saisons, événements, chaudière,
  imports et jobs, entre autres.
- Une image Docker multi-stage et les compositions de base distante ou MariaDB
  locale existent. Elles constituent un socle préparé, pas une preuve de
  déploiement complet avec données métier.

### Fonctionnalités déjà portées

| Domaine | État constaté |
|---|---|
| Tableau de bord journalier (F03) | Lecture des graphiques configurés, mesures et annotations; zoom et déplacement synchronisés; recalcul des indicateurs sur la plage sélectionnée; états vides et erreurs signalés. |
| Historique mensuel et saisonnier (F04–F05) | Lecture des synthèses existantes, graphiques et récapitulatifs. Les périodes sans données et certaines règles historiques sont conservées; l'écran reste en lecture seule. |
| Indicateurs de stock et cendrier (F06) | Calculs à partir des événements et synthèses, avec état indisponible lorsque les informations nécessaires manquent; ce ne sont pas des mesures physiques en temps réel. |
| Saisons (F08) | Consultation, création, modification et suppression des saisons depuis l'espace privé. |
| Graphiques journaliers (F09) | Gestion des graphiques et de leurs capteurs, coefficients et ordre. Le déplacement accessible par commandes remplace le glisser-déposer historique. |
| Événements (F07) | Consultation, création, modification et suppression des événements d'approvisionnement et d'entretien pris en charge par le modèle existant. |
| Import chaudière (partie de F11) | Liste des fichiers CSV journaliers de la chaudière configurée; demande d'import mise en file et suivi de tâche. Le flux conserve le mapping historique, l'arrondi à la minute et le dédoublonnage des relevés. |
| Collecte planifiée (partie de F16) | Ordonnanceur IP intégré au processus Node et tâches persistées dans le stockage applicatif; la collecte complète seulement les journées considérées incomplètes et déclenche les synthèses prévues. |
| Connexion membre (partie de F02) | Connexion compatible avec les empreintes historiques, session propre à Node, protection des routes privées et déconnexion par POST. Les comptes et mots de passe historiques ne sont pas modifiés. |
| API et pages transverses (parties de F15/F17/F18) | Endpoint de vitalité, endpoint de recalcul des indicateurs, messages localisés, journalisation applicative et page d'information/version. La vitalité HTTP ne valide pas la base. |

### Vérifications déjà documentées

Le [guide d'installation et d'exploitation](./installation-et-exploitation.md)
rapporte que le socle initial a passé contrôle de types, lint, deux tests SSR
et build `adapter-node`, et que les contrôles HTTP, le rendu aux formats
bureau/mobile et l'absence d'accès public à l'archive ont été vérifiés à
l'initialisation. Le serveur a également été démarré à partir du seul build de
production. Ces vérifications précèdent les ajouts métier successifs : elles
ne remplacent pas une validation complète de l'état courant.

L'audit initial rapporté signalait 14 alertes dans les dépendances de
développement (4 faibles et 10 modérées, notamment `deepmerge` et `minimatch`)
et aucune vulnérabilité avec `npm audit --omit=dev`. Cet état est historique :
il faut relancer l'audit avant une livraison.

## Couverture fonctionnelle et travaux restants

| Réf. | État au 13 novembre 2026 | Reste principal |
|---|---|---|
| F01 — Installation | Setup sans jeton ni connexion préalable, disponible uniquement tant que l'installation est incomplète; détection du schéma, formulaire de configuration en base et compte admin avec mot de passe choisi. Une base partielle exige une confirmation de réinstallation destructive. | Compléter calendrier et matrice des capteurs; reprise après DDL interrompue et contrôle complet des schémas incompatibles. Réserver les essais aux bases isolées sauvegardées. |
| F02 — Connexion et compte | Connexion et routes privées portées en partie. | Changement/réinitialisation de mot de passe, gestion plus complète des comptes et décision sur la persistance des sessions; tests de sécurité et parcours de récupération. |
| F03 — Journalier | Portage fonctionnel des lectures et graphiques. | Comparaison systématique des valeurs et cas limites avec des références PHP représentatives; validation sur plusieurs capteurs et firmwares. |
| F04 — Historique mensuel | Lecture portée. | Parité détaillée des agrégats, bornes de périodes, années et jours sans relevés. |
| F05 — Saisons | Lecture portée. | Parité des totaux, règle d'exclusion du mois courant, arrondis et cas de changement d'heure/année bissextile. |
| F06 — Stock/cendrier | Indicateurs calculés à partir des paramètres et événements disponibles. | Tester les événements manquants, reliquats, données partielles et seuils; améliorer l'explication de l'indisponibilité et ne jamais présenter une estimation comme un état réel. |
| F07 — Événements | CRUD porté pour les types pris en charge. | Vérifier les règles métier et les effets sur stock/cendrier avec des jeux de référence; confirmer les limites de dates, unités et valeurs. |
| F08 — Saisons | CRUD porté. | Caractériser les règles historiques de dates, doublons et suppression; tester les cas calendaires limites. |
| F09 — Graphiques | Gestion des graphiques, associations et coefficients portée. | Vérifier l'ensemble des contraintes métier et la parité de l'ordre/configuration; le glisser-déposer n'est pas repris intentionnellement. |
| F10 — Matrice CSV | Non portée comme outil d'administration complet. | Détection, prévisualisation et mise à jour contrôlée de matrice; gestion des capteurs et colonnes dynamiques; protections, sauvegarde et confirmation avant toute opération destructive. |
| F11 — Imports | Import depuis les fichiers chaudière porté en partie. | Import manuel de CSV local/USB, imports en masse, validation de plusieurs dialectes/firmwares et scénario d'erreur/reprise. Les imports restent limités à 16 Mio et chargés en mémoire. |
| F12 — Synthèses | Calcul automatique déclenché par la collecte porté en partie. | Parcours privé de calcul/recalcul manuel et par période; tests d'équivalence des formules, des valeurs nulles/zéro et de l'ECS. |
| F13 — Temps réel | Début de portage de la lecture des valeurs chaudière. | Parité complète des lectures, circuit, graphiques temps réel, configurations datées et commandes. Les commandes chaudière ne sont pas portées et ne doivent pas être activées implicitement. |
| F14 — Paramètres généraux | Paramètres lus dans `oko_configuration(param, value)` et saisis lors du setup; `config.json` n'est plus lu par Node. | Porter l'édition après installation et la procédure opérateur pour les secrets chaudière. |
| F15 — API d'intégration | Quelques endpoints natifs existent; les anciens routeurs ne sont pas repris. | Identifier les consommateurs de `ajax.php` et `api.php`, spécifier les contrats nécessaires, migrer les clients et valider les permissions avant bascule. |
| F16 — Collecte automatique | Collecte IP et gestionnaire de tâches intégrés présents. | Porter le mode sans IP si requis; tester les interruptions, la reprise, le mono-écrivain et MyISAM; monter et sauvegarder le stockage des jobs dans les déploiements. |
| F17 — Langues et présentation | Langues FR/EN centralisées dans les parties portées. | Étendre et vérifier la couverture des pages restantes, l'accessibilité clavier, les messages d'erreur et l'affichage mobile. |
| F18 — Maintenance/version | Page d'information et visualisation des mises à jour disponibles. | Définir la politique de version et le processus de livraison/retour arrière. L'auto-mise-à-jour historique et l'envoi de statistiques ne sont pas reconduits. |

## Chantiers préalables à toute mise en service

1. **Références et parité métier**
   - Constituer des fixtures anonymisées couvrant matrices, firmwares, journée
     partielle/complète, réimport, trous de relevés, ECS absente, valeurs nulles
     ou nulles au sens numérique, changements d'heure et années bissextiles.
   - Comparer les résultats PHP et Node sur les mesures, indicateurs, synthèses,
     saisons, stock et cendrier aux précisions réellement stockées.
   - Documenter les versions et volumes MySQL/MariaDB effectivement rencontrés.

2. **Fiabilité des imports et jobs**
   - Tester sur copie isolée les écritures MyISAM, erreurs à mi-parcours,
     dédoublonnage, reprise après arrêt et absence de succès trompeur.
   - Mesurer la latence HTTP et l'occupation mémoire pendant un import
     représentatif; passer à une lecture CSV en streaming si les seuils
     opérationnels l'exigent.
   - Rendre persistants les répertoires de configuration et de jobs dans les
     compositions Docker, avec permissions, sauvegarde et rétention définies.
   - Vérifier qu'un seul processus planifie et écrit, et que l'ancien cron PHP
     est arrêté avant toute activation de la collecte Node.

3. **Sécurité et accès**
   - Compléter les tests d'authentification, permissions, protection CSRF,
     limitation de débit, validation de fichiers et absence de secrets dans les
     logs ou réponses.
   - Décider d'une stratégie de modernisation des mots de passe et secrets
     chaudière compatible avec le retour arrière; ne pas modifier les données
     d'une installation en service durant les essais.
   - Recenser et contrôler les routes mutatrices, y compris les endpoints JSON,
     et documenter les consommateurs d'API externes.

4. **Exploitation et livraison**
   - Démontrer les modes Compose avec MariaDB locale et base distante TLS, sans
     création implicite de schéma ni repli silencieux.
   - Tester les volumes, sauvegarde/restauration, healthchecks séparés entre
     vitalité HTTP et disponibilité DB, arrêt gracieux, logs et surveillance.
   - Définir une procédure de déploiement mono-instance, de retour à PHP et de
     retour arrière des données/configurations.
   - Refaire l'audit des dépendances de développement (l'audit initial rapportait
     14 alertes, sans vulnérabilité de dépendance de production) et confirmer les
     conditions de licence des bibliothèques graphiques.

## Axes d'amélioration

### Priorité avant bascule

- Faire des tests de caractérisation et de parité une porte de passage pour
  chaque domaine, plutôt que conclure à partir de la seule présence des écrans.
- Réduire le risque de traitements partiels : streaming/batches si nécessaire,
  verrous cohérents entre mutations et jobs, progression persistée et essais
  de restauration sur une copie.
- Compléter la persistance et l'exploitation Docker (configuration, jobs,
  rétention, permissions, sauvegardes); les fichiers Compose actuels ne montent
  pas encore tous ces éléments.
- Formaliser permissions, CSRF, limites d'import et migration des clients API
  avant d'exposer les opérations en production.

### Qualité fonctionnelle et maintenabilité

- Unifier les contrats de lecture et les messages d'erreur sans introduire de
  routeur générique de compatibilité PHP.
- Compléter la matrice de couverture F01–F18 par parcours, jeux de données et
  critères mesurables d'acceptation.
- Distinguer visuellement données absentes, configuration incomplète, erreur de
  connexion et chaudière indisponible; conserver l'interdiction de simuler des
  mesures.
- Étendre les vérifications responsive et clavier aux écrans privés et aux
  formulaires nouvellement portés.
- Mesurer les performances avant d'ajouter un worker ou une infrastructure
  supplémentaire; la cible actuelle est un seul processus applicatif.

## Décisions documentaires à clarifier

- Une première version d'[actions-a-faire.md](./actions-a-faire.md) proposait
  de déplacer la configuration JSON en base, alors que l'architecture cible
  conserve le schéma métier existant et que l'application actuelle lit
  `config.json`. Le document a été reformulé en **décision à prendre**, pas en
  chantier approuvé : préciser les besoins de partage, de sauvegarde et de
  gestion avant d'envisager une nouvelle table.
- Les documents d'architecture décrivent en partie une cible souhaitée
  (bibliothèques, endpoints, sécurité, Docker et POC). Les termes « retenu » ou
  « prévu » dans ces sections ne prouvent pas que la fonctionnalité est
  implémentée.
- Le guide d'installation et d'exploitation décrit les limites opérationnelles
  courantes; toute nouvelle validation doit être datée et indiquer son
  environnement, notamment si elle a été faite sur copie isolée ou simulateur.

## Conclusion

Le projet a dépassé le stade du simple squelette : plusieurs parcours importants
de supervision et d'administration sont portés, et une première chaîne
d'import/collecte asynchrone existe. Le prochain objectif ne devrait pas être
la seule augmentation du nombre de pages, mais la **preuve de parité, de
reprise fiable et de déploiement sûr**. La bascule reste conditionnée aux
validations et décisions listées ci-dessus; l'installation PHP en service doit
rester inchangée jusque-là.
