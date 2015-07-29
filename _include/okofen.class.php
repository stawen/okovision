<?php
/*****************************************************
* Projet : Okovision - Supervision chaudiere OeKofen
* Auteur : Stawen Dronek
* Utilisation commerciale interdite sans mon accord
******************************************************/

class okofen extends connectDb{
	
	
	public function __construct() {
		parent::__construct();
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
			//echo ' ';
			flush();
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
		if ($hour == '00'){
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
		
		$this->log->info('getChaudiereData | Recuperation du fichier '.$link);
		//on lance le dl
		$result = $this->download($link,CSVFILE);

		if (!$result){
			 //throw new Exception('Download error...');
			 $this->log->error('getChaudiereData | Données chaudiere non recupérées');
			 return false;
		}else{
			$this->log->info('getChaudiereData | SUCCESS - données chaudiere récupérées');
			return true;
		}

	}
	/*
	* integration du fichier csv dans okovision
	*/
	public function csv2bdd(){
		
		$t = new timeExec();
		
		$ob_capteur 	= new capteur();
		$capteurs 		= $ob_capteur->getForImportCsv(); //l'index du tableau correspond a la colonne du capteur dans le fichier csv
		$capteurStatus 	= $ob_capteur->getByType('status');
		$startCycle 	= $ob_capteur->getByType('startCycle');
		
		//print_r($capteurStatus);exit;
		//$capteurStatus['position_column_csv'];
		
		
		$file 			= fopen(CSVFILE, 'r');
		$ln 			= 0;
		$old_status  	= 0;
		$start_cycle 	= 0;
		$query 			= "";
		
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
					
					$q 		= 	"";
					$insert	= 	"INSERT IGNORE INTO oko_historique (jour,heure,oko_capteur_id,value) VALUES (".
								"STR_TO_DATE('".$jour."','%d.%m.%Y'),".	// jour
								"'".$heure."',";					// heure
								
					//Detection demarrage d'un cycle //Statut 3 = allumage
					if( $colCsv[$capteurStatus['position_column_csv']] == "3" && $colCsv[$capteurStatus['position_column_csv']] <> $old_status){
						$st = 1;
						//creation de la requette pour le comptage des cycle de la chaudiere
						//Enregistrement de 1 si nous commençons un cycle d'allumage
						$q 	= 	$insert.
								$startCycle['id'].",". 	//capteur_id
						    	$st.");";     		//valeur
						
						//on concatene dans la variable $query pour faire du multiquery
						$this->log->debug($q);
						$query .= $q;
					}
					
					//creation de la requette sql pour les capteurs
					//on commence à la deuxieme colonne de la ligne du csv
					for($i=2;$i<$nbColCsv;$i++){
					     
					   	$q 	= 	$insert.								// heure
								$capteurs[$i]['id'].",". 				//capteur_id
					    		$this->cvtDec( $colCsv[$i] ).");";     //valeur
					
						//on concatene dans la variable $query pour faire du multiquery
						$this->log->debug($q);
						$query .= $q;
					}
					
					$old_status = $colCsv[$capteurStatus['position_column_csv']];	
					
				}
			}
			$ln++;
		}
		fclose($file);
		
		$result = $this->db->multi_query($query);
		//$result->free();
		
		$this->log->info("csv2bdd | SUCCESS - import du CSV dans la BDD - ".$ln." lignes en ".$t->getTime()." sec ");
		
		return true;

	}
	//function de convertion du format decimal de l'import au format bdd
	private function cvtDec($n){
		return str_replace(CSV_DECIMAL,BDD_DECIMAL,$n);
	}
	
	// Fonction lancant les requettes de synthèse du jour, elle ne s'active que si nous sommes dans le traitement de minuit. Elle fera la synthese
	// des jours precedents.
	
	public function makeSynteseByDay($trigger = 'cron',$dayChossen){
		
		if ($this->newDay() || $trigger <> 'onDemande'){
			//Il est minuit nous lançons la synthèse, sinon nous prenons la date du choisie
			if($trigger =='onDemande'){
			    $day = date('Y-m-d' ,mktime(0, 0, 0, date("m")  , date("d")-1, date("Y")) );
			}else{
			    $day = $dayChossen;
			}
			
			$query = "INSERT INTO oko_resume_day "
					."SELECT "
						." jour, "
						."MAX(Tc_exterieur) AS Tc_max, "
						."MIN(Tc_exterieur) AS Tc_min, "
						.FUNC_CONSO_PELLET." AS conso_kg, "
						.FUNC_DJU." As dju, "
						."sum(Debut_cycle) as nb_cycle "
						."FROM oko_histo_full where jour = '".$day."'";
						
			$this->log->info("makeSynteseByDay | ".$query);
			
			//$n=mysql_query($query, $connect );
			$n = $this->db->query($query);
			
			if (!$n){
				$this->log->error("makeSynteseByDay | creation synthèse du ".$day." impossible");
			}else{
				$this->log->info("makeSynteseByDay | SUCCESS | creation synthèse du ".$day);
			}
		
		}
	
	}
}
?>