<?php
/*****************************************************
* Projet : Okovision - Supervision chaudiere OeKofen
* Auteur : Stawen Dronek
* Utilisation commerciale interdite sans mon accord
******************************************************/

if (!file_exists("config.json")) {
   header("Location: setup.php");
   exit;
}

require '_include/autoloader.class.php'; 
Autoloader::register(); 

$config = json_decode(file_get_contents("config.json"), true);

/* You can Touch */

//affiche les lignes de debug dans les logs
DEFINE('DEBUG', false); //default -> false 
//affiches les lignes de debug dans l'html
DEFINE('VIEW_DEBUG', false); //default -> false

//ADRESS WEB de la Chaudiere
// exemple : 192.168.0.23 ou chaudiere ou 
// en precisant le port 192.168.0.23:8180 => <ip>:<port>
// si hebergement exterieur et que la chaudiere est accessible via l'exterieur => toto.ddns.net ou toto.ddns.net:<port>
DEFINE('CHAUDIERE',$config['chaudiere']); // <ip>:<port> //json
//BDD
DEFINE('BDD_IP','###_BDD_IP_###'); //default -> localhost
DEFINE('BDD_USER','###_BDD_USER_###');
DEFINE('BDD_PASS','###_BDD_PASS_###');
DEFINE('BDD_SCHEMA','###_BDD_SCHEMA_###'); //default -> okovision




//T°c de reference dans la maison, ici 20 °c
DEFINE('TC_REF', $config['tc_ref']); //default -> 20 //json
//apres une mesure, deduire le poids des epplet en gr fourni 
//par la vis sans fin vers le foyer pour 1 minutes de fonctionnement
DEFINE('POIDS_PELLET_PAR_MINUTE', $config['poids_pellet']); //default -> 150  //json
DEFINE('SURFACE_HOUSE', $config['surface_maison']); //default -> 150  //json
/***
* OPTIONNEL -> ceci peut etre laissé avec les valeurs par defaut
*/
//CONNEXION SERVER DISTANT pour consultation exterieur (optionnel) utile si SEND_TO_WEB est à true
DEFINE('FTP_SERVEUR', '###_FTP_SERVEUR_###'); 
DEFINE('FTP_USER', '###_FTP_USER_###'); 
DEFINE('FTP_PASS', '###_FTP_PASS_###');
DEFINE('REP_DEPOT', '###_FTP_DEPOT_###');
// Activation/Desctivation de la recuperation du fichier sur la chaudiere
DEFINE('GET_CHAUDIERE_DATA_BY_IP', ($config['get_data_from_chaudiere']==1)?true:false); // default -> true //json
// Activation/Desctivation du transfert du fichier de la chaudiere vers une autre serveur en + de celui hebergeant l'application.
DEFINE('SEND_TO_WEB', ($config['send_to_web']==1)?true:false); // default -> false //json
//
// Utilisation d'un silo
DEFINE('HAS_SILO', ($config['has_silo']==1)?true:false); // default -> true //json
DEFINE('SILO_SIZE', (isset($config['silo_size']))?$config['silo_size']:''); // kg 
DEFINE('ASHTRAY', (isset($config['ashtray']))?$config['ashtray']:''); // kg 
/****
	DONT'T TOUCH 
****/
//Parametres globaux
DEFINE('CONTEXT', '###_CONTEXT_###' );
date_default_timezone_set((isset($config['timezone']))?$config['timezone']:'Europe/Paris');

//configuration fichier d'echange
DEFINE('URL','/logfiles/pelletronic');
DEFINE('PATH','http://'.CHAUDIERE.URL.'/touch_');
DEFINE('EXTENTION','.csv');
DEFINE('CSVFILE',CONTEXT.'/_tmp/import.csv');
DEFINE('LOGFILE',CONTEXT.'/_logs/okovision.log');

//PARAMETRE BDD
DEFINE('CSV_DECIMAL',',');
DEFINE('CSV_SEPARATEUR',';');
DEFINE('BDD_DECIMAL','.');
//UNIQUE TOKEN ID
DEFINE('TOKEN','###_TOKEN_###');
//NEWPARAMUPDATE
?>