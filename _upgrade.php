<?php

ini_set('max_execution_time', 600);


$this->log->info("UPGRADE | $version | begin");
$t = new timeExec();

$this->log->info("UPGRADE | $version | end :".$t->getTime());
?>