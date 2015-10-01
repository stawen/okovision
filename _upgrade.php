<?php

//ini_set('max_execution_time', 600);
//$t = new timeExec();

//echo "OK - ".$t->getTime();
//ne pas changer l'appel a la bdd car lors de l'execution la class connectdb n'a pas été mise à jour et recharger en mémoire
$q = "ALTER TABLE `oko_capteur` ADD COLUMN `column_oko` INT(2) NOT NULL AFTER `position_column_csv`";

$this->log->info("_UPGRADE | Ajout column_oko dans oko_capteur");

if($this->db->query($q)){
   $u = "UPDATE oko_capteur SET column_oko = position_column_csv;";
   
   if(!$this->db->query($u)){
       $this->log->info("_UPGRADE | ERROR | ".$u);
   }
}else{
    $this->log->info("_UPGRADE | ERROR | Ajout colonne column_oko dans oko_capteur");
}

/*
* Suppression des fichier devenus inutiles
*/
unlink('admin.php');
$this->log->info("_UPGRADE | Suppression admin.php");
unlink('actionManuelle.php');
$this->log->info("_UPGRADE | Suppression actionManuelle.php");
unlink('importmass.php');
$this->log->info("_UPGRADE | Suppression importmass.php");

unlink('js/admin.js');
$this->log->info("_UPGRADE | Suppression admin.php");
unlink('js/actionManuelle.js');
$this->log->info("_UPGRADE | Suppression actionManuelle.php");
unlink('js/importmass.js');
$this->log->info("_UPGRADE | Suppression importmass.php");

?>