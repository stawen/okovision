<?php

ini_set('max_execution_time', 600);

$this->log->info("UPGRADE | $version | begin");
$t = new timeExec();

$dico = json_decode(file_get_contents("_langs/fr.matrice.json"), true);

$c = new capteur();

$res = $c->getAll();

foreach($res as $key){
    $okoSensor = $key['original_name'];

    $name = isset($dico[$okoSensor]['name'])?$dico[$okoSensor]['name']:$okoSensor;

    $q = "update oko_capteur set name='".$name."' where original_name='$okoSensor'";

    $this->log->info("UPGRADE | $version | update $okoSensor :: ".$name);  

    if(!$this->query($q)){
        $this->log->info("UPGRADE | $version | Failed | ".$q);
    }

}

// Remove table oko_dateref
$q = "DROP TABLE IF EXISTS oko_dateref";

if(!$this->query($q)){
    $this->log->info("UPGRADE | $version | Failed | ".$q);
}

$this->log->info("UPGRADE | $version | end :".$t->getTime());
