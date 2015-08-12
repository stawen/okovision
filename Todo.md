# Nouvelles fonctionnalitées  #

1. Creation des graphiques (Front Page)
	* OK - choix du nom du graphique
		* OK - choix des données a mettre dans le graphique

2. Configuration
	* OK - Choisir la T°C de reference
	* OK - Choisir le poids de pellet pour 60 secondes de vis tremi
	* OK - definir saison de chauffage
  	* OK - Chemin http de la chaudiere (Ip ou Nom)
	* OK - Parametrage BDD
	* OK - Association structure fichier CSV de l'installation Okofen avec le nom des colonnes
	* OK - Transfert csv sur serveur distant (Oui / non)+
	 
	
3. Actions Manuelles
	* Recuperation csv depuis la chaudiere
		* OK - Liste les fichiers presents sur la chaudieres
		* Choisir le fichier a importer (si date fichier different de date du jour alors faire la synthese automatiquement)
	* OK - Import du CSV depuis upload via interface web
	* Faire la synthese journaliere
		* OK - Afficher les jours n'ayant pas de synthese journaliere
		* OK - Choisir un jour precis pour mettre a jour la synthese
		 

# Ordre de priorité de dev (du haut vers le bas)#

* OK - Creation d'un fichier de configuration -> json (T°c ref,POIDS_PELLET_PAR_MINUTE,CONTEXT,URL_CHAUDIERE,GET_CHAUDIERE_DATA, SEND_TO_WEB), les connexions bdd et ftp ne seront pas dedans
* OK - Ecran de parametrage pour gerer les données du fichier json
* OK - Prevoir un ecran d'install si json pas present, et creation du fichier config.php
* OK - Revision de la structure des données
* OK - Traduction des colonnes dans le CSV et identification du patern de nommage du constructeur
* OK - Ecran de matrice de correspondance csv pour import des données
* OK - Import manuel du fichier csv distant
* OK - Creation page des saisons
* OK - Page de creation graphique + indicateur dedans
* OK - Ecran de Declenchement synthese journaliere pour les jours n'existant pas
* OK - Ecran de synthese , ne pas proposer la date du jour
* Page de synthese
* Import d'un csv via interface http chaudiere 