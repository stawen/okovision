<?php

ini_set('max_execution_time', 600);


$this->log->info("UPGRADE | begin");
$t = new timeExec();
// Test si l'ancienne table oko_historique est toujours presente

$q = "SHOW TABLES LIKE 'oko_historique'";
$res = $this->query($q);
if ($res->num_rows > 0){

    $this->log->info("UPGRADE | Delete oko_historique");

    $q = "select count(*) as nb from oko_historique";
   
    $res    = $this->query($q);
    $r      = $res->fetch_object();
    
    if($r->nb == 0){
        $q = "DROP TABLE `oko_historique`";
        if($this->query($q)){
          @unlink('migration.php');
          @unlink('js/migration.js');
          $this->log->info("UPGRADE | Suppression migration.php");  
          $this->log->info("UPGRADE | Delete oko_historique Success");
        } 
    }else{
        $this->log->info("UPGRADE | Delete oko_historique Failed : Not Empty table, Please migrate !!");
    }
}

/* 1.4.3 
$configFile = file_get_contents('config.php');
$configFile = str_replace("//NOTHING","//CHANGE1.4.3",$configFile);
$configFile = str_replace("date_default_timezone_set('Europe/Paris');","//CHANGE1.4.3",$configFile);
$configFile = str_replace("date_default_timezone_set('UTC');","//CHANGE1.4.3",$configFile);
$configFile = str_replace("//CHANGE1.4.3","date_default_timezone_set((isset($"."config['timezone']))?$"."config['timezone']:'Europe/Paris');",$configFile);


file_put_contents('config.php',$configFile);


$q_alter = "ALTER TABLE oko_saisons ENGINE=MYISAM;";
$q_alter .= "ALTER TABLE oko_dateref ENGINE=MYISAM;";
$q_alter .= "ALTER TABLE oko_resume_day ENGINE=MYISAM;";
$q_alter .= "ALTER TABLE oko_historique_full ENGINE=MYISAM;";
$q_alter .= "ALTER TABLE oko_graphe ENGINE=MYISAM;";
$q_alter .= "ALTER TABLE oko_capteur ENGINE=MYISAM;";
$q_alter .= "ALTER TABLE oko_asso_capteur_graphe ENGINE=MYISAM;";
$q_alter .= "OPTIMIZE TABLE oko_historique_full;";

$this->multi_query($q_alter);
*/ 

/*
* 1.5.0
*/

//change format oko_asso_capteur_graphe.oko_capteur_id
$q = "ALTER TABLE `oko_asso_capteur_graphe`	CHANGE COLUMN `oko_capteur_id` `oko_capteur_id` INT(3) NOT NULL AFTER `oko_graphe_id`;";
 
if($this->query($q)){
    $this->log->info("UPGRADE | Change format oko_asso_capteur_graphe.oko_capteur_id");   
}else{
    $this->log->error("UPGRADE | Change format oko_asso_capteur_graphe.oko_capteur_id");       
}


$this->log->info("UPGRADE | Update status | Finished in ".$t->getTime());


?>