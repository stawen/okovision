<?PHP
/*****************************************************
* Projet : Okovision - Supervision chaudiere OeKofen
* Auteur : Stawen Dronek
* Utilisation commerciale interdite sans mon accord
******************************************************/

class rendu extends connectDb{

	public function __construct() {
		parent::__construct();
	}
	
	public function __destruct() {
		parent::__destruct();
	}
	
	private function sendResponse($t){
        header("Content-type: text/json; charset=utf-8");
		echo $t;
    }
	
	public function getGrapheData($id,$jour){
		
		$q = "select capteur.name as name, capteur.id as id, asso.correction_effect as coeff from oko_asso_capteur_graphe as asso ".
	            "LEFT JOIN oko_capteur as capteur ON capteur.id = asso.oko_capteur_id  ".
	            "WHERE asso.oko_graphe_id=".$id." ORDER BY asso.position";
	            
	    $this->log->debug("Class rendu | getGrapheData | ".$q);
	   
	    $result = $this->db->query($q);
		/*
	    $categorie = array();
	    while($r = $result->fetch_row()){
			$categorie[$r[0]] = $r[1];
		}*/
		$capteurs = array();
    	while($r = $result->fetch_object()){
			array_push($capteurs,$r);
		}
	    
	    $r =  '{ "grapheData": '.$this->getJson4graphe($capteurs,$jour)
	    	  .'}';
	 	
	 	$this->sendResponse($r);
	 	
	}
	

	/****
	Fonction pour recuperer et structurer toutes les data associées au timestamp
	***/
	private function getDataWithTime($q){	
		
		$result = $this->db->query($q);
		$data = null;
	
		while($r = $result->fetch_row() ) {
			
			$date = new DateTime($r[0]." ".$r[1], new DateTimeZone('Europe/Paris'));
			$utc = ($date->getTimestamp() + $date->getOffset()) * 1000;	
			$data .= "[".$utc.",".$r[2]."],";
			
		}
		
		$data = substr($data,0,strlen($data)-1);
		
		return '['.$data.']';
	}
	
	/*
	Fonction de mise en forme Json
	*/
	private function getJson4graphe($c,$jour){
		
		$resultat = "";
		
		foreach ($c as $i => $capteur){
			
		    $q = "SELECT jour, DATE_FORMAT(heure,'%H:%i:%s'), round((value * ".$capteur->coeff."),2) as value FROM oko_historique "
			        ."INNER JOIN oko_capteur ON oko_historique.oko_capteur_id = oko_capteur.id WHERE "
			        ."jour ='".$jour."' and oko_historique.oko_capteur_id = ".$capteur->id;
			        
			$this->log->debug("Class rendu | getJson4graphe | ".$capteur->name." | ".$q);
			
			$resultat .= '{ "name": "'.$capteur->name.'",';
			$resultat .= '"data": '.$this->getDataWithTime($q);
			$resultat .= '},';
		}
		//on retire la derniere virgule qui ne sert à rien
		$resultat = substr($resultat,0,strlen($resultat)-1);
		
		return '['.$resultat.']';
	}
	
	
}

?>
