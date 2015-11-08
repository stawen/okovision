<?php

ini_set('max_execution_time', 600);


$this->log->info("UPGRADE | begin");
$t = new timeExec();

$q = "ALTER TABLE `oko_historique_full` ADD COLUMN `timestamp` INT(11) UNSIGNED NOT NULL AFTER `heure`;";

if($this->query($q)){
    $this->log->info("UPGRADE | Alter Table OK");
    $this->query("SET time_zone='+00:00'");
    $update = "update oko_historique_full as a left join oko_historique_full as b on a.jour = b.jour and a.heure = b.heure set a.timestamp = UNIX_TIMESTAMP(CONCAT(b.jour,' ',b.heure));";
    
    if(!$this->query($update)) $this->log->error("UPGRADE | Update oko_historique_full in TimeStamp failed");
    
    
}else{
    $this->log->error("UPGRADE | Alter Table failed");
}

$this->log->info("UPGRADE | end :".$t->getTime());
?>