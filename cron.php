<?php

include_once('config.php');
include(CONTEXT.'/_include/okofen.php');
include(CONTEXT.'/_include/oko2ftp.php');

$oko = new okofen();
$oko2web = new oko2ftp();

//on telecharge le csv depuis la chaudiere
if(GET_CHAUDIERE_DATA_BY_IP) $oko->getChaudiereData();
//envoi du fichier vers le serveur web distant
if(SEND_TO_WEB) $oko2web->send2web();
//integre le csv dans la base
$oko->csv2bdd();
//on lance le traitement
$oko->makeSynteseByDay();



?>