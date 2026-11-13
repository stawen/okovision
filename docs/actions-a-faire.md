# Actions à faire

## Clarifier le stockage de la configuration

- La configuration est actuellement lue depuis `config.json`. L'architecture cible ne prévoit pas de modification du schéma métier; décider d'abord si un besoin concret justifie de déplacer certains paramètres en base.
- Si cette évolution est retenue, définir les champs, les droits et la procédure de migration avant toute modification du schéma. Tester les écritures et la migration uniquement sur une copie isolée et sauvegardée.
- Pour les tests de connexion, utiliser les paramètres du fichier privé `.env` sans les recopier dans le dépôt. Sur la base existante, limiter les vérifications à la lecture.
