<?php
//ce fichier doit etre appeler par une tache cron toutes les 2 heures.
include('/home/xxx/okovision/www/_include/okofen.php');

$oko = new okofen();

$oko->csv2bdd();
//on lance le traitement
$oko->makeSynteseByDay();


?>