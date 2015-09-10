## V1.0.1


## V1.0.0

1. Creation des graphiques (Front Page)
	* choix du nom du graphique
	* choix des données à mettre dans le graphique

2. Configuration
	* Choisir la T°C de reference
	* Choisir le poids de pellet pour 60 secondes de vis tremi
	* Definir saison de chauffage
  	* Chemin http de la chaudiere (Ip ou Nom)
	* Parametrage BDD
	* Association structure fichier CSV de l'installation Okofen avec le nom des colonnes
	* Transfert csv sur serveur distant (Oui / Non)
	 
	
3. Actions Manuelles
	* Recuperation csv depuis la chaudiere
		* Liste les fichiers presents sur la chaudieres
		* Choisir le fichier a importer (si date fichier different de date du jour alors faire la synthese automatiquement)
	* Import du CSV depuis upload via interface web
	* Faire la synthese journaliere
		* Afficher les jours n'ayant pas de synthese journaliere
		* Choisir un jour precis pour mettre a jour la synthese

4. A propos
    * Mise en place un mecanisme de maj automatique d'okobision en OTA (Over The Air)
    * Afficher les fixto dans chaque version
