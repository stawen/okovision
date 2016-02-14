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
    
    $q = "CREATE TABLE IF NOT EXISTS `oko_silo_events` (
            `id` int(11) NOT NULL AUTO_INCREMENT,
            `event_date` date NOT NULL,
            `quantity` int(5) unsigned NOT NULL COMMENT 'in kg',
            `price` int(8) NOT NULL,
            `event_type` char(10) NOT NULL DEFAULT 'PELLET',
            PRIMARY KEY (`id`)
          ) ENGINE=MYISAM DEFAULT CHARSET=utf8";
        
    $this->log->info("UPGRADE | $version | Adding table oko_silo_events");  
        
    if(!$this->query($q)){
        $this->log->info("UPGRADE | $version | Failed | ".$q);
    }  
  
$this->log->info("UPGRADE | $version | end :".$t->getTime());
?>