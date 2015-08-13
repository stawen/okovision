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
	            
	    $this->log->debug("Class ".get_called_class()." | getGrapheData | ".$q);
	   
	    $result = $this->db->query($q);
		
		$resultat = "";
		
    	while($c = $result->fetch_object()){
			
		    $q = "SELECT jour, DATE_FORMAT(heure,'%H:%i:%s'), round((value * ".$c->coeff."),2) as value FROM oko_historique "
			        ."INNER JOIN oko_capteur ON oko_historique.oko_capteur_id = oko_capteur.id WHERE "
			        ."jour ='".$jour."' and oko_historique.oko_capteur_id = ".$c->id;
			        
			$this->log->debug("Class ".get_called_class()." | getGrapheData | ".$c->name." | ".$q);
			
			$resultat .= '{ "name": "'.$c->name.'",';
			$resultat .= '"data": '.$this->getDataWithTime($q);
			$resultat .= '},';
		}
		
		//on retire la derniere virgule qui ne sert à rien
		$resultat = substr($resultat,0,strlen($resultat)-1);
		
		$r =  '{ "grapheData": ['.$resultat.']'
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
	

	public function getIndicByDay($jour){
		
		$c 		= $this->getConsoByday($jour);
		$min 	= $this->getTcMinByDay($jour);
		$max 	= $this->getTcMaxByDay($jour);
		
		$this->sendResponse(
							json_encode(	["consoPellet" => $c->consoPellet, 
											 "tcExtMax" => $max->tcExtMax, 
											 "tcExtMin" => $min->tcExtMin 
											]
										, JSON_NUMERIC_CHECK
									)
							);
		
	}
	
	public function getConsoByday($jour){
		$coeff = POIDS_PELLET_PAR_MINUTE/1000;
		
		$q = "select round (sum((1/(a.value + b.value)) * a.value)*(".$coeff."),2) as consoPellet from oko_historique as a "
				."JOIN oko_historique as b on a.jour = b.jour and a.heure = b.heure "
				."JOIN oko_capteur as ca ON ca.id = a.oko_capteur_id and ca.type = 'tps_vis' "
				."JOIN oko_capteur as cb ON cb.id = b.oko_capteur_id and cb.type = 'tps_vis_pause' "
				."WHERE a.jour = '".$jour."';";
		
		$this->log->debug("Class ".get_called_class()." | getConsoByday | ".$q); 
		
		$result = $this->db->query($q);
		
		return $result->fetch_object();
		
	}
	
	public function getTcMaxByDay($jour){
		$q = "SELECT round(max(a.value),2) as tcExtMax FROM oko_historique as a "
				."JOIN oko_capteur as ca ON ca.id = a.oko_capteur_id and ca.type = 'tc_ext' "
				."WHERE a.jour = '".$jour."';";
		
		$this->log->debug("Class ".get_called_class()." | getTcMaxByDay | ".$q); 
		
		$result = $this->db->query($q);
		
		return $result->fetch_object();		
				
	}
	
	public function getTcMinByDay($jour){
		$q = "SELECT round(min(a.value),2) as tcExtMin FROM oko_historique as a "
				."JOIN oko_capteur as ca ON ca.id = a.oko_capteur_id and ca.type = 'tc_ext' "
				."WHERE a.jour = '".$jour."';";
		
		$this->log->debug("Class ".get_called_class()." | getTcMinByDay | ".$q); 
		
		$result = $this->db->query($q);
		
		return $result->fetch_object();		
				
	}
	
	public function getDju($tcMax,$tcMin){
		//DEFINE('FUNC_DJU','IF( '.TC_REF.' <= (MAX(Tc_exterieur) + MIN(Tc_exterieur))/2, 0, round( '.TC_REF.' - (MAX(Tc_exterieur) + MIN(Tc_exterieur))/2,2))');
		$tcMoy = ($tcMax + $tcMin) / 2;
		
		if(TC_REF <=  $tcMoy ){
			return 0;
		}else{
			return round( TC_REF - $tcMoy ,2);
		}
		
	}
	
	public function getNbCycleByDay($jour){
		$q = "SELECT sum(a.value) as nbCycle FROM oko_historique as a "
				."JOIN oko_capteur as ca ON ca.id = a.oko_capteur_id and ca.type = 'startCycle' "
				."WHERE a.jour = '".$jour."';";
		
		$this->log->debug("Class ".get_called_class()." | getNbCycleByDay | ".$q); 
		
		$result = $this->db->query($q);
		
		return $result->fetch_object();	
	}
	
	public function getIndicByMonth($month, $year){
		
		$q = "SELECT max(Tc_ext_max) as tcExtMax, min(Tc_ext_min) as tcExtMin, ".
				"sum(conso_kg) as consoPellet, sum(dju) as dju, sum(nb_cycle) as nbCycle ".
				"FROM oko_resume_day ".
				"WHERE MONTH(oko_resume_day.jour) = ".$month." AND ".
				"YEAR(oko_resume_day.jour) = ".$year;
		
		
		$this->log->debug("Class ".get_called_class()." | getIndicByMonth | ".$q); 
		
		$result = $this->db->query($q);
		$r = $result->fetch_object();
		
		$this->sendResponse( json_encode( 	[ 	"tcExtMax" => $r->tcExtMax,
												"tcExtMin" => $r->tcExtMin,
												"consoPellet" => $r->consoPellet,
												"dju" => $r->dju,
												"nbCycle" => $r->nbCycle
											]
											, JSON_NUMERIC_CHECK ) );
		
		
	}
	
	public function getHistoByMonth($month,$year){
		/*
		$categorie = array( 'T°C Exterieur (Max)' => ['colonne' => 'tc_ext_max', 'alias' => 'tcExtMax'],
							'T°C Exterieur (Min)' => ['colonne' => 'tc_ext_min', 'alias' => 'tcExtMin'],
							'Consommation Pellet (Kg)' => ['colonne' => 'conso_kg', 'alias' => 'consoPellet'],
							'DJU' => ['colonne' => 'dju', 'alias' => 'dju'],
							'NB Cycle' => ['colonne' => 'nb_cycle', 'alias' => 'nbCycle']
						);
		*/
		$categorie = array( 'T°C Exterieur (Max)' => 'tc_ext_max',
							'T°C Exterieur (Min)' => 'tc_ext_min',
							'Pellet (Kg)' => 'conso_kg',
							'DJU' => 'dju',
							'NB Cycle' => 'nb_cycle'
						);
						
		$where ='FROM oko_resume_day '
				.'RIGHT JOIN oko_dateref ON oko_resume_day.jour = oko_dateref.jour '
				.'WHERE MONTH(oko_dateref.jour) = '.$month.' AND ' 
				.'YEAR(oko_dateref.jour) = '.$year.' '
				.'ORDER BY oko_dateref.jour ASC	';
		
		$resultat = array();
		
		foreach ($categorie as $label => $colonneSql){
			//$q = "SELECT ".$colonneSql['colonne']." as ".$colonneSql['alias']." ".$where;
			$q = "SELECT ".$colonneSql." ".$where;
			
			$this->log->debug("Class ".get_called_class()." | getHistoByMonth | ".$q); 
			
			$result = $this->db->query($q);
			
			$data = array();
			while($r = $result->fetch_row() ) {
				$data[] = $r[0];
			}
			
			array_push($resultat,array( 'name' => $label,
										'data' => $data
									)
						);
		}
		
		$this->sendResponse( json_encode( $resultat ,JSON_NUMERIC_CHECK) );
		
		
	}
	
	public function getTotalSaison($idSaison){
		
		$q = "SELECT max(Tc_ext_max) as tcExtMax, min(Tc_ext_min) as tcExtMin, ".
				"sum(conso_kg) as consoPellet, sum(dju) as dju, sum(nb_cycle) as nbCycle ".
				"FROM oko_resume_day, oko_saisons ".
				"WHERE oko_saisons.id = ".$idSaison." ".
				"AND oko_resume_day.jour BETWEEN oko_saisons.date_debut AND oko_saisons.date_fin ;";
				
		
		
		$this->log->debug("Class ".get_called_class()." | getTotalSaison | ".$q); 
		
		$result = $this->db->query($q);
		$r = $result->fetch_object();
		
		$this->sendResponse( json_encode( 	[ 	"tcExtMax" => $r->tcExtMax,
												"tcExtMin" => $r->tcExtMin,
												"consoPellet" => $r->consoPellet,
												"dju" => $r->dju,
												"nbCycle" => $r->nbCycle
											]
											, JSON_NUMERIC_CHECK ) );
											
	}
	
	public function getSyntheseSaison($idSaison){
		
		$categorie = array( 'T°C Exterieur (Max)' => 'max(Tc_ext_max)',
							'T°C Exterieur (Min)' => 'min(Tc_ext_min)',
							'Consommation Pellet (Kg)' => 'sum(conso_kg)',
							'DJU' => 'sum(dju)',
							'NB Cycle' => 'sum(nb_cycle)'
						);
		
		$where = "FROM oko_saisons, oko_resume_day ".
					"RIGHT JOIN oko_dateref ON oko_dateref.jour = oko_resume_day.jour ".
					"WHERE oko_saisons.id=1 AND oko_dateref.jour BETWEEN oko_saisons.date_debut AND oko_saisons.date_fin ".
					"GROUP BY MONTH(oko_dateref.jour) ".
					"ORDER BY YEAR(oko_dateref.jour), MONTH(oko_dateref.jour) ASC;";
				
		$resultat = array();
		
		foreach ($categorie as $label => $colonneSql){
			
			$q = "SELECT ".$colonneSql." ".$where;
			
			$this->log->debug("Class ".get_called_class()." | getSyntheseSaison | ".$q); 
			
			$result = $this->db->query($q);
			
			$data = array();
			while($r = $result->fetch_row() ) {
				$data[] = $r[0];
			}
			
			array_push($resultat,array( 'name' => $label,
										'data' => $data
									)
						);
		}
		
		$this->sendResponse( json_encode( $resultat ,JSON_NUMERIC_CHECK) );		
				
				
	}
	
	
	
}

?>
