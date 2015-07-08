<?PHP
include_once 'config.php';
include_once CONTEXT.'/_include/logger.class.php';

class data{

	private $log = null;
	private $result = null;
	private $filtre = null;
	private $okoHistoFull_WhereByDay = "FROM oko_histo_full WHERE mod(MINUTE(heure),5) = 0 and jour = ";
	private $okoHistoFull_WhereByDayFull = "FROM oko_histo_full WHERE jour = ";
	
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
	
	/****
	Fonction pour recuperer toutes les data associé au timestamp
	***/


	private function getDataWithTime($q){	
		$this->getSQL($q);
		$data = null;
	
		while($r = mysql_fetch_row($this->result)) {
			
			$date = new DateTime($r[0]." ".$r[1], new DateTimeZone('Europe/Paris'));
			$utc = ($date->getTimestamp() + $date->getOffset()) * 1000;	
			$data .= "[".$utc.",".$r[2]."],";
			
		}
		
		$data = substr($data,0,strlen($data)-1);
		mysql_free_result($this->result);
		
		return '['.$data.']';
	}
	
	private function getJson4grapheWithTime($f,$where){
		
	
		$resultat = "";
		
		foreach ($f as $label => $colonneSql){
			$req = "SELECT jour, DATE_FORMAT(heure,'%H:%i:%s'), ".$colonneSql." ".$where;
			$this->log->debug($req);
			
			$resultat .= '{ "name": "'.$label.'",';
			$resultat .= '"data": '.$this->getDataWithTime($req);
			$resultat .= '},';
			
			
		}
		//on retire la derniere virgule qui ne sert à rien
		$resultat = substr($resultat,0,strlen($resultat)-1);
		
		header("Content-type: text/json");
		return '['.$resultat.']';
	}
	
	
	/****
	 fonction pour recuperer les information de production ECS
	 */
	public function getEcs($jour){
		$categorie = array( 'ECS' => 'Tc_ecs',
							'Bas du ballon' => 'Tc_ballon_bas',
							'Panneau Solaire' => 'Tc_panneau_solaire',
							'Pompe Solaire (On/off)' => 'Pompe_solaire',
							'Circulateur ECS (On/off)' => 'Circulateur_ecs'
						);
		
		echo $this->getJson4grapheWithTime($categorie,$this->okoHistoFull_WhereByDayFull."'".$jour."'");
	}
	
	/****
	 fonction pour recuperer les information de production Chauffage
	 */
	public function getChauffage($jour){
		$categorie = array( 'T°C Chaudiere' => 'Tc_chaudiere',
							'T°C Chaudiere Consigne' => 'Tc_chaudiere_consigne',
							'Circulateur (On/Off)' => 'Circulateur_chauffage',
							'T°C Depart Chauffage' => 'Tc_depart_eau'
						);
		
		echo $this->getJson4grapheWithTime($categorie,$this->okoHistoFull_WhereByDayFull."'".$jour."'");
	
	}
	
	/****
	 fonction pour recuperer les information de temperature
	 */
	public function getTemperature($jour){
		$categorie = array( 'T°C Exterieur' => 'Tc_exterieur',
							'T°C Ambiante' => 'Tc_ambiante',
							'T°C Ambiante Consigne' => 'Tc_ambiante_consigne',
							'T°C Depart Chauffage' => 'Tc_depart_eau'
						);
		
		echo $this->getJson4grapheWithTime($categorie,$this->okoHistoFull_WhereByDayFull."'".$jour."'");
	}
	
	
	/****
	 fonction pour recuperer les information d'indication dans les labels'
	 */
	public function getIndicateur($jour){
		$categorie = array( 'Tc_ext_max' => 'max(Tc_exterieur)',
							'Tc_ext_min' => 'min(Tc_exterieur)',
							'conso' => FUNC_CONSO_PELLET
						);
		
		echo $this->getJson($categorie,
							'FROM oko_histo_full WHERE jour="'.$jour.'"'
							);
	}
	
	
	
	/****
	 fonction pour recuperer les information d'agregation
	 */
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
	
	/*
	* TODO : variabiliser la requette
	*/
	public function getTotalConsoSaison($saison){
		$categorie = array( 'Tc_ext_max' => 'max(Tc_ext_max)',
							'Tc_ext_min' => 'min(Tc_ext_min)',
							'conso' => 'sum(conso_kg)',
							'dju' => 'sum(dju)',
							'nbcycle' => 'sum(nb_cycle)'
						);
		
		echo $this->getJson($categorie,
							'FROM oko_resume_day '
							.'WHERE oko_resume_day.jour BETWEEN "2014-09-01" AND "2015-09-01"'
							);
	}
	
	

	public function getSyntheseSaison($saison){
		$categorie = array( 'T°C Exterieur (Max)' => 'max(Tc_ext_max)',
							'T°C Exterieur (Min)' => 'min(Tc_ext_min)',
							'Consommation Pellet (Kg)' => 'sum(conso_kg)',
							'DJU' => 'sum(dju)',
							'NB Cycle' => 'sum(nb_cycle)'
							
						);
						
		echo $this->getJson4graphe($categorie,
							'FROM oko_resume_day, oko_config '
							.'WHERE oko_config.id = '.$saison.' '
							.'AND oko_resume_day.jour BETWEEN oko_config.date_debut AND oko_config.date_fin '
							.'GROUP BY MONTH(oko_resume_day.jour) '
							.'ORDER BY YEAR(oko_resume_day.jour), MONTH(oko_resume_day.jour) ASC'
							);				
	}
	

	
}

?>
