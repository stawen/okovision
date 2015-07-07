<?php

include('/volume1/web/okovision/_include/okofen.php');
include('/volume1/web/okovision/_include/oko2ftp.php');

$oko = new okofen();
$oko2web = new oko2ftp();

//on telecharge le csv depuis la chaudiere
$oko->getChaudiereData();
//envoi du fichier vers le serveur web distant
$oko2web->send2web();
//integre le csv dans la base
$oko->csv2bdd();
//on lance le traitement
$oko->makeSynteseByDay();



?>