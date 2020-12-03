<?php

ini_set('max_execution_time', 600);

$this->log->info("UPGRADE | {$version} | begin");
$t = new timeExec();

// ici le code pour un upgrade

$q = "UPDATE oko_capteur set type='hotwater[0]' where original_name = 'WW1 Pumpe'";
$this->log->info("UPGRADE | {$version} | Add type (hotwater[0]) into oko_capteur");
if (!$this->query($q)) {
    $this->log->info("UPGRADE | {$version} | Failed | ".$q);
}

$q = "UPDATE oko_capteur set type='hotwater[1]' where original_name = 'WW2 Pumpe'";
$this->log->info("UPGRADE | {$version} | Add type (hotwater[1]) into oko_capteur");
if (!$this->query($q)) {
    $this->log->info("UPGRADE | {$version} | Failed | ".$q);
}

$q = 'ALTER TABLE oko_resume_day ADD conso_ecs_kg DECIMAL(6,2);';
$this->log->info("UPGRADE | {$version} | Add column conso_ecs_kg into oko_resume_day");
if (!$this->query($q)) {
    $this->log->info("UPGRADE | {$version} | Failed | ".$q);
}

$this->log->info("UPGRADE | {$version} | end :".$t->getTime());

?> 