# Nouvelles fonctionnalitées  #

1. Creation des graphiques (Front Page)
	* choix du nom du graphique
		* choix des données a mettre dans le graphique

2. Configuration
	* Choisir la T°C de reference
	* Choisir le poids de pellet pour 60 secondes de vis tremi
	* definir saison de chauffage
  	* (Chemin http de la chaudiere (Ip ou Nom))
	* (Parametrage BDD)
	* Association structure fichier CSV de l'installation Okofen avec le nom des colonnes
	* Transfert csv sur serveur distant (Oui / non)+
	 
	
3. Actions Manuelles
	* Recuperation csv depuis la chaudiere
		* Liste les fichiers presents sur la chaudieres
		* Choisir le fichier a importer (si date fichier different de date du jour alors faire la synthese automatiquement)
	* Import du CSV depuis upload via interface web
	* Faire la synthese journaliere
		* Afficher les jours n'ayant pas de synthese journaliere et proposer de la faire
		* Choisir un jour precis pour mettre a jour la synthese
		 

# Ordre de priorité de dev (du haut vers le bas)#

* OK - Creation d'un fichier de configuration -> json (T°c ref,POIDS_PELLET_PAR_MINUTE,CONTEXT,URL_CHAUDIERE,GET_CHAUDIERE_DATA, SEND_TO_WEB), les connexions bdd et ftp ne seront pas dedans
* OK - Ecran de parametrage pour gerer les données du fichier json
* OK - Prevoir un ecran d'install si json pas present, et creation du fichier config.php
* Revision de la structure des données - Creation de procedures stockées pour accelerer le chargement du csv
* Traduction des colonnes dans le CSV et identifiaction du patern de nommage du constructeur
* Ecran de matrice de correspondance csv pour import des données
* Import d'un csv via interface web 
* Import manuel du fichier csv distant
* Declancher synthese journaliere pour les jours n'existant pas
* 