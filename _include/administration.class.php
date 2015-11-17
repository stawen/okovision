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
		
		if($fp = @fsockopen($ip,$port,$errCode,$errStr,$waitTimeoutInSeconds)){   
		   // It worked 
		   $r['response'] = true;
		   $r['url'] = 'http://'.$adress.URL;
		  
		} else {
		   $r['response'] = false;
		} 
		@fclose($fp);
		
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
                        "timezone"					=> $s['timezone'],
                        "send_to_web"               => $s['send_to_web']
                    );
        
        $r = array();
        $r['response'] = true;
        
        //$ok = file_put_contents(CONTEXT.'/config.json',json_encode($param, JSON_UNESCAPED_SLASHES));
        $ok = file_put_contents(CONTEXT.'/config.json',json_encode($param));
        
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
				$opt = $upload_handler->getOption();
				$rep = $opt['upload_dir'];
				
				if(file_exists ( $rep.$matrice )){
					unlink($rep.$matrice);
				}
				//si rename ok, alors init de la table capteur
				if(rename($rep.$f['files']['name'][0], $rep.$matrice)){
					if(!isset($s['update'])){
						$this->initMatriceFromFile();
					}else{
						$this->updateMatriceFromFile();
					}
					
				}
				
			}
			
			if($s['actionFile'] == 'majusb'){
				$matrice = 'import.csv';
				$opt = $upload_handler->getOption();
				$rep = $opt['upload_dir'];
				
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
		$dico = json_decode(file_get_contents("_langs/fr.matrice.json"), true);
	    //open matrice file just uploaded, first line
	    $line = fgets(fopen('_tmp/matrice.csv', 'r')); 
		
		//on retire le dernier ; de la ligne et on convertie la chaine en utf8
		//$line = mb_convert_encoding(substr($line,0,strlen($line)-2),'UTF-8');
		$string = substr($line,0,strlen($line)-2);
		$line = mb_convert_encoding($string, "UTF-8", mb_detect_encoding($string, "UTF-8, ISO-8859-1, ISO-8859-15", true));
		
		$this->log->debug("Class ".__CLASS__." | ".__FUNCTION__." | CSV First Line | ".$line);
		
		$query = ""; 
	
		$column = explode(CSV_SEPARATEUR, $line);
		
		foreach ($column as $position => $t){
			//set only capteur not day and hour
			if($position != 0 && $position != 1){
				$title = trim($t);
				
				if (isset($dico[$title])){
					$name = $dico[$title]['name'];
					$type = $dico[$title]['type'];
				}else{
					$name = $title;
					$type = "";
				}
				
				$q = "INSERT INTO oko_capteur(name,position_column_csv,column_oko, original_name,type) VALUE ('".$name."',".$position.",".$position.",'".$title."','".$type."');" ;
				
				$this->log->debug("Class ".__CLASS__." | ".__FUNCTION__." | Create oko_capteur | ".$q);
				$query .= $q;
			}
    	}
		//insertion d'une reference au demarrage des cycles de chauffe
		$query .= "INSERT INTO oko_capteur(name,position_column_csv,column_oko,original_name,type) VALUES ('Start Cycle',99,99,'Start Cycle','startCycle');" ;
		
		
		$result = $this->multi_query($query);
		while ($this->flush_multi_queries()) {;} // flush multi_queries
		
	}
	
		/*
	* Function : update into oko_capteur all capteur in csv file from okofen
	*/
	private function updateMatriceFromFile(){
		//translation
		$dico = json_decode(file_get_contents("_langs/fr.matrice.json"), true);
	    //open matrice file just uploaded, first line
	    $line = fgets(fopen('_tmp/matrice.csv', 'r')); 
		//on retire le dernier ; de la ligne
		$line = mb_convert_encoding(substr($line,0,strlen($line)-2),'UTF-8');
		
		$this->log->debug("Class ".__CLASS__." | ".__FUNCTION__." | CSV First Line | ".$line);
		
		$c = new capteur();
		$capteurs = $c->getMatrix();
		$capteursCsv = array();
		$lastColumnOko = $c->getLastColumnOko();
		
		$query = ""; 
	
		$column = explode(CSV_SEPARATEUR, $line);
		//$capteursCsv = array_slice(array_flip($column),2);
		
		//on deroule la liste des capteurs dans le csv
		//cela va tester le deplacement d'un capteur par rapport à la bdd ou l'ajout d'un capteur
		foreach ($column as $position => $t){
			//set only capteur not day and hour
			if($position != 0 && $position != 1){
				
				
				$title = trim($t);
				$capteursCsv[$title] = $position;
				
				//on test si le capteur etait deja connu dans la base oko_capteur
				if(array_key_exists($title,$capteurs)){
					//on verifie si la position du capteur a changer, si oui, maj de la bdd
					if($capteurs[$title]->position_column_csv !== $position){
						$q = "UPDATE oko_capteur set position_column_csv=".$position." where id=".$capteurs[$title]->id.";";
						$this->log->debug("Class ".__CLASS__." | ".__FUNCTION__." | Update oko_capteur | ".$q);		
					}
				}else{
					//capteur pas connu dans la base, on le met en fin de table  oko_capteur
					if (isset($dico[$title])){
						$name = $dico[$title]['name'];
						$type = $dico[$title]['type'];
					}else{
						$name = $title;
						$type = "";
					}
					$lastColumnOko++;
					$q = "INSERT INTO oko_capteur(name,position_column_csv,column_oko, original_name,type) VALUE ('".$name."',".$position.",".$lastColumnOko.",'".$title."','".$type."');" ;
					$this->log->debug("Class ".__CLASS__." | ".__FUNCTION__." | Create New oko_capteur | ".$q);
					
				}
				
				$query .=$q;
			}
    	}
    	//on test maintenant le retrait d'un capteur dans le csv par rapport à la base oko_capteur
    	$forbidenCapteurs = array_diff_key($capteurs,$capteursCsv);
    	
    	foreach ($forbidenCapteurs as $t => $position){
    		//si le capteur n'est plus present dans le csv, on met a jour la table en lui mettant -1 dans sa position_csv
    		$title = trim($t);
    		$q = "UPDATE oko_capteur set position_column_csv=-1 where id=".$capteurs[$title]->id.";";
			$this->log->debug("Class ".__CLASS__." | ".__FUNCTION__." | Disable oko_capteur | ".$q);
			
			$query .=$q;
    	}
    	
		
		$result = $this->multi_query($query);
		while ($this->flush_multi_queries()) {;} // flush multi_queries
		
	}
	
	public function getHeaderFromOkoCsv(){
		
		$r = array();
	    //$lock = array("Datum","Zeit","AT [°C]","PE1 Einschublaufzeit[zs]","PE1 Pausenzeit[zs]","PE1 Status");
	    $q = "select id, name, original_name, type from oko_capteur where position_column_csv <> -1 order by position_column_csv";
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
	    
	    $this->sendResponse($r);
	}
	
	public function statusMatrice(){
		$q = "select count(*) from oko_capteur";
	    
	    
	    $result = $this->query($q);
	    
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
		
		$q = "SELECT a.jour as jour FROM oko_historique_full as a ".
				"LEFT OUTER JOIN oko_resume_day as b ON a.jour = b.jour ".
				"WHERE b.jour is NULL AND a.jour <> '".$now."'group by a.jour;";
		
		$this->log->debug("Class ".__CLASS__." | ".__FUNCTION__." | ".$q);
		
		$result = $this->query($q);
	    $r['data'] = array();
	    
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
	    
	    //$result->free();
	    $this->sendResponse($r);
	}
	
	public function existSaison($jour){
		
		$r = array();
	    
	    $q = "select count(*) from oko_saisons where date_debut = '".$jour."'";
	    
	    $this->log->debug("Class ".__CLASS__." | ".__FUNCTION__." | ".$q);
	    
	    $result = $this->query($q);
	    
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
		
		$r['response'] = $this->query($query);
		
		$this->sendResponse($r);
	}
	
	public function updateSaison($s){
		$r = array();
		
		$dates = $this->getDateSaison($s['startDate']);
		//insertion d'une reference au demarrage des cycles de chauffe
		$query = "UPDATE oko_saisons set saison='".$dates['saison']."', date_debut='".$dates['start']."', date_fin='".$dates['end']."' where id=".$s['idSaison']  ;
		
		$this->log->debug("Class ".__CLASS__." | ".__FUNCTION__." | ".$query);
		
		$r['response'] = $this->query($query);
		
		$this->sendResponse($r);
	}
	
	
	public function deleteSaison($s){
		$r = array();
		$query = "DELETE FROM oko_saisons where id=".$s['idSaison'];
		
		$r['response'] = $this->query($query);
		$this->sendResponse($r);
	}
	
	
	/*
	* Function return current version
	*/
	public function getVersion(){
		$this->sendResponse($this->getCurrentVersion());
	}
	
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
		$r= array();
		$r['newVersion'] = false;
		$r['information'] = '';
		
		$update = new AutoUpdate();
		$update->setCurrentVersion($this->getCurrentVersion());
		
		if ($update->checkUpdate() === false)
			$r['information'] = session::getInstance()->getLabel('lang.error.maj.information');
		
		elseif ($update->newVersionAvailable()) {
			$r['newVersion'] = true;
			$r['list'] = $update->getVersionsInformationToUpdate();
			
		}else{
			$r['information'] = session::getInstance()->getLabel('lang.valid.maj.information');
			
		}
		
		return $this->sendResponse($r);
		
		
	}
	
	public function makeUpdate(){
		$r = array();
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
	
	public function getFileFromTmp(){
		$files = scandir('_tmp');
		$r = array();
		foreach($files as $f){
			if ($f <> '.' && $f <> '..' && $f <> 'matrice.csv' && $f <> 'import.csv' && $f <> 'readme.md'){
				$r[] = $f;
			}
		}
		
		return $this->sendResponse($r);
	}
	
	public function importFileFromTmp($file){
		if(file_exists ( '_tmp/import.csv' )){
			unlink('_tmp/import.csv');
		}
	
		rename('_tmp/'.$file, '_tmp/import.csv');
		
		$this->importcsv();
		
	}
	
	public function getDateForMigrate(){
		ini_set('max_execution_time', 120);
		/*
		SELECT a.jour as jour FROM oko_historique as a ".
				"LEFT OUTER JOIN oko_resume_day as b ON a.jour = b.jour ".
				"WHERE b.jour is NULL AND a.jour <> '".$now."'group by a.jour;";
		*/
		$newTableHistorique = "CREATE TABLE IF NOT EXISTS `oko_historique_full` (`jour` DATE NOT NULL,`heure` TIME NOT NULL,`col_2` DECIMAL(6,2) NULL DEFAULT NULL,`col_3` DECIMAL(6,2) NULL DEFAULT NULL,`col_4` DECIMAL(6,2) NULL DEFAULT NULL,`col_5` DECIMAL(6,2) NULL DEFAULT NULL,`col_6` DECIMAL(6,2) NULL DEFAULT NULL,`col_7` DECIMAL(6,2) NULL DEFAULT NULL,`col_8` DECIMAL(6,2) NULL DEFAULT NULL,`col_9` DECIMAL(6,2) NULL DEFAULT NULL,`col_10` DECIMAL(6,2) NULL DEFAULT NULL,`col_11` DECIMAL(6,2) NULL DEFAULT NULL,`col_12` DECIMAL(6,2) NULL DEFAULT NULL,`col_13` DECIMAL(6,2) NULL DEFAULT NULL,`col_14` DECIMAL(6,2) NULL DEFAULT NULL,`col_15` DECIMAL(6,2) NULL DEFAULT NULL,`col_16` DECIMAL(6,2) NULL DEFAULT NULL,`col_17` DECIMAL(6,2) NULL DEFAULT NULL,`col_18` DECIMAL(6,2) NULL DEFAULT NULL,`col_19` DECIMAL(6,2) NULL DEFAULT NULL,`col_20` DECIMAL(6,2) NULL DEFAULT NULL,`col_21` DECIMAL(6,2) NULL DEFAULT NULL,`col_22` DECIMAL(6,2) NULL DEFAULT NULL,`col_23` DECIMAL(6,2) NULL DEFAULT NULL,`col_24` DECIMAL(6,2) NULL DEFAULT NULL,`col_25` DECIMAL(6,2) NULL DEFAULT NULL,`col_26` DECIMAL(6,2) NULL DEFAULT NULL,`col_27` DECIMAL(6,2) NULL DEFAULT NULL,`col_28` DECIMAL(6,2) NULL DEFAULT NULL,`col_29` DECIMAL(6,2) NULL DEFAULT NULL,`col_30` DECIMAL(6,2) NULL DEFAULT NULL,`col_31` DECIMAL(6,2) NULL DEFAULT NULL,`col_32` DECIMAL(6,2) NULL DEFAULT NULL,`col_33` DECIMAL(6,2) NULL DEFAULT NULL,`col_34` DECIMAL(6,2) NULL DEFAULT NULL,`col_35` DECIMAL(6,2) NULL DEFAULT NULL,`col_36` DECIMAL(6,2) NULL DEFAULT NULL,`col_37` DECIMAL(6,2) NULL DEFAULT NULL,`col_38` DECIMAL(6,2) NULL DEFAULT NULL,`col_39` DECIMAL(6,2) NULL DEFAULT NULL,`col_40` DECIMAL(6,2) NULL DEFAULT NULL,`col_41` DECIMAL(6,2) NULL DEFAULT NULL,`col_42` DECIMAL(6,2) NULL DEFAULT NULL,`col_43` DECIMAL(6,2) NULL DEFAULT NULL,`col_44` DECIMAL(6,2) NULL DEFAULT NULL,`col_45` DECIMAL(6,2) NULL DEFAULT NULL,`col_46` DECIMAL(6,2) NULL DEFAULT NULL,`col_47` DECIMAL(6,2) NULL DEFAULT NULL,`col_48` DECIMAL(6,2) NULL DEFAULT NULL,`col_49` DECIMAL(6,2) NULL DEFAULT NULL,`col_50` DECIMAL(6,2) NULL DEFAULT NULL,`col_51` DECIMAL(6,2) NULL DEFAULT NULL,`col_52` DECIMAL(6,2) NULL DEFAULT NULL,`col_53` DECIMAL(6,2) NULL DEFAULT NULL,`col_54` DECIMAL(6,2) NULL DEFAULT NULL,`col_55` DECIMAL(6,2) NULL DEFAULT NULL,`col_56` DECIMAL(6,2) NULL DEFAULT NULL,`col_57` DECIMAL(6,2) NULL DEFAULT NULL,`col_58` DECIMAL(6,2) NULL DEFAULT NULL,`col_59` DECIMAL(6,2) NULL DEFAULT NULL,`col_60` DECIMAL(6,2) NULL DEFAULT NULL,`col_61` DECIMAL(6,2) NULL DEFAULT NULL,`col_62` DECIMAL(6,2) NULL DEFAULT NULL,`col_63` DECIMAL(6,2) NULL DEFAULT NULL,`col_64` DECIMAL(6,2) NULL DEFAULT NULL,`col_65` DECIMAL(6,2) NULL DEFAULT NULL,`col_66` DECIMAL(6,2) NULL DEFAULT NULL,`col_67` DECIMAL(6,2) NULL DEFAULT NULL,`col_68` DECIMAL(6,2) NULL DEFAULT NULL,`col_69` DECIMAL(6,2) NULL DEFAULT NULL,`col_70` DECIMAL(6,2) NULL DEFAULT NULL,`col_71` DECIMAL(6,2) NULL DEFAULT NULL,`col_72` DECIMAL(6,2) NULL DEFAULT NULL,`col_73` DECIMAL(6,2) NULL DEFAULT NULL,`col_74` DECIMAL(6,2) NULL DEFAULT NULL,`col_75` DECIMAL(6,2) NULL DEFAULT NULL,`col_76` DECIMAL(6,2) NULL DEFAULT NULL,`col_77` DECIMAL(6,2) NULL DEFAULT NULL,`col_78` DECIMAL(6,2) NULL DEFAULT NULL,`col_79` DECIMAL(6,2) NULL DEFAULT NULL,`col_80` DECIMAL(6,2) NULL DEFAULT NULL,`col_81` DECIMAL(6,2) NULL DEFAULT NULL,`col_82` DECIMAL(6,2) NULL DEFAULT NULL,`col_83` DECIMAL(6,2) NULL DEFAULT NULL,`col_84` DECIMAL(6,2) NULL DEFAULT NULL,`col_85` DECIMAL(6,2) NULL DEFAULT NULL,`col_86` DECIMAL(6,2) NULL DEFAULT NULL,`col_87` DECIMAL(6,2) NULL DEFAULT NULL,`col_88` DECIMAL(6,2) NULL DEFAULT NULL,`col_89` DECIMAL(6,2) NULL DEFAULT NULL,`col_90` DECIMAL(6,2) NULL DEFAULT NULL,`col_91` DECIMAL(6,2) NULL DEFAULT NULL,`col_92` DECIMAL(6,2) NULL DEFAULT NULL,`col_93` DECIMAL(6,2) NULL DEFAULT NULL,`col_94` DECIMAL(6,2) NULL DEFAULT NULL,`col_95` DECIMAL(6,2) NULL DEFAULT NULL,`col_96` DECIMAL(6,2) NULL DEFAULT NULL,`col_97` DECIMAL(6,2) NULL DEFAULT NULL,`col_98` DECIMAL(6,2) NULL DEFAULT NULL,`col_99` DECIMAL(6,2) NULL DEFAULT NULL,PRIMARY KEY (`jour`, `heure`)) ENGINE=InnoDB DEFAULT CHARSET=utf8;";
		$this->log->info("Class ".__CLASS__." | ".__FUNCTION__." | ".$newTableHistorique);
		$this->query($newTableHistorique);
		
		$q = "select distinct(jour) from oko_historique group by jour";
		
		$result = $this->query($q);
	    $r = array();
	    
	    if($result){
	    	while($res = $result->fetch_object()){
				array_push($r,$res);
			}
	    }
	    
	    $this->sendResponse($r);
		
	}
	
	public function migrateDataForDate($jour){
		$r['response']= false;
		$error = false;
		
		//on recupere la matrice des capteurs
    	$ob_capteur 	= new capteur();
		$capteurs 		= $ob_capteur->getForImportCsv(); //l'index du tableau correspond a la colonne du capteur dans le fichier csv
		
		$insert = "INSERT IGNORE INTO oko_historique_full set jour = '".$jour."'";
        
        //puis apres le jour, les minutes present pour le jour en cours
        $qHeure = "select distinct(heure) from oko_historique where jour = '".$jour."' group by heure";
        $resHeure = $this->query($qHeure);
        
        while($rHeure = $resHeure->fetch_object()){
            
            $set = ", heure = '".$rHeure->heure."'";
            //puis pour chaque minutes on recupere pour chaque capteur
            foreach($capteurs as $positionCsv => $capteur){
                
                $qCapteur = "select value from oko_historique where jour ='".$jour."' AND heure ='".$rHeure->heure."' AND oko_capteur_id=".$capteur['id'];
                //$this->log->debug("_UPGRADE | ".$qCapteur);
                $resCapteur = $this->query($qCapteur);
                $rCapteur = $resCapteur->fetch_object();
                
				if ($rCapteur == null){
                    $value   = 'null';
                }else{
					$value = $rCapteur->value; 
				}
                $set .= ", col_".$positionCsv."=".$value ; 
                
            }
            
            //$this->log->debug("_UPGRADE | ".$insert.$set);
            
            if(!$this->query($insert.$set)){
				$this->log->debug("Class ".__CLASS__." | ".__FUNCTION__." | ".$insert.$set);
				$error = true;
			}
			
		
		}
		//on supprime la ligne dans oko_historique si pas d'erreur lors de la migration de la journéee
		if(!$error){
			$q = "delete from oko_historique where jour = '".$jour."'";
					
			if($this->query($q)){
				$r['response']= true;
			}
		}
		
		$this->sendResponse($r);
		
	}
	
	public function login($user,$pass){
		
		$user = $this->realEscapeString($user);
		$pass = sha1( $this->realEscapeString($pass) );
		
		$q = "select count(*) as nb,type from oko_user where user='$user' and pass='$pass'";
		
		$result = $this->query($q);
		$this->log->debug("Class ".__CLASS__." | ".__FUNCTION__." | ".$q);
		
		$r['response'] = false;
		
		if($result){
			$res = $result->fetch_object();
	    	
	    	if ($res->nb == 1) {
	    		$r['response'] = true;
	    		session::getInstance()->setVar("typeUser", $res->type);
	    		session::getInstance()->setVar("logged", true);
	    	}
	    }	
		$this->sendResponse($r);
	}
	
	public function logout(){
		session::getInstance()->deleteVar("logged");
		session::getInstance()->deleteVar("typeUser");
		$r['response'] = true;
		$this->sendResponse($r);
			
	}

}

?>