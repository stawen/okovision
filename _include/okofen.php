<?php
include_once 'config.php';
include_once '_include/logger.class.php';
include_once '_include/timeExec.php';

class okofen {
	
	private $log = null;

	public function __construct() {
		$this->log = new Logger();
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
			echo ' ';
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
			$this->log->debug("Minuit");
			return true;
		}else{
			return false;
		}
	}
	
	public function getChaudiereData(){
		if ($this->newDay()){
			$today = date('Ymd' ,mktime(0, 0, 0, date("m")  , date("d")-1, date("Y")) );
		}else{
			$today = date("Ymd"); // 20010310
		}

		$link = PATH.$today.EXTENTION;
		$this->log->info('getChaudiereData | Recuperation du fichier '.$link);
		//on lance le dl
		$result = $this->download($link,CSVFILE);

		if (!$result){
			 throw new Exception('Download error...');
			 $this->log->error('getChaudiereData | Données chaudiere non recupérées');
		}else{
			$this->log->info('getChaudiereData | SUCCESS - données chaudiere récupérées');
		}

	}

	public function csv2bdd(){
		// specify connection info
		$connect = mysql_connect(BDD_IP,BDD_USER,BDD_PASS);
		if (!$connect){
		   $this->log->error('csv2bdd | Connection MySQL impossible : ' . mysql_error());
		}
		
		$t = new timeExec();
		
		$cid = mysql_select_db(BDD_SCHEMA,$connect);

		$file = fopen(CSVFILE, 'r');
		$ln = 0;
		$old_status = "0";
		$start_cycle = 0;
		while (!feof($file))
		{
			$ligne = fgets($file);
			if($ln != 0){
				$d = explode(CSV_SEPARATEUR, $ligne);
				if($d[1]<>''){
					//Detection demarrage d'un cycle
					if( $d[29] == "3" && $d[29] <> $old_status){
						$start_cycle = 1;
					}else{
						$start_cycle = 0;
					}
					//creation de la requette sql
					
					$query = "INSERT IGNORE INTO oko_histo_full VALUES (".
							"STR_TO_DATE('".$d[0]."','%d.%m.%Y'),'". //date
							$d[1]."',". 				// heure
							$this->cvtDec($d[2]).",". 	// T°C exterieur
							$this->cvtDec($d[3]).",". 	// T°C Chaudiere
							$this->cvtDec($d[4]).",". 	// T°C Chaudiere Consigne
							((int)$d[5])*100 .",". 		// Contact Bruleur
							$this->cvtDec($d[6]).",". 	// T°C Départ
							$this->cvtDec($d[7]).",". 	// T°C Départ Consigne
							$this->cvtDec($d[8]).",". 	// T°C Ambiante
							$this->cvtDec($d[9]).",". 	// T°C Ambiante Consigne
							((int)$d[10])*100 .",". 	// Circulateur Chauffage
							$this->cvtDec($d[11]).",". 	// T°C ECS
							$this->cvtDec($d[13]).",". 	// T°C ECS Consigne
							((int)$d[14])*100 .",". 	// Ciruclateur ECS
							$this->cvtDec($d[16]).",". 	// T°C panneau solaire
							$this->cvtDec($d[17]).",". 	// T°C Ballon Bas
							$this->cvtDec($d[18]).",". 	// Pompe Solaire
							$this->cvtDec($d[21]).",". 	// T°C Flamme
							$this->cvtDec($d[22]).",". 	// T°C Flamme Consigne
							$this->cvtDec($d[23]).",". 	// Vis Alimentation temps (ex: 50zs = 5sec)
							$this->cvtDec($d[24]).",". 	// Vis Alimentation Temps pause
							$this->cvtDec($d[25]).",". 	// Ventilation Bruleur
							$this->cvtDec($d[26]).",". 	// Ventilation fumée
							$this->cvtDec($d[27]).",". 	// Dépression
							$this->cvtDec($d[28]).",". 	// Depression Consigne
							$this->cvtDec($d[29]).",". 	// Statut Chaudiere
							((int)$d[30])*100 .",". 	// Moteur alimentation chaudiere
							((int)$d[31])*100 .",". 	// Moteur extraxtion silo
							((int)$d[32])*100 .",". 	// Moteur tremie intermediaire
							((int)$d[33])*100 .",". 	// Moteur ASPIRATION
							((int)$d[34])*100 .",". 	// Moteur Allumage
							$d[35].",". 				// Pompe du circuit primaire
							((int)$d[39])*100 .",".		// Moteur ramonage
							//Enregistrement de 1 si nous commençons un cycle d'allumage
							//Statut 3 = allumage
							$start_cycle.
							")";
				

					$n=mysql_query($query, $connect );
					//$this->log->debug($query);
					$old_status = $d[29];	
				}
			}
			$ln++;
		}
		fclose($file);
		$this->log->info("csv2bdd | SUCCESS - import du CSV dans la BDD - ".$ln." lignes en ".$t->getTime()." sec ");
		
		mysql_close($connect); // closing connection


	}
	//function de convertion du format decimal de l'import au format bdd
	private function cvtDec($n){
		return str_replace(CSV_DECIMAL,BDD_DECIMAL,$n);
	}
	
	// Fonction lancant les requettes de synthèse du jour, elle ne s'active que si nous sommes dans le traitement de minuit. Elle fera la synthese
	// des jours precedents.
	
	public function makeSynteseByDay(){
		
		if ($this->newDay()){
			//Il est minuit nous lançons la synthèse, sinon non
			$yesterday = date('Y-m-d' ,mktime(0, 0, 0, date("m")  , date("d")-1, date("Y")) );
			
			// specify connection info
			$connect = mysql_connect(BDD_IP,BDD_USER,BDD_PASS);
			if (!$connect){
				$this->log->error('makeSynteseByDay | Connection MySQL impossible : ' . mysql_error());
			}
			
			$cid = mysql_select_db(BDD_SCHEMA,$connect);
			
			$query = "INSERT INTO oko_resume_day "
					."SELECT "
						." jour, "
						."MAX(Tc_exterieur) AS Tc_max, "
						."MIN(Tc_exterieur) AS Tc_min, "
						.FUNC_CONSO_PELLET." AS conso_kg, "
						.FUNC_DJU." As dju, "
						."sum(Debut_cycle) as nb_cycle "
						."FROM oko_histo_full where jour = '".$yesterday."'";
						
			$this->log->debug("makeSynteseByDay | ".$query);
			
			$n=mysql_query($query, $connect );
			if (!$n){
				$this->log->error("makeSynteseByDay | creation synthèse du ".$yesterday." impossible");
			}else{
				$this->log->info("makeSynteseByDay | SUCCESS | creation synthèse du ".$yesterday);
			}
			mysql_close($connect); // closing connection
			
		}
	
	}
}
?>