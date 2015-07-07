<?php

/* You can Touch */

//affiche les lignes de debug dans les logs
DEFINE('DEBUG', false);
//affiches les lignes de debug dans l'html
DEFINE('VIEW_DEBUG', false);

//BDD
DEFINE('BDD_IP','localhost');
DEFINE('BDD_USER','');
DEFINE('BDD_PASS','');
DEFINE('BDD_SCHEMA','okovision');

//CONNEXION SERVER DISTANT
DEFINE('FTP_SERVEUR', ''); 
DEFINE('FTP_USER', ''); 
DEFINE('FTP_PASS', '');
DEFINE('REP_DEPOT', '');


//T°c de reference dans la maison, ici 20 °c
DEFINE('TC_REF', 20);
//apres une mesure, deduire le poids des epplet en gr fourni 
//par la vis sans fin vers le foyer pour 1 minutes de fonctionnement
DEFINE('POIDS_PELLET_PAR_MINUTE', 153);


/****
	DONT'T TOUCH 
****/
//Parametres globaux
DEFINE('CONTEXT',dirname($_SERVER['SCRIPT_FILENAME']));
date_default_timezone_set('Europe/Paris');

//configuration fichier d'echange
DEFINE('PATH','http://chaudiere/logfiles/pelletronic/touch_');
DEFINE('EXTENTION','.csv');
DEFINE('CSVFILE',CONTEXT.'/_tmp/import.csv');
DEFINE('LOGFILE',CONTEXT.'/_logs/okovision.log');

//PARAMETRE BDD
DEFINE('CSV_DECIMAL',',');
DEFINE('CSV_SEPARATEUR',';');
DEFINE('BDD_DECIMAL','.');

//Formule savante
DEFINE('COEFF_CONSO', POIDS_PELLET_PAR_MINUTE/60/1000);
DEFINE('FUNC_CONSO_PELLET','round(sum( ((60 / (vis_alimentation_tps + vis_alimentation_tps_pause)) * vis_alimentation_tps)) * '.COEFF_CONSO.',2)');
DEFINE('FUNC_DJU','IF( '.TC_REF.' <= (MAX(Tc_exterieur) + MIN(Tc_exterieur))/2, 0, round( '.TC_REF.' - (MAX(Tc_exterieur) + MIN(Tc_exterieur))/2,2))');



?>