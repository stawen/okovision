<?php

include('/home/xxx/okovision/www/_include/okofen.php');

$oko = new okofen();

$oko->csv2bdd();
//on lance le traitement
$oko->makeSynteseByDay();


?>