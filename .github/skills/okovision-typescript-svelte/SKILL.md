---
name: okovision-typescript-svelte
description: Applique les conventions TypeScript strict et Svelte 5 du dépôt OkoVision pour ajouter, corriger ou relire du code, des composants et des routes.
---

# Développement TypeScript et Svelte dans OkoVision

Utilise ce skill pour les changements TypeScript, Svelte, SvelteKit, composants,
routes, tests et revues de code dans ce dépôt. Réponds en français.

## Conventions du dépôt

Avant de modifier du code, lis les fichiers concernés et leurs tests, puis
consulte [`AGENTS.md`](../../../AGENTS.md) et les exemples voisins. Le code
existant et ses conventions priment sur les exemples de ce skill.

- TypeScript est strict (`tsconfig.json`). Garde les types explicites aux
  frontières, utilise les types générés SvelteKit (`PageProps`, `PageServerLoad`,
  `Actions`) et préfère les unions discriminées, gardes de type et valeurs
  `null` explicites aux casts non sûrs ou aux états ambigus.
- Le projet utilise Svelte 5 en mode runes. Utilise `$state`, `$derived` et
  `$effect` selon leur rôle; réserve `$effect` aux effets secondaires et
  nettoie les abonnements, temporisateurs ou requêtes asynchrones. Préfère la
  syntaxe d'événements Svelte 5 (`onclick`, `onchange`) aux directives legacy.
- Respecte les frontières SSR : données initiales et opérations serveur dans
  `+page.server.ts`/`+server.ts`; DOM, `window` et bibliothèques navigateur
  seulement côté client, généralement dans `onMount`. Ne mets pas de secret ou
  de logique serveur dans un composant client.
- Pour les accès métier, passe par `getDataAccess()` et les repositories
  existants. Un repository reçoit uniquement les méthodes SQL nécessaires;
  injecte un faux client dans les tests. Ne crée ni pool par requête ni état
  variable de requête dans l'assemblage partagé.
- Utilise les alias `#lib` pour les imports internes comme le font les fichiers
  voisins. Centralise les textes d'interface dans `src/lib/ui/i18n.ts`,
  `src/lib/ui/setup.ts` ou `src/lib/server/messages.ts`, selon leur usage.
- Valide et type les entrées externes (formulaires, URL, JSON, base) avant
  usage. Paramètre les valeurs SQL; ne concatène jamais une entrée utilisateur
  dans une requête. Préserve l'indisponibilité réelle des données au lieu de
  fabriquer une valeur par défaut qui ressemble à une mesure valide.
- Dans les routes serveur, utilise les primitives SvelteKit (`error`,
  `redirect`) et les protections du domaine. Les erreurs doivent être
  journalisées avec le logger structuré et un événement connu; ne masque pas
  une erreur avec un fallback de succès ni n'expose les détails internes à
  l'interface.
- Pour l'interface, réutilise composants et styles existants et préserve
  l'accessibilité : labels, noms accessibles, navigation clavier et focus
  visible. Garde les textes traduisibles et respecte les états chargement,
  erreur, vide et données indisponibles.

## Méthode de changement

1. Identifie la frontière concernée (UI, route serveur, domaine, repository)
   et suis un exemple existant du même type.
2. Fais un changement ciblé; n'ajoute pas d'abstraction ou de dépendance sans
   besoin concret. Garde les règles métier hors du composant quand elles ont
   une responsabilité serveur ou sont réutilisées.
3. Ajoute ou adapte quelques tests ciblés pour le comportement introduit,
   notamment les entrées invalides, les résultats absents et les erreurs
   pertinentes. Les tests de repository injectent un faux client; ne dépends
   pas d'une vraie base pour un test unitaire.
4. Lance `npm run check` et `npm run lint`. Lance les tests ciblés avec
   `npm run test:unit -- --run <fichier-de-test>`; utilise `npm run build`
   lorsque le changement touche les routes, le rendu compilé ou la production.
5. Termine par `git diff --check` et relis le diff pour confirmer que seuls les
   comportements demandés ont changé. Signale les vérifications réellement
   exécutées et toute limite de validation.
