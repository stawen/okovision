# Actions à faire

## Déplacer la configuration JSON en base

- Prévoir une table pour les informations actuellement conservées dans `config.json`, puis adapter l'application pour les lire en base.
- Définir les champs, les droits et la procédure de migration avant toute modification du schéma. Tester les écritures et la migration uniquement sur une copie isolée et sauvegardée.
- Pour les tests de connexion, utiliser les paramètres du fichier privé `.env` sans les recopier dans le dépôt. Sur la base existante, limiter les vérifications à la lecture.
