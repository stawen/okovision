<?php

ini_set('max_execution_time', 600);
$this->log->info("UPGRADE | $version | begin");
$t = new timeExec();

//reorganisation des js


        @unlink(CONTEXT.'/js/adapters/standalone-framework.js'); //
        @unlink(CONTEXT.'/js/adapters/standalone-framework.src.js');
        @rmdir(CONTEXT.'/js/adapters');
        
        @unlink(CONTEXT.'/js/bootstrap-notify.min.js');
        @unlink(CONTEXT.'/js/bootstrap.min.js');
        @unlink(CONTEXT.'/js/highcharts.min.js');
        @unlink(CONTEXT.'/js/jquery-ui.min.js');
        @unlink(CONTEXT.'/js/jquery.fileupload.js');
        @unlink(CONTEXT.'/js/jquery.min.js');
        @unlink(CONTEXT.'/js/modules/canvas-tools.js');
        @unlink(CONTEXT.'/js/modules/canvas-tools.src.js');
        @unlink(CONTEXT.'/js/modules/data.js');
        @unlink(CONTEXT.'/js/modules/data.src.js');
        @unlink(CONTEXT.'/js/modules/drilldown.js');
        @unlink(CONTEXT.'/js/modules/drilldown.src.js');
        @unlink(CONTEXT.'/js/modules/exporting.js');
        @unlink(CONTEXT.'/js/modules/exporting.src.js');
        @unlink(CONTEXT.'/js/modules/funnel.js');
        @unlink(CONTEXT.'/js/modules/funnel.src.js');
        @unlink(CONTEXT.'/js/modules/heatmap.js');
        @unlink(CONTEXT.'/js/modules/heatmap.src.js');
        @unlink(CONTEXT.'/js/modules/no-data-to-display.js');
        @unlink(CONTEXT.'/js/modules/no-data-to-display.src.js');
        @unlink(CONTEXT.'/js/modules/solid-gauge.js');
        @unlink(CONTEXT.'/js/modules/solid-gauge.src.js');
        @rmdir(CONTEXT.'/js/modules');
        
        @unlink(CONTEXT.'/js/themes/dark-blue.js');
        @unlink(CONTEXT.'/js/themes/dark-green.js');
        @unlink(CONTEXT.'/js/themes/dark-unica.js');
        @unlink(CONTEXT.'/js/themes/gray.js');
        @unlink(CONTEXT.'/js/themes/grid-light.js');
        @unlink(CONTEXT.'/js/themes/grid.js');
        @unlink(CONTEXT.'/js/themes/sand-signika.js');
        @unlink(CONTEXT.'/js/themes/skies.js');
        @rmdir(CONTEXT.'/js/themes');
        
        @unlink(CONTEXT.'/_langs/fr.text.ini');



$addColumn = "ALTER TABLE oko_user ADD COLUMN login_boiler TINYTEXT NULL DEFAULT NULL AFTER type, ADD COLUMN pass_boiler TINYTEXT NULL DEFAULT NULL AFTER login_boiler;";
$upd = "UPDATE oko_user SET login_boiler='oekofen', pass_boiler='b2Vrb2Zlbg==' WHERE  user='admin';";

if($this->query($addColumn)){
    if(!$this->query($upd)){
        $this->log->info("UPGRADE | $version | add login.pass in oko_user failed");
    }
}else{
    $this->log->info("UPGRADE | $version | add column login.pass in oko_user failed");
}

$addColumn = "ALTER TABLE oko_capteur ADD COLUMN boiler TINYTEXT NOT NULL DEFAULT '' AFTER type;";
if(!$this->query($addColumn)){
  $this->log->info("UPGRADE | $version | create column boiler in oko_capteur failed !");  
}else{
    
    /* Faire la maj de la table oko_capteur avec fr.matrice.js');*/
    $dico = json_decode(file_get_contents("_langs/fr.matrice.json"), true);
    
	$c = new capteur();
    
    $res = $c->getAll();
    
    foreach($res as $key){
        $okoSensor = $key['original_name'];
        $q = "update oko_capteur set boiler='".$dico[$okoSensor]['boiler']."' where original_name='$okoSensor'";
        $this->log->info("UPGRADE | $version | update $okoSensor :: ".$dico[$okoSensor]['boiler']);  
        
        if(!$this->query($q)){
            $this->log->info("UPGRADE | $version | Failed | ".$q);
        }
        
    }
}


$qCreate = "CREATE TABLE IF NOT EXISTS `oko_boiler` (  `timestamp` int(11) unsigned NOT NULL,  `description` VARCHAR(150) NOT NULL,  `config` text NOT NULL,  PRIMARY KEY (`timestamp`)) ENGINE=MYISAM DEFAULT CHARSET=utf8;";
if(!$this->query($qCreate)){
  $this->log->info("UPGRADE | $version | Create table boiler failed !");  
}


$this->log->info("UPGRADE | $version | end :".$t->getTime());
?>