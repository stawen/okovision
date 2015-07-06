<?PHP
include_once 'config.php';
include_once '_include/logger.class.php';

class data{

	private $log = null;
	private $result = null;
	private $filtre = null;
	private $okoHistoFull_WhereByDay = "FROM oko_histo_full WHERE mod(MINUTE(heure),5) = 0 and jour = ";
	//private $okoHistoFull_WhereByDay = "FROM oko_histo_full WHERE jour = ";
	
	public function __construct() {
		$this->log = new Logger();
	}
	
	private function getSQL($query){
		
		$connect = mysql_connect(BDD_IP,BDD_USER,BDD_PASS);
		if (!$connect){
		   $this->log->error('Ajax | Connection MySQL impossible : ' . mysql_error());
		}
		$cid = mysql_select_db(BDD_SCHEMA,$connect);
		
		$this->result =  mysql_query($query,$connect);
		
		$this->log->debug("Ajax | GetSQL - ".$query);
		mysql_close($connect); // closing connection
	}
	
	
	private function getData($q){	
		$this->getSQL($q);
		
		$data = array();
		while($r = mysql_fetch_row($this->result)) {
			$data[] = $r[0];
		}
		
		mysql_free_result($this->result);
		return $data;
	}
	
	private function getJson4graphe($f,$where){
		
		$resultat = array();
		
		foreach ($f as $label => $colonneSql){
			$req = "SELECT ".$colonneSql." ".$where;
			
			array_push($resultat,array( 'name' => $label,
										'data' => $this->getData($req)
									)
						);
		}
		header("Content-type: text/json");
		return json_encode($resultat, JSON_NUMERIC_CHECK);
	}
	
	private function getJson($f,$requette){
		$resultat = array();
		
		$req = "SELECT ";
		foreach ($f as $label => $colonneSql){
			$req .= " ".$colonneSql." as ".$label." ,";
		}
		$req = substr($req,0,strlen($req)-1);
		$req .= $requette;
		
		$this->getSQL($req);
		
		$data = array();
		while($r = mysql_fetch_object($this->result)) {
			$data[] = $r;
		}
		
		mysql_free_result($this->result);
		
		
		header("Content-type: text/json");
		return json_encode($data, JSON_NUMERIC_CHECK);
	}
	
	public function getEcs($jour){
		$categorie = array( 'ECS' => 'Tc_ecs',
							'Bas du ballon' => 'Tc_ballon_bas',
							'Panneau Solaire' => 'Tc_panneau_solaire',
							'Pompe Solaire (On/off)' => 'Pompe_solaire',
							'Circulateur ECS (On/off)' => 'Circulateur_ecs'
						);
		
		echo $this->getJson4graphe($categorie,$this->okoHistoFull_WhereByDay."'".$jour."'");
	}
	
	public function getChauffage($jour){
		$categorie = array( 'T°C Chaudiere' => 'Tc_chaudiere',
							'T°C Chaudiere Consigne' => 'Tc_chaudiere_consigne',
							'Circulateur (On/Off)' => 'Circulateur_chauffage',
							'T°C Depart Chauffage' => 'Tc_depart_eau'
						);
		
		echo $this->getJson4graphe($categorie,$this->okoHistoFull_WhereByDay."'".$jour."'");
	
	}
	
	public function getTemperature($jour){
		$categorie = array( 'T°C Exterieur' => 'Tc_exterieur',
							'T°C Ambiante' => 'Tc_ambiante',
							'T°C Ambiante Consigne' => 'Tc_ambiante_consigne',
							'T°C Depart Chauffage' => 'Tc_depart_eau'
						);
		
		echo $this->getJson4graphe($categorie,$this->okoHistoFull_WhereByDay."'".$jour."'");
	}
	/* 
	Comparaison avec les forumeur
	*/
	public function getAutres($jour){
		$categorie = array( 'Delta Départ eau' => 'Tc_depart_eau_consigne - Tc_depart_eau',
							'Delta T°C Ambiante eau' => 'Tc_ambiante_consigne - Tc_ambiante',
							'T°C Chaudiere' => 'Tc_chaudiere',
							'T°C Flamme / 10' => 'Tc_flamme / 10',
							'% Bois' => '(vis_alimentation_tps / (vis_alimentation_tps + vis_alimentation_tps_pause))*100',
						);
		
		echo $this->getJson4graphe($categorie,$this->okoHistoFull_WhereByDay."'".$jour."'");
	}
	
	public function getIndicateur($jour){
		$categorie = array( 'Tc_ext_max' => 'max(Tc_exterieur)',
							'Tc_ext_min' => 'min(Tc_exterieur)',
							'conso' => FUNC_CONSO_PELLET
						);
		
		echo $this->getJson($categorie,
							'FROM oko_histo_full WHERE jour="'.$jour.'"'
							);
	}
	
	public function getHistoConsoByMonth($month,$year){
		$categorie = array( 'T°C Exterieur (Max)' => 'tc_ext_max',
							'T°C Exterieur (Min)' => 'tc_ext_min',
							'Consommation Pellet (Kg)' => 'conso_kg',
							'DJU' => 'dju',
							'NB Cycle' => 'nb_cycle'
						);
		
		echo $this->getJson4graphe($categorie,
									'FROM oko_resume_day '
									.'RIGHT JOIN oko_dateref ON oko_resume_day.jour = oko_dateref.jour '
									.'WHERE MONTH(oko_dateref.jour) = '.$month.' AND ' 
									.'YEAR(oko_dateref.jour) = '.$year.' '
									.'ORDER BY oko_dateref.jour ASC	'
									);
	
	}
	
	public function getIndicateurByMonth($month,$year){
		$categorie = array( 'Tc_ext_max' => 'max(Tc_ext_max)',
							'Tc_ext_min' => 'min(Tc_ext_min)',
							'conso' => 'sum(conso_kg)',
							'dju' => 'sum(dju)',
							'nbcycle' => 'sum(nb_cycle)'
						);
		
		echo $this->getJson($categorie,
							'FROM oko_resume_day '
							.'WHERE MONTH(oko_resume_day.jour) = '.$month.' AND ' 
							.'YEAR(oko_resume_day.jour) = '.$year.' '
							);
	}
	
	public function getTotalConsoSaison($saison){
		$categorie = array( 'consoTotal' => 'sum(conso_kg)'
							);
		
		echo $this->getJson($categorie,
							'FROM oko_resume_day '
							.'WHERE oko_resume_day.jour BETWEEN "2014-09-01" AND "2015-09-01"'
							);
	}
	

}

?>
