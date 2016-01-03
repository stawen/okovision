<?php

ini_set('max_execution_time', 600);
$this->log->info("UPGRADE | $version | begin");
$t = new timeExec();

//suppirmer les colonnes de histo-full inutile, fairer attention a col_99, le renommer et supprimer ensuite

$this->log->info("UPGRADE | $version | end :".$t->getTime());
?>