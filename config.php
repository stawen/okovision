<?php

DEFINE('PATH','http://chaudiere/logfiles/pelletronic/touch_');
DEFINE('DEST_PATH','/home/xxx/okovision/depo/import');
DEFINE('EXTENTION','.csv');
DEFINE('CSVFILE',DEST_PATH.EXTENTION);
DEFINE('LOGFILE','/home/xxx/okovision/www/_logs/okovision.log');
//affiche les lignes de debug dans les logs
DEFINE('DEBUG', false);
//affiches les lignes de debug dans l'html
DEFINE('VIEW_DEBUG', false);

//BDD
DEFINE('BDD_IP','localhost');
DEFINE('BDD_USER','root');
DEFINE('BDD_PASS','');
DEFINE('BDD_SCHEMA','okovision');

//PARAMETRE BDD
DEFINE('CSV_DECIMAL',',');
DEFINE('CSV_SEPARATEUR',';');
DEFINE('BDD_DECIMAL','.');
//données a parametrer
DEFINE('TC_REF', 20);
DEFINE('POIDS_PELLET_PAR_MINUTE', 153);

DEFINE('COEFF_CONSO', POIDS_PELLET_PAR_MINUTE/60/1000);
DEFINE('FUNC_CONSO_PELLET','round(sum( ((60 / (vis_alimentation_tps + vis_alimentation_tps_pause)) * vis_alimentation_tps)) * '.COEFF_CONSO.',2)');
DEFINE('FUNC_DJU','IF( '.TC_REF.' <= MIN(Tc_exterieur), 0, round( '.TC_REF.' - (MAX(Tc_exterieur) + MIN(Tc_exterieur))/2,2))');


//CONNEXION SERVER DISTANT
DEFINE('FTP_SERVEUR', '');
DEFINE('FTP_USER', ''); 
DEFINE('FTP_PASS', '');
DEFINE('REP_DEPOT', '');


?>