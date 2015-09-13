<?php
/*****************************************************
* Projet : Okovision - Supervision chaudiere OeKofen
* Auteur : Stawen Dronek
* Utilisation commerciale interdite sans mon accord
******************************************************/

class administration extends connectDb{
	
	public function __construct() {
		parent::__construct();
	}
	
	public function __destruct() {
		parent::__destruct();
	}
	
	private function sendResponse($t){
        header("Content-type: text/json; charset=utf-8");
		echo json_encode($t, JSON_NUMERIC_CHECK);
    }
	
	public function ping($adress){
		
		$waitTimeoutInSeconds = 1; 
		
		$r = array();
		$tmp = explode(':',$adress);
		$ip = $tmp[0];
		$port = isset( $tmp[1] )?$tmp[1]:80;
		
		if($fp = fsockopen($ip,$port,$errCode,$errStr,$waitTimeoutInSeconds)){   
		   // It worked 
		   $r['response'] = true;
		   $r['url'] = 'http://'.$adress.URL;
		  
		} else {
		   $r['response'] = false;
		} 
		fclose($fp);
		
		$this->sendResponse($r);
		
	}
	
	public function saveInfoGenerale($s){
		/* Make config.json */
      
        $param = array(
                        "chaudiere"                 => $s['oko_ip'],
                        "tc_ref"                    => $s['param_tcref'],
                        "poids_pellet"              => $s['param_poids_pellet'],
                        "surface_maison"            => $s['surface_maison'],
                        "get_data_from_chaudiere"   => $s['oko_typeconnect'],
                        "send_to_web"               => $s['send_to_web']
                    );
        
        $r = array();
        $r['response'] = true;
        
        $ok = file_put_contents(CONTEXT.'/config.json',json_encode($param, JSON_UNESCAPED_SLASHES));
        
        if(!$ok)  $r['response'] = false;
        
        
        $this->sendResponse($r);
	}
	
	
	public function getFileFromChaudiere(){
        $r['response'] = true;
	    
	    $htmlCode = file_get_contents('http://'.CHAUDIERE.URL);

        $dom = new DOMDocument();
        
        $dom->LoadHTML($htmlCode);
        
        $links = $dom->GetElementsByTagName('a');
        
        $t_href = array();
        foreach($links as $a) {
            $href = $a->getAttribute('href');
            
            if(preg_match("/csv/i",$href)){
               array_push($t_href, array(
                                        "file" => trim(str_replace(URL."/","",$href)),
                                        "url" => 'http://'.CHAUDIERE.$href
                                        ) 
                        );
            }
            
        }
	    $r['listefiles'] = $t_href;
	    
	    
	    $this->sendResponse($r);
	}
	
	public function importFileFromChaudiere($s){
	    $r = array();
	    $r['response'] = true;
	    $import = false;
	    
	    $oko = new okofen();
	    $status = $oko->getChaudiereData('onDemande',$s['url']);
	    //$status =true;
	    if($status){
	        $import = $oko->csv2bdd();
	    }else{
	        $r['response'] = false;
	    }
	    if (!$import) $r['response'] = false;
	    
	    $this->sendResponse($r);
	    
	}
	
	public function uploadCsv($s,$f){
		$upload_handler = new UploadHandler();

		if(isset($s['actionFile'])){
			
			if($s['actionFile'] == 'matrice'){
				$matrice = 'matrice.csv';
				$rep = $upload_handler->getOption()['upload_dir'];
				
				if(file_exists ( $rep.$matrice )){
					unlink($rep.$matrice);
				}
				//si rename ok, alors init de la table capteur
				if(rename($rep.$f['files']['name'][0], $rep.$matrice)){
					$this->initMatriceFromFile();
					
				}
				
			}
			
			if($s['actionFile'] == 'majusb'){
				$matrice = 'import.csv';
				$rep = $upload_handler->getOption()['upload_dir'];
				
				if(file_exists ( $rep.$matrice )){
					unlink($rep.$matrice);
				}
			
				rename($rep.$f['files']['name'][0], $rep.$matrice);
				
			}
			
		}
		$upload_handler->generate_response_manual();
		
	}
	/*
	* Function : Insert into oko_capteur all capteur in csv file from okofen
	*/
	private function initMatriceFromFile(){
		//translation
		$capteur = json_decode(file_get_contents("_langs/fr.matrice.json"), true);
	    //open matrice file just uploaded, first line
	    $line = mb_convert_encoding(fgets(fopen('_tmp/matrice.csv', 'r')),'UTF-8'); 
		//on retire le dernier ; de la ligne
		$line = substr($line,0,strlen($line)-2);
		$this->log->debug("Class ".__CLASS__." | ".__FUNCTION__." | CSV First Line | ".$line);
		
		$query = ""; 
	
		$column = explode(CSV_SEPARATEUR, $line);
		
		foreach ($column as $position => $t){
			//set only capteur not day and hour
			if($position != 0 && $position != 1){
				$title = trim($t);
				
				if (isset($capteur[$title])){
					$name = $capteur[$title]['name'];
					$type = $capteur[$title]['type'];
				}else{
					$name = $title;
					$type = "";
				}
				
				$q = "INSERT INTO oko_capteur(name,position_column_csv,original_name,type) VALUE ('".$name."',".$position.",'".$title."','".$type."');" ;
				
				$this->log->debug("Class ".__CLASS__." | ".__FUNCTION__." | Create oko_capteur | ".$q);
				$query .= $q;
			}
    	}
		//insertion d'une reference au demarrage des cycles de chauffe
		$query .= "INSERT INTO oko_capteur(name,position_column_csv,original_name,type) VALUES ('Start Cycle',99,'Start Cycle','startCycle');" ;
		
		
		$result = $this->db->multi_query($query);
		//$this->db->free();
		
	}
	
	public function getHeaderFromOkoCsv(){
		
		$r = array();
	    //$lock = array("Datum","Zeit","AT [°C]","PE1 Einschublaufzeit[zs]","PE1 Pausenzeit[zs]","PE1 Status");
	    $q = "select id, name, original_name, type from oko_capteur order by id";
	    $this->log->debug("Class ".__CLASS__." | ".__FUNCTION__." | ".$q);
	    
	    $result = $this->db->query($q);
	    
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
	    
	    $this->sendResponse($r);
	}
	
	public function statusMatrice(){
		$q = "select count(*) from oko_capteur";
	    
	    
	    $result = $this->db->query($q);
	    
	    $r['response'] = false;
	    
	    if($result){
	    	$res = $result->fetch_row();
	    	$this->log->debug("Class ".__CLASS__." | ".__FUNCTION__." | ".$res[0]);
	    	
	    	if ($res[0] > 1) {
	    		$r['response'] = true;
	    	}
	    }
	    
	    $this->sendResponse($r);
	    
	}
	
	public function importcsv(){
		$oko = new okofen();
		$r['response'] = $oko->csv2bdd();
		$this->sendResponse($r);
	}
	
	public function getDayWithoutSynthese(){
		//ne pas proposer la date du jour, car forcement incomplete.
		$now = date('Y-m-d' ,mktime(0, 0, 0, date("m")  , date("d"), date("Y")) );
		
		$q = "SELECT a.jour as jour FROM oko_historique as a ".
				"LEFT OUTER JOIN oko_resume_day as b ON a.jour = b.jour ".
				"WHERE b.jour is NULL AND a.jour <> '".$now."'group by a.jour;";
		
		$result = $this->db->query($q);
	    $r['data'] = [];
	    
	    if($result){
	    	$tmp = array();
	    	while($res = $result->fetch_object()){
				array_push($tmp,$res);
			}
	    	$r['data']=$tmp;
	    }
	    
	    $this->sendResponse($r);				
				
	}
	
	public function makeSyntheseByDay($jour){
		$oko = new okofen();
		$r['response'] = $oko->makeSyntheseByDay('onDemande', $jour);
		$this->sendResponse($r);
		
	}

	public function getSaisons(){
		
		$r = array();
	    //$lock = array("Datum","Zeit","AT [°C]","PE1 Einschublaufzeit[zs]","PE1 Pausenzeit[zs]","PE1 Status");
	    $q = "select id, saison, DATE_FORMAT(date_debut,'%d/%m/%Y') as date_debut, date_debut as startDate, DATE_FORMAT(date_fin,'%d/%m/%Y') as date_fin, date_fin as endDate from oko_saisons order by date_debut";
	   
	    $this->log->debug("Class ".__CLASS__." | ".__FUNCTION__." | ".$q);
	    
	    $result = $this->db->query($q);
	    
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
	    
	    //$result->free();
	    $this->sendResponse($r);
	}
	
	public function existSaison($jour){
		
		$r = array();
	    
	    $q = "select count(*) from oko_saisons where date_debut = '".$jour."'";
	    
	    $this->log->debug("Class ".__CLASS__." | ".__FUNCTION__." | ".$q);
	    
	    $result = $this->db->query($q);
	    
	    $r['response'] = false;
	    
	    if($result){
	    	$res = $result->fetch_row();
	    	
	    	if ($res[0] > 0) {
	    		$r['response'] = true;
	    	}
	    }
	    
	    $this->sendResponse($r);
	}
	
	private function getDateSaison($startDate){
		$date = DateTime::createFromFormat('Y-m-d', $startDate);
		
		$start 	= $date->format('Y-m-d');
		$saison = $date->format('Y');
			
		$date->add(new DateInterval("P1Y"));
		$date->sub(new DateInterval("P1D"));
		$end = $date->format('Y-m-d');
		
		$saison .= "-".$date->format('Y');
		
		return array (
			'start' 	=> $start,
			'end'		=> $end,
			'saison' 	=> $saison
			);
	}
	
	public function setSaison($s){
		$r = array();
		
		$dates = $this->getDateSaison($s['startDate']);
		//insertion d'une reference au demarrage des cycles de chauffe
		$query = "INSERT INTO oko_saisons (saison, date_debut, date_fin) VALUES('".$dates['saison']."','".$dates['start']."','".$dates['end']."');" ;
		$this->log->debug("Class ".__CLASS__." | ".__FUNCTION__." | ".$query);
		
		$r['response'] = $this->db->query($query);
		
		$this->sendResponse($r);
	}
	
	public function updateSaison($s){
		$r = array();
		
		$dates = $this->getDateSaison($s['startDate']);
		//insertion d'une reference au demarrage des cycles de chauffe
		$query = "UPDATE oko_saisons set saison='".$dates['saison']."', date_debut='".$dates['start']."', date_fin='".$dates['end']."' where id=".$s['idSaison']  ;
		
		$this->log->debug("Class ".__CLASS__." | ".__FUNCTION__." | ".$query);
		
		$r['response'] = $this->db->query($query);
		
		$this->sendResponse($r);
	}
	
	
	public function deleteSaison($s){
		$r = array();
		$query = "DELETE FROM oko_saisons where id=".$s['idSaison'];
		
		$r['response'] = $this->db->query($query);
		$this->sendResponse($r);
	}
	
	
	/*
	* Function return current version
	*/
	public function getCurrentVersion(){
		return file_get_contents("_include/version.json");
	}
	
	/*
	* Function set current version in version.json
	*/
	private function setCurrentVersion($v){
		return file_put_contents("_include/version.json", $v);
	}
	
	public function checkUpdate(){
		$r= [];
		$r['newVersion'] = false;
		$r['information'] = '';
		
		$update = new AutoUpdate();
		$update->setCurrentVersion($this->getCurrentVersion());
		
		if ($update->checkUpdate() === false)
			$r['information'] = session::getLabel('lang.error.maj.information');
		
		elseif ($update->newVersionAvailable()) {
			$r['newVersion'] = true;
			$r['list'] = $update->getVersionsInformationToUpdate();
			
		}else{
			$r['information'] = session::getLabel('lang.valid.maj.information');
			
		}
		
		return $this->sendResponse($r);
		
		
	}
	
	public function makeUpdate(){
		$r = [];
		$r['install'] = false;
		$update = new AutoUpdate();
		$update->setCurrentVersion($this->getCurrentVersion());
		
		$result = $update->update(); //fait une simulation d'abord, si ok ça install
		if ($result === true) {
			//echo 'Update successful<br>';
			$r['install'] = true;
			
		} else { // si echec de la simulation d'install
			//echo 'Update failed: ' . $result . '!<br>';
			if ($result = AutoUpdate::ERROR_SIMULATE) {
				$r['information'] = '<pre>'.var_dump($update->getSimulationResults()).'</pre>';
			}
		}
		
		return $this->sendResponse($r);
		
	}

}

?>