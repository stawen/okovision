<?php

ini_set('max_execution_time', 600);

$this->log->info("UPGRADE | {$version} | begin");
$t = new timeExec();

// BEGIN code upgrade

// END code upgrade

$this->log->info("UPGRADE | {$version} | end :".$t->getTime());

?> 