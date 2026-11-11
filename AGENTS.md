# Guide des agents — OkoVision

## Objectif et méthode

- Réécrire progressivement la supervision de chaudière Ökofen en SvelteKit, sans perturber l'installation PHP existante.
- Répondre en français. Privilégier des modifications ciblées, simples et cohérentes avec le code existant.
- Lire les fichiers concernés et vérifier le diff avant de modifier : conserver les changements de l'utilisateur et ne pas réintroduire une modification annulée.
- Pour une demande visuelle, conserver l'organisation fonctionnelle de l'original tout en modernisant le rendu, plutôt que reproduire son ancien style Bootstrap.
- Les captures servent de références visuelles, pas nécessairement d'assets à intégrer. Ne pas remplacer un élément textuel par une image sans demande explicite.

## Repères du dépôt

- [README.md](./README.md) : démarrage, limites du socle et état de la migration.
- [src/routes/+layout.svelte](./src/routes/+layout.svelte) : marque, navigation publique et pied de page.
- [src/routes/+page.svelte](./src/routes/+page.svelte) : accueil, indicateurs, températures et présentation de la migration.
- [src/app.css](./src/app.css) : styles partagés et adaptations responsive.
- [src/routes/api/v1/health/+server.ts](./src/routes/api/v1/health/+server.ts) : vitalité HTTP, pas disponibilité MySQL.
- [tests/unit/home.test.ts](./tests/unit/home.test.ts) : tests SSR de l'accueil.
- [vite.config.ts](./vite.config.ts) : SvelteKit, compilateur, adapter-node et Vitest.
- [archive/php/](./archive/php/) : sources historiques, référence fonctionnelle uniquement.
- [archive/screenshot/](./archive/screenshot/) : captures de l'application historique.
- [docs/inventaire-fonctionnel-actuel.md](./docs/inventaire-fonctionnel-actuel.md) et [docs/architecture-cible-svelte-node.md](./docs/architecture-cible-svelte-node.md) : inventaire et architecture cible.

## Conventions techniques

- Utiliser Node.js selon [.nvmrc](./.nvmrc) et les contraintes de [package.json](./package.json), avec npm et le lockfile existant.
- Svelte 5 en mode runes, TypeScript strict, SvelteKit 3 et `adapter-node` : un seul processus applicatif Node.js.
- Les imports internes utilisent `#lib`. La configuration SvelteKit est dans `vite.config.ts`, pas dans un nouveau `svelte.config.js`.
- Réutiliser les styles, variables CSS et composants existants avant d'ajouter une abstraction ou une dépendance.
- Ne pas ajouter de bibliothèque métier sans usage concret dans la fonctionnalité portée.
- Ne pas modifier les sorties générées `build/`, `.svelte-kit/` ou `node_modules/`.

## Identité visuelle à préserver

- La marque reste du **texte sélectionnable** : « Oko » vert `#45a85a`, « Vision » bleu `#1596dc`.
- Conserver la flamme SVG à gauche du nom et la rendre verte `#45a85a`. Ne pas remplacer ce groupe par un PNG de logo.
- Garder une barre de navigation sombre, des surfaces claires, des bordures discrètes et des angles légèrement arrondis.
- Préférer une interface sobre et moderne, sans grands espaces ou cartes décoratives qui éloignent les données du graphique.
- Les couleurs historiques restent des repères : bleu pour la consommation, vert pour le maximum extérieur, orange pour le minimum extérieur.

## Organisation de l'accueil

- Garder cet ordre : navigation et choix de journée, alerte de suivi, indicateurs compacts, grand panneau de températures avec légende.
- Les indicateurs doivent être une **bande basse et compacte**, proche de la densité de l'original, pas quatre grandes cartes verticales.
- Afficher libellé et valeur côte à côte, avec une petite pastille colorée et des séparateurs subtils.
- Conserver l'ordre : Conso, dont ECS, T° max ext., T° min ext.
- Sur grand écran, tenir sur une seule ligne ; sur écran étroit, permettre une grille 2×2 sans débordement horizontal.
- Garder les unités `kg` et `°C`, les libellés français et, pour les futures valeurs réelles, un format numérique français.
- Les quatre séries de référence sont : température extérieure, ambiante, consigne ambiante et départ.

## Navigation et fonctionnalités non portées

- Les menus publics historiques sont **Accueil** et **Historique**. Le temps réel et l'administration ne sont pas des menus publics.
- L'accès membre existe dans l'ancienne interface, mais ne pas fabriquer de connexion fonctionnelle tant que l'authentification n'est pas portée.
- L'historique est actuellement signalé comme indisponible ; le lien Migration est conservé comme repère de la transition.
- Ne pas créer de liens morts, de fausses actions ou de liens vers les pages PHP archivées. Signaler clairement l'indisponibilité des fonctions non implémentées.
- Déduire les règles métier et droits d'accès des sources historiques avant de porter une fonctionnalité.

## Données, archive et exploitation

- Tant que la connexion réelle n'est pas implémentée, afficher explicitement les mesures indisponibles : aucune donnée simulée présentée comme réelle.
- Ne pas affirmer que le cendrier est plein, qu'une chaudière est connectée ou qu'une journée contient des relevés sans données vérifiées.
- Conserver les sources de `archive/php/` intactes. Ne pas charger leurs scripts, frameworks ou pages depuis la nouvelle application.
- Ne jamais exposer l'archive, les secrets ou le dépôt entier comme racine statique.
- Ne pas exécuter les SQL historiques ni lancer de reprise de données sur une installation en service. Une migration de données exige une copie isolée et sauvegardée.
- Le premier raccordement métier prévu est en lecture seule ; ne pas ajouter de commande chaudière implicitement.

## Validation

- Ne pas lancer de commandes Docker Compose ; privilégier la validation du code et remettre la partie Docker à plus tard.
- Pour le code Svelte/TypeScript : `npm run check` et `npm run lint`.
- Pour l'accueil : `npm run test:unit -- --run tests/unit/home.test.ts`. Adapter les assertions aux comportements réellement changés, sans affaiblir les garanties d'absence de données simulées et d'accès au PHP archivé.
- Pour une modification affectant le rendu compilé ou les routes : `npm run build`.
- Pour une modification visuelle, vérifier si possible le navigateur sur grand écran et mobile : densité, lisibilité, absence de débordement et états indisponibles.
- Démarrage local : `npm run dev -- --host 127.0.0.1`. Réutiliser un serveur existant si possible et arrêter les processus temporaires lancés pour les vérifications.
- Préserver navigation clavier, focus visible, noms accessibles et lien d'évitement.
- Exécuter `git diff --check` avant de conclure. Rapporter les contrôles réellement effectués et les limites rencontrées ; ne pas annoncer un contrôle visuel s'il n'a pas été possible.
- Une modification documentaire seule ne nécessite pas de build ni de suite de tests.
