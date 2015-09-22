<?php


$q = "select * from oko_asso_capteur_graphe";
$this->log->debug("UPGRADE | ".$q);

$result =$this->db->query($q);

if($result){

    $tmp = array();
	while($res = $result->fetch_object()){
		array_push($tmp,$res);
	}
	
	var_dump($tmp);
}


?>