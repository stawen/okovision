<?php

ini_set('max_execution_time', 600);

$this->log->info("UPGRADE | {$version} | begin");
$t = new timeExec();

// ici le code pour un upgrade

$q = "UPDATE oko_capteur set type='hotwater' where original_name = 'WW1 Pumpe'";
$this->log->info("UPGRADE | {$version} | Add type (hotwater) into oko_capteur");
if (!$this->query($q)) {
    $this->log->info("UPGRADE | {$version} | Failed | ".$q);
}

$q = "UPDATE oko_capteur set type='hotwater2' where original_name = 'WW2 Pumpe'";
$this->log->info("UPGRADE | {$version} | Add type (hotwater2) into oko_capteur");
if (!$this->query($q)) {
    $this->log->info("UPGRADE | {$version} | Failed | ".$q);
}

$this->log->info("UPGRADE | {$version} | end :".$t->getTime());

?> 