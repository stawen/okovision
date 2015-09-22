<?php


$q = "select distinct(oko_graphe_id) from oko_asso_capteur_graphe order by oko_graphe_id";
$this->log->debug("_UPGRADE | ".$q);

$result =$this->db->query($q);

if($result){
	while($res = $result->fetch_object()){
		$graphe_id = $res->oko_graphe_id;
		
		$q = "select oko_capteur_id from oko_asso_capteur_graphe where oko_graphe_id = ".$graphe_id;
		$this->log->debug("_UPGRADE | ".$q);
		
		$result2 =$this->db->query($q);
		$i = 1;
		while($res2 = $result2->fetch_object()){
	
			$q = "UPDATE oko_asso_capteur_graphe set position=".$i." where oko_graphe_id = ".$graphe_id." AND oko_capteur_id = ".$res2->oko_capteur_id;
			$this->log->debug("_UPGRADE | ".$q);
			
			if(!$this->db->query($q)){
				$this->log->debug("_UPGRADE | Error | ".$q);
				continue;	
			} 
		$i++;	
		}
		
	}
	
}


?>