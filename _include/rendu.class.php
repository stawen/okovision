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
	            
	    $this->log->debug("Class ".__CLASS__." | ".__FUNCTION__." | ".$q);
	   
	    $result = $this->query($q);
		
		$resultat = "";
		$cap = new capteur();
		//$date = new DateTime(); 
		
    	while($c = $result->fetch_object()){
			
			$capteur = $cap->get($c->id);
			//$q = "SELECT (FROM_UNIXTIME(CONCAT(jour,' ',heure)))*1000 as timestamp, round((col_".$capteur['column_oko']." * ".$c->coeff."),2) as value FROM oko_historique_full "
			$q = "SELECT timestamp * 1000 as timestamp, round((col_".$capteur['column_oko']." * ".$c->coeff."),2) as value FROM oko_historique_full "
			//$q = "SELECT jour,heure, round((col_".$capteur['column_oko']." * ".$c->coeff."),2) as value FROM oko_historique_full "
		         ."WHERE jour ='".$jour."'";
			        
			$this->log->debug("Class ".__CLASS__." | ".__FUNCTION__." | ".$c->name." | ".$q);
			
			$res = $this->query($q);
			
			$data = null;
	
			while($r = $res->fetch_object() ) {
				//si value == null c'est qu'il n'y a pas de data donc on affiche pas la données
				if($r->value !== null) $data .= "[".$r->timestamp.",".$r->value."],";
			}
		
			$data = substr($data,0,strlen($data)-1);
			
			$resultat .= '{ "name": "'.$c->name.'",';
			//$resultat .= '"data": '.$this->getDataWithTime($q);
			$resultat .= '"data": ['.$data.']';
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
		
		$result = $this->query($q);
		$data = null;
	
		while($r = $result->fetch_object() ) {
			if($r->value !== null){
				//$date = new DateTime($r->jour." ".$r->heure,new DateTimeZone(date_default_timezone_get()));
				$date = new DateTime($r->jour." ".$r->heure);
				$utc = ($date->getTimestamp() + $date->getOffset()) * 1000;	
				$data .= "[".$utc.",".$r->value."],";
			}
			
		}
		
		$data = substr($data,0,strlen($data)-1);
		
		return '['.$data.']';
	}
	

	public function getIndicByDay($jour, $timeStart = null, $timeEnd = null){
		
		if($timeStart != null && $timeEnd != null){
			$timeStart 	=	(int)( $timeStart / 1000 );
			$timeEnd 	=	(int)( $timeEnd / 1000 );
		}
		
		
		$c 		= $this->getConsoByday($jour, $timeStart, $timeEnd);
		$min 	= $this->getTcMinByDay($jour, $timeStart, $timeEnd);
		$max 	= $this->getTcMaxByDay($jour, $timeStart, $timeEnd);
		
		$this->sendResponse(
							json_encode(	array("consoPellet" => $c->consoPellet, 
											 "tcExtMax" => $max->tcExtMax, 
											 "tcExtMin" => $min->tcExtMin 
											)
										, JSON_NUMERIC_CHECK
									)
							);
		
	}
	
	public function getConsoByday($jour, $timeStart = null, $timeEnd = null){
		$coeff = POIDS_PELLET_PAR_MINUTE/1000;
		$c = new capteur();
		$capteur_vis = $c->getByType('tps_vis');
		$capteur_vis_pause = $c->getByType('tps_vis_pause');
		
		
		//limiter le calcul une intervalle de temps ou la journéee entiere
		$intervalle = "";
		if($timeStart != null && $timeEnd != null){
			//$intervalle = "AND (heure BETWEEN TIME(FROM_UNIXTIME(".$timeStart.")) AND TIME(FROM_UNIXTIME(".$timeEnd.")) )";
			$intervalle = "AND timestamp BETWEEN ".$timeStart." AND ".$timeEnd;
		}
		
		$q = "select round (sum((1/(a.col_".$capteur_vis['column_oko']." + a.col_".$capteur_vis_pause['column_oko'].")) * a.col_".$capteur_vis['column_oko'].")*(".$coeff."),2) as consoPellet from oko_historique_full as a "
				."WHERE a.jour = '".$jour."' ".$intervalle;
		
		$this->log->debug("Class ".__CLASS__." | ".__FUNCTION__." | ".$q); 
		
		$result = $this->query($q);
		
		return $result->fetch_object();
	}
	
	public function getTcMaxByDay($jour, $timeStart = null, $timeEnd = null){
		$c = new capteur();
		$capteur = $c->getByType('tc_ext');
		
		//limiter le calcul une intervalle de temps ou la journéee entiere
		$intervalle = "";
		if($timeStart != null && $timeEnd != null){
			//$intervalle = "AND (heure BETWEEN TIME(FROM_UNIXTIME(".$timeStart.")) AND TIME(FROM_UNIXTIME(".$timeEnd.")) )";
			$intervalle = "AND timestamp BETWEEN ".$timeStart." AND ".$timeEnd;
		}
		
		$q = "SELECT round(max(a.col_".$capteur['column_oko']."),2) as tcExtMax FROM oko_historique_full as a "
				."WHERE a.jour = '".$jour."' ".$intervalle;
		
		$this->log->debug("Class ".__CLASS__." | ".__FUNCTION__." | ".$q); 
		
		$result = $this->query($q);
		
		return $result->fetch_object();		
				
	}
	
	public function getTcMinByDay($jour, $timeStart = null, $timeEnd = null){
		$c = new capteur();
		$capteur = $c->getByType('tc_ext');
		
		//limiter le calcul une intervalle de temps ou la journéee entiere
		$intervalle = "";
		if($timeStart != null && $timeEnd != null){
			//$intervalle = "AND (heure BETWEEN TIME(FROM_UNIXTIME(".$timeStart.")) AND TIME(FROM_UNIXTIME(".$timeEnd.")) )";
			$intervalle = "AND timestamp BETWEEN ".$timeStart." AND ".$timeEnd;
		}
		
		$q = "SELECT round(min(a.col_".$capteur['column_oko']."),2) as tcExtMin FROM oko_historique_full as a "
				."WHERE a.jour = '".$jour."' ".$intervalle;
		
		$this->log->debug("Class ".__CLASS__." | ".__FUNCTION__." | ".$q); 
		
		$result = $this->query($q);
		
		return $result->fetch_object();		
				
	}
	
	public function getDju($tcMax,$tcMin){
		$tcMoy = ($tcMax + $tcMin) / 2;
		
		if(TC_REF <=  $tcMoy ){
			return 0;
		}else{
			return round( TC_REF - $tcMoy ,2);
		}
		
	}
	
	public function getNbCycleByDay($jour){
		$c = new capteur();
		$capteur = $c->getByType('startCycle');
		
		$q = "SELECT sum(a.col_".$capteur['column_oko'].") as nbCycle FROM oko_historique_full as a "
				."WHERE a.jour = '".$jour."';";
		
		$this->log->debug("Class ".__CLASS__." | ".__FUNCTION__." | ".$q); 
		
		$result = $this->query($q);
		
		return $result->fetch_object();	
	}
	
	public function getIndicByMonth($month, $year){
		
		$q = "SELECT max(Tc_ext_max) as tcExtMax, min(Tc_ext_min) as tcExtMin, ".
				"sum(conso_kg) as consoPellet, sum(dju) as dju, sum(nb_cycle) as nbCycle ".
				"FROM oko_resume_day ".
				"WHERE MONTH(oko_resume_day.jour) = ".$month." AND ".
				"YEAR(oko_resume_day.jour) = ".$year;
		
		
		$this->log->debug("Class ".__CLASS__." | ".__FUNCTION__." | ".$q); 
		
		$result = $this->query($q);
		$r = $result->fetch_object();
		
		$this->sendResponse( json_encode( 	array( 	"tcExtMax" => $r->tcExtMax,
												"tcExtMin" => $r->tcExtMin,
												"consoPellet" => $r->consoPellet,
												"dju" => $r->dju,
												"nbCycle" => $r->nbCycle
											)
											, JSON_NUMERIC_CHECK ) );
		
		
	}
	
	public function getHistoByMonth($month,$year){
		$fields = array( session::getInstance()->getLabel('lang.text.graphe.label.tcmax') => 'tc_ext_max',
                          session::getInstance()->getLabel('lang.text.graphe.label.tcmin') => 'tc_ext_min',
                          session::getInstance()->getLabel('lang.text.graphe.label.conso') => 'conso_kg',
                          session::getInstance()->getLabel('lang.text.graphe.label.dju') => 'dju',
                          session::getInstance()->getLabel('lang.text.graphe.label.nbcycle') => 'nb_cycle'
                      );

		$resultat = array();

        $day = new DateTime($year. '/' . $month . '/' . 1);
        $start =  $day->format('y-m-d');
        $day->add(new DateInterval('P1M'));
        $day->sub(new DateInterval('P1D'));
        $end = $day->format('y-m-d');

        $columns = implode(', ', $fields);
        $sql = "SELECT $columns FROM oko_resume_day "
             . "WHERE oko_resume_day.jour BETWEEN '$start' AND '$end' "
             . "ORDER BY oko_resume_day.jour ASC";

        $this->log->debug("Class ".__CLASS__." | ".__FUNCTION__." | ".$sql); 

        $result = $this->query($sql);

        $data = array();
        while($r = $result->fetch_assoc() )
        {
          foreach ($fields as $label => $colonneSql){
            $data[$colonneSql][] = $r[$colonneSql];
          }
        }

        foreach ($fields as $label => $colonneSql){
            $this->normalizeDaysInMonth($month, $year, $data[$colonneSql]);
            array_push($resultat,array( 'name' => $label,
                                               'data' => $data[$colonneSql]
                                        )
                   );
        }

        $this->sendResponse( json_encode( $resultat ,JSON_NUMERIC_CHECK) );
	}
	
    /**
     * Initializes an array with an entry per day 
     * in a month, starting with 0 for day 1
     * 
     * @param type $inArray
     */
    private function normalizeDaysInMonth($month, $year, &$inArray)
    {
        $day = new DateTime($year. '/' . $month . '/' . 1);

        while ($month == $day->format('m')){
            if (!isset($inArray[$day->format('d') - 1]))
                $inArray[$day->format('d') - 1] = null;

            $day->add(new DateInterval('P1D'));
        }

        ksort($inArray);
    }
       
	public function getTotalSaison($idSaison){
		
		$q = "SELECT max(Tc_ext_max) as tcExtMax, min(Tc_ext_min) as tcExtMin, ".
				"sum(conso_kg) as consoPellet, sum(dju) as dju, sum(nb_cycle) as nbCycle ".
				"FROM oko_resume_day, oko_saisons ".
				"WHERE oko_saisons.id = ".$idSaison." ".
				"AND oko_resume_day.jour BETWEEN oko_saisons.date_debut AND oko_saisons.date_fin ;";
				
		
		
		$this->log->debug("Class ".__CLASS__." | ".__FUNCTION__." | ".$q); 
		
		$result = $this->query($q);
		$r = $result->fetch_object();
		
		$this->sendResponse( json_encode( 	array("tcExtMax" => $r->tcExtMax,
												"tcExtMin" => $r->tcExtMin,
												"consoPellet" => $r->consoPellet,
												"dju" => $r->dju,
												"nbCycle" => $r->nbCycle
											)
											, JSON_NUMERIC_CHECK ) );
											
	}
	
	public function getSyntheseSaison($idSaison){
		
		$fields = array( session::getInstance()->getLabel('lang.text.graphe.label.tcmax') => 'MAX(Tc_ext_max)',
							session::getInstance()->getLabel('lang.text.graphe.label.tcmin') => 'MIN(Tc_ext_min)',
							session::getInstance()->getLabel('lang.text.graphe.label.conso') => 'SUM(conso_kg)',
							session::getInstance()->getLabel('lang.text.graphe.label.dju') => 'SUM(dju)',
							session::getInstance()->getLabel('lang.text.graphe.label.nbcycle') => 'SUM(nb_cycle)'
						);
		

        $columns = implode(', ', $fields);
        
        $sql = "SELECT $columns, MIN(oko_resume_day.jour) AS jour "
              ."FROM oko_saisons "
              ."INNER JOIN oko_resume_day "
              ."WHERE oko_saisons.id = $idSaison "
              ."AND oko_resume_day.jour "
              ."BETWEEN oko_saisons.date_debut "
              ."AND oko_saisons.date_fin "
              ."GROUP BY YEAR(oko_resume_day.jour), MONTH(oko_resume_day.jour)"; // implicite order by when grouping

        $this->log->debug("Class ".__CLASS__." | ".__FUNCTION__." | ".$sql); 

        $result = $this->query($sql);

        while($r = $result->fetch_assoc() ) {
          $date = new DateTime($r['jour'], new DateTimeZone('Europe/Paris'));
          $utc = ($date->getTimestamp() + $date->getOffset()) * 1000;	

          foreach ($fields as $label => $colonneSql){
              $data[$colonneSql][] = "[".$utc.",".$r[$colonneSql]."]";
          }
        }
        
        $resultat = array();        
        foreach ($fields as $label => $colonneSql){
            $resultat[] = '{ "name": "'.$label.'", "data": ['.implode(', ', $data[$colonneSql]).']}';
        }        

        $strResultat = implode(', ', $resultat);
        		
		$this->sendResponse( '{ "grapheData": ['.$strResultat.']}' );		
	}
	
	
	public function getSyntheseSaisonTable($idSaison){
				
        $q = "SELECT DATE_FORMAT(oko_resume_day.jour,'%m-%Y') as mois, ".
					"IFNULL(sum(oko_resume_day.nb_cycle),'-') as nbCycle, ".
					"IFNULL(sum(oko_resume_day.conso_kg),'-') as conso, ".
					"IFNULL(sum(oko_resume_day.dju),'-') as dju, ".
					"IFNULL(round( ((sum(oko_resume_day.conso_kg) * 1000) / sum(oko_resume_day.dju) / ".SURFACE_HOUSE."),2),'-') as g_dju_m ".
              "FROM oko_saisons ".
              "INNER JOIN oko_resume_day ON oko_resume_day.jour BETWEEN oko_saisons.date_debut AND oko_saisons.date_fin ".
              "WHERE oko_saisons.id = $idSaison ".
              "GROUP BY YEAR(oko_resume_day.jour), MONTH(oko_resume_day.jour)";
        
		$this->log->debug("Class ".__CLASS__." | ".__FUNCTION__." | ".$q); 
		
		$result = $this->query($q);
		
		$data = array();
		while($r = $result->fetch_object() ) {
			$data[] = $r;
		}

		$this->sendResponse( json_encode($data, JSON_NUMERIC_CHECK) );
	}
	
	public function getAnnotationByDay($day){
    	$q = "SELECT timestamp * 1000 as timestamp, description FROM oko_boiler where DATE_FORMAT(FROM_UNIXTIME(timestamp), '%Y-%m-%d') LIKE '$day' ;";
    	
    	$this->log->debug("Class ".__CLASS__." | ".__FUNCTION__." | ".$q);
	    
	    $result = $this->query($q);
	    
	    if($result){
	    	$r['response'] = true;
	    	$tmp = array();
	    	while($res = $result->fetch_object()){
				array_push($tmp,$res);
			}
	    	$r['data']=$tmp;
	    }else{
	    	$r['response'] = false;
	    }
	    
	    $this->sendResponse(json_encode($r));
    }
	
}

?>
