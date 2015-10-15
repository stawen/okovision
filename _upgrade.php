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

$configFile = file_get_contents('config.php');
$configFile = str_replace("date_default_timezone_set('Europe/Paris');","//NOTHING",$configFile);
file_put_contents('config.php',$configFile);


$this->log->info("UPGRADE | Update status | Finished in ".$t->getTime());


?>