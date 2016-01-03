<?php

ini_set('max_execution_time', 600);
$this->log->info("UPGRADE | $version | begin");
$t = new timeExec();

//suppirmer les colonnes de histo-full inutile, fairer attention a col_99, le renommer et supprimer ensuite

$q = "select max(column_oko) as num from oko_capteur where column_oko <> 99";
$this->log->info("UPGRADE | $version | ".$q);

$result = $this->query($q);
$r = $result->fetch_object();

$this->log->info("UPGRADE | $version | max column:".$r->num);

$maxColumn = $r->num;
$newcolumn = $maxColumn + 1;

$copy = "UPDATE oko_historique_full SET col_".$newcolumn." = col_99;";
$maj  = "UPDATE oko_capteur set position_column_csv=$newcolumn , column_oko=$newcolumn where column_oko=99;";

if($this->query($copy) && $this->query($maj)){
 $this->log->info("UPGRADE | $version | Deplacement des données réussi");
 $delete = "";
 
 $q = "ALTER TABLE oko_historique_full ";
 
 for($i = $newcolumn + 1; $i <= 99; $i++){
    $q .= "DROP COLUMN col_$i,";    
 }
 $q = substr($q,0,strlen($q)-1);
 $q .= ";";
 $this->log->info("UPGRADE | $version | delete | ".$q);
 if($this->query($q)){
     $this->log->info("UPGRADE | $version | Suppresion des colonnes inutiles OK");
 }
 /* execute multi query */
 //$this->multi_query($delete);
 //while ($this->flush_multi_queries()) {;} // flush multi_queries
 
}


$this->log->info("UPGRADE | $version | end :".$t->getTime());
?>