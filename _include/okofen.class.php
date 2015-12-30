<?php
/*****************************************************
* Projet : Okovision - Supervision chaudiere OeKofen
* Auteur : Stawen Dronek
* Utilisation commerciale interdite sans mon accord
******************************************************/

class okofen extends connectDb{
	
	private $_loginUrl		 	= '';
	private $_cookies 			= '';
	private $_responseBoiler 	= '';
	private $_response			= '';
	private $_connected			= true;
	
	public function __construct() {
		parent::__construct();
		
		$this->_loginUrl = 'http://'.CHAUDIERE.'/index.cgi';
		$this->_cookies = CONTEXT.'/_tmp/cookies_boiler.txt';
		
	}
	
	public function __destruct() {
		parent::__destruct();
	}
	
	//fonction de telechargement de fichier sur internet
	// download('http://xxx','/usr/var/tmp)');
	private function download($file_source, $file_target) {
		$rh = fopen($file_source, 'rb');
		$wh = fopen($file_target, 'w+b');
		if (!$rh || !$wh) {
			return false;
		}

		while (!feof($rh)) {
			if (fwrite($wh, fread($rh, 4096)) === FALSE) {
				return false;
			}
		}

		fclose($rh);
		fclose($wh);

		return true;
	}				
	//pour que cela marche, il faut le la tache cron s'execute toutes les 2 heure a partir de 00:15
	//si nous sommes entre 00 et 02 heures du matin, nous recuperons le fichir de la veuille, sinon le fichier du jour courant
	//le cron doit s'executer a 00:15 pour etre bien
	private function newDay(){
		$hour = date("H"); //17
		//$this->log->debug("hour::".$hour);
		if ($hour == '00' || $hour == '01'){
			//$this->log->debug("Minuit");
			return true;
		}else{
			return false;
		}
	}
	
	/*
	* Fonction pour recuperer les fichiers csv present sur la chaudiere
	* Cron / OnDemand : 
	*	Cron -> en finction de l'heure d'appel il recupere le fichier du jour ou de la veille
	*	Ondemande -> recupere celui qui lui est precisé
	*/
	public function getChaudiereData($trigger = 'cron', $url = ''){
		
		if($trigger <> 'onDemande'){
    		if ($this->newDay()){
    			$today = date('Ymd' ,mktime(0, 0, 0, date("m")  , date("d")-1, date("Y")) );
    		}else{
    			$today = date("Ymd"); // 20010310
    		}
    
    		$link = PATH.$today.EXTENTION;
		}else{
		    $link = $url;
		}
		
		$this->log->info("Class ".__CLASS__." | ".__FUNCTION__." |  Recuperation du fichier ".$link);
		//on lance le dl
		$result = $this->download($link,CSVFILE);
		//$result = true;
		if (!$result){
			 //throw new Exception('Download error...');
			 $this->log->error("Class ".__CLASS__." | ".__FUNCTION__." | Données chaudiere non recupérées");
			 return false;
		}else{
			$this->log->info("Class ".__CLASS__." | ".__FUNCTION__." | SUCCESS - données chaudiere récupérées");
			return true;
		}

	}
	/*
	* integration du fichier csv dans okovision
	*/
	//V1.3.0
	public function csv2bdd(){
		ini_set('max_execution_time', 120);
		$t = new timeExec();
		
		$ob_capteur 	= new capteur();
		$capteurs 		= $ob_capteur->getForImportCsv(); //l'index du tableau correspond a la colonne du capteur dans le fichier csv
		$capteurStatus 	= $ob_capteur->getByType('status');
		$startCycle 	= $ob_capteur->getByType('startCycle');
		unset($ob_capteur);
		
		$file 			= fopen(CSVFILE, 'r');
		$ln 			= 0;
		$old_status  	= 0;
		$start_cycle 	= 0;
		
		//$insert = "INSERT IGNORE INTO oko_historique (jour,heure,oko_capteur_id,value) VALUES ";
		$insert = "INSERT IGNORE INTO oko_historique_full SET ";
		while (!feof($file))
		{
			$ligne = fgets($file);
			//ne pas prendre en compte la derniere colonne vide
			$ligne = substr($ligne,0,strlen($ligne)-2);
			
			if($ln != 0){ //pour ne pas lire la premiere ligne d'entete du fichier csv
				$colCsv = explode(CSV_SEPARATEUR, $ligne);
			
					
				if(isset($colCsv[1])){ //test si ligne non vide
					
					$nbColCsv = count($colCsv);
					
					$jour 	= $colCsv[0];
					$heure 	= $colCsv[1];
					$query 	= 	"";
					
					$beginValue = 	"jour = STR_TO_DATE('".$jour."','%d.%m.%Y'),".		// jour
									"heure = '".$heure."',".// heure
									"timestamp = UNIX_TIMESTAMP(CONCAT(STR_TO_DATE('".$jour."','%d.%m.%Y'),' ','".$heure."'))"; //utc timestamp							
					
					$query = $insert.$beginValue;			
					//Detection demarrage d'un cycle //Statut 4 = Debut d'un cycle sur le front montant du statut
					if( $colCsv[$capteurStatus['position_column_csv']] == "4" && $colCsv[$capteurStatus['position_column_csv']] <> $old_status){
						$st = 1;
						//creation de la requette pour le comptage des cycle de la chaudiere
						//Enregistrement de 1 si nous commençons un cycle d'allumage
						$query .= ", col_".$startCycle['column_oko']."=".$st;
					}
					
					//creation de la requette sql pour les capteurs
					//on commence à la deuxieme colonne de la ligne du csv
					for($i=2;$i<$nbColCsv;$i++){
					    $query 	.= 	", col_".$capteurs[$i]['column_oko']."=".$this->cvtDec( $colCsv[$i] );
					}
					
					$query .= ";";
					//execution de la requette representant l'ensemble d'un ligne du csv
					$this->log->debug("Class ".__CLASS__." | ".__FUNCTION__." | ".$query);
					
					$this->query($query);
					$old_status = $colCsv[$capteurStatus['position_column_csv']];	
					
				}
			}
			$ln++;
		}
		fclose($file);
		
		$this->log->info("Class ".__CLASS__." | ".__FUNCTION__." | SUCCESS - import du CSV dans la BDD - ".$ln." lignes en ".$t->getTime()." sec ");
		
		return true;

	}
	//function de convertion du format decimal de l'import au format bdd
	private function cvtDec($n){
		return str_replace(CSV_DECIMAL,BDD_DECIMAL,$n);
	}
	
	// Fonction lancant les requettes de synthèse du jour, elle ne s'active que si nous sommes dans le traitement de minuit. Elle fera la synthese
	// des jours precedents.
	
	public function makeSyntheseByDay($trigger = 'cron',$dayChossen = null) {
		
		if ($this->newDay() && $trigger == 'cron'){
			//Il est minuit nous lançons la synthèse, et prenons la date d'hier
			$day = date('Y-m-d' ,mktime(0, 0, 0, date("m")  , date("d")-1, date("Y")) );
			
		}else if($trigger == 'onDemande'){
		
			//on ne fait rien si la date choisie est la date du jour
			if ($dayChossen == date('Y-m-d' ,mktime(0, 0, 0, date("m")  , date("d"), date("Y")) )){
				return false;
			}
			
			//si c'est une demande manuelle, nous prenons la date choisie
			$day = $dayChossen;	
			if(!$this->deleteSyntheseDay($day)) return false;
			
		}else{
			//si cron, mais pas new day, ou si pas ondemande, nous ne faisons rien
			return;
		}
		
		return $this->insertSyntheseDay($day);
	}
	
	private function deleteSyntheseDay($day){
		$q = "DELETE FROM oko_resume_day where jour = '".$day."'";
		$this->log->debug("Class ".__CLASS__." | ".__FUNCTION__." | ".$q);
		
		return $this->query($q);
	}
	
	private function insertSyntheseDay($day){
		
		$query 	= "INSERT INTO oko_resume_day ( jour, tc_ext_max, tc_ext_min, conso_kg, dju, nb_cycle ) VALUE ";
		
		$rendu 	= new rendu();
		$max 	= $rendu->getTcMaxByDay($day);
		$min	= $rendu->getTcMinByDay($day);
		$conso	= $rendu->getConsoByday($day);
		$dju	= $rendu->getDju($max->tcExtMax,$min->tcExtMin);
		$cycle	= $rendu->getNbCycleByDay($day);
		
		$consoPellet 	= ($conso->consoPellet==null)?0:$conso->consoPellet;
		$nbCycle		= ($cycle->nbCycle==null)?0:$cycle->nbCycle;
		
		$query .= "('".$day."', ".$max->tcExtMax.",".$min->tcExtMin.", ".$consoPellet.", ".$dju.", ".$nbCycle." );";
				
		$this->log->debug("Class ".__CLASS__." | ".__FUNCTION__." | ".$query);
		
		$n = $this->query($query);
		
		if (!$n){
			$this->log->error("Class ".__CLASS__." | ".__FUNCTION__." | creation synthèse du ".$day." impossible");
			return false;
		}else{
			$this->log->info("Class ".__CLASS__." | ".__FUNCTION__." | SUCCESS | creation synthèse du ".$day);
			return true;
		}
	}
	

	private function curlConnect(){
		
    	
    	$q ="select login_boiler as login, pass_boiler as pass from oko_user where user='admin';";
    	$result = $this->query($q);
    	$boiler = $result->fetch_object();
    	
    	
    	$code = false;
	    $curl = curl_init();
	    
	    curl_setopt_array($curl, array(
	    		   CURLOPT_VERBOSE => false,
	    		   CURLOPT_RETURNTRANSFER => true,
	    		   CURLOPT_URL => $this->_loginUrl,
	    		   CURLOPT_USERAGENT => 'Okovision Agent',
	    		   CURLOPT_POST => 1,
	    		   CURLOPT_COOKIEJAR => $this->_cookies,
	    		   CURLOPT_POSTFIELDS => 
	        		   http_build_query( array(
	        		        'username' => $boiler->login,
	        		        'password' => base64_decode($boiler->pass),
	        		        'language' => 'en',
	        		        'submit'   => 'Login'
	        		    ))
	    		));
	    // Send the request & save response to $resp
	    $resp = curl_exec($curl);
	    
	    $info = curl_getinfo($curl);
	    //var_dump($info);exit;
	    if($info['http_code'] == '303'){
	        $code = true;
	       
	    }else{
	        $this->log->info("Class ".__CLASS__." | ".__FUNCTION__." | Open Session impossible in".CHAUDIERE);
	        $this->_connected = false;
	    }
	    curl_close($curl);
	    
	}

	private function curlGet(){
		$code = false;
	    $curl = curl_init();
	    
	    curl_setopt_array($curl, array(
	           CURLOPT_VERBOSE => false,
			   CURLOPT_RETURNTRANSFER => true,
			   CURLOPT_URL => $this->_loginUrl.'?action=get&attr=1',
			   CURLOPT_POST => 1,
			   CURLOPT_HTTPHEADER => array(
			        'Accept: application/json',
	                'Content-Type: application/x-www-form-urlencoded; charset=UTF-8',
	                'Accept-Language: fr'),
			   CURLOPT_COOKIEFILE => $this->_cookies,
			   CURLOPT_POSTFIELDS => $this->_formdata
			   
			));
	    
	    $resp = curl_exec($curl);
	    
	    if(!curl_errno($curl)){
	        
	        $info = curl_getinfo($curl);
	        //var_dump($info);exit;
	        
	        if($info['http_code'] == '200'){
	            $this->_responseBoiler = $resp;
	            $this->log->debug("Class ".__CLASS__." | ".__FUNCTION__." | ". $resp);
	        	$code = true;
	        }
	    }
	    
	    curl_close($curl);
	    //print_r($resp);exit;
	    return $code;
	}
	
	private function sendRequest(){
		
		if(!$this->curlGet()){
	    	
			$this->curlConnect(); 
			$this->curlGet();
		}
	}
	
	
	public function applyConfiguration($data = array()){
		$this->_formdata = json_encode($data);
		
		if(!$this->curlSet()){
	    	
			$this->curlConnect(); 
			$this->curlSet();
		}
		
	}
	
	private function curlSet(){
		$code = false;
	    $curl = curl_init();
	    
	    curl_setopt_array($curl, array(
	           CURLOPT_VERBOSE => false,
			   CURLOPT_RETURNTRANSFER => true,
			   CURLOPT_URL => $this->_loginUrl.'?action=set',
			   CURLOPT_POST => 1,
			   CURLOPT_HTTPHEADER => array(
			        'Accept: application/json',
	                'Content-Type: application/x-www-form-urlencoded; charset=UTF-8',
	                'Accept-Language: fr'),
			   CURLOPT_COOKIEFILE => $this->_cookies,
			   CURLOPT_POSTFIELDS => $this->_formdata
			   
			));
	    
	    $resp = curl_exec($curl);
	    
	    if(!curl_errno($curl)){
	        
	        $info = curl_getinfo($curl);
	        //var_dump($info);exit;
	        
	        if($info['http_code'] == '200'){
	            $this->_responseBoiler = $resp;
	            $this->log->debug("Class ".__CLASS__." | ".__FUNCTION__." | ". $resp);
	        	$code = true;
	        }
	    }
	    
	    curl_close($curl);
	    //print_r($resp);exit;
	    return $code;
	}
	
	
	
	public function requestBoilerInfo($data = array()){
		
		$this->setFormData($data);
		$this->_responseBoiler = '';
		$this->sendRequest();
		
	}
	
	private function setFormData($a){
		$d = '';
		
	
		foreach($a as $key => $capteur){
			//var_dump($capteur);
			if(!is_array($capteur)){
				$d.=',"'.$capteur.'"';
			}else{
				$d.=',"'.$key.'"';
			}
			
		}
		
		$this->_formdata = '["CAPPL:LOCAL.L_fernwartung_datum_zeit_sek"'.$d.']';
		
	}
	
	
	public function getResponseBoiler(){
		return $this->_responseBoiler;
	}
	
	public function isConnected(){
		return $this->_connected;
	}
	
	public function boilerDisconnect(){
		return @unlink($this->_cookies);
	}
	
	
}

?>