# V1.1.2
* #21 - import de masse
* 

## V1.1.1
* #23 - synthse journalière ne fonctionnait plus

## V1.1.0
* #14 et #11 - EVOL - Externalisation des textes dans un fichier commun (pour gain de perf et internationnalisation si besoin)
* #11 - EVOL -  Factorisation des appels Asynchrones - Uniformisation / performance / évolutions futur facilitée
* #2 et #18 - EVOL - Gestion de la position des graphes et de capteurs dans les graphes
* #12 - FIX - Page "A propos" - bouton encore visible après l'installation de la mise à jour
* #6 - FIX - Liste deroulante des saisons preselectionnées sur la periode en cours
* #3 - FIX - Raz du coefficiant de correction dans la boite modale d'association capteur / graphe


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
