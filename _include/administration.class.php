<?php
/*****************************************************
* Projet : Okovision - Supervision chaudiere OeKofen
* Auteur : Stawen Dronek
* Utilisation commerciale interdite sans mon accord
******************************************************/

include_once 'config.php';
include_once '_include/connectDb.class.php';
include_once '_include/okofen.class.php'; 
include_once '_include/UploadHandler.php'; 

class administration extends connectDb{
	
	public function __construct() {
		parent::__construct();
	}
	
	public function __destruct() {
		parent::__destruct();
	}
	
	private function sendResponse($t){
        header("Content-type: text/json");
		echo json_encode($t, JSON_NUMERIC_CHECK);
    }
	
	public function ping($ip){
		
		$waitTimeoutInSeconds = 1; 
		
		$r = array();
		
		if($fp = fsockopen($ip,80,$errCode,$errStr,$waitTimeoutInSeconds)){   
		   // It worked 
		   $r['response'] = true;
		   $r['url'] = 'http://'.$ip.URL;
		  // print_r($r);exit;
		} else {
		   // It didn't work 
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
	    
	    $oko = new okofen();
	    $status = $oko->getChaudiereData('onDemande',$s['url']);
	    
	    if($status){
	        //$import = $oko->csv2bdd();
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
				//si rename ok, alors init de la table capteur
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
		$this->log->debug("CSV First Line | ".$line);
		
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
				
				$q = "INSERT INTO oko_capteur(name,position_column_csv,original_name,type) VALUES('".$name."',".$position.",'".$title."','".$type."');" ;
				
				$this->log->debug("Create oko_capteur | ".$q);
				$query .= $q;
			}
    	}
		//insertion d'une reference au demarrage des cycles de chauffe
		$query .= "INSERT INTO oko_capteur(name,position_column_csv,original_name,type) VALUES('Start Cycle',99,'Start Cycle','startCycle');" ;
		
		
		$result = $this->db->multi_query($query);
		//$this->db->free();
		
	}
	
	public function getHeaderFromOkoCsv(){
		
		$r = array();
	    //$lock = array("Datum","Zeit","AT [°C]","PE1 Einschublaufzeit[zs]","PE1 Pausenzeit[zs]","PE1 Status");
	    $q = "select id, name, original_name, type from oko_capteur order by id";
	    $this->log->debug("Select oko_capteur | ".$q);
	    
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
	    
	    $result->free();
	    
	    $this->sendResponse($r);
	}
	
	public function statusMatrice(){
		$q = "select count(*) from oko_capteur";
	    
	    
	    $result = $this->db->query($q);
	    
	    $r['response'] = false;
	    
	    if($result){
	    	$res = $result->fetch_row();
	    	$this->log->debug("Nb capteur | ".$res[0]);
	    	
	    	if ($res[0] > 1) {
	    		$r['response'] = true;
	    	}
	    }
	    
	    $result->free();
	    $this->sendResponse($r);
	    
	}
	
	public function importcsv(){
		$oko = new okofen();
		$r['response'] = $oko->csv2bdd();
		//$r['response'] = true;
		$this->sendResponse($r);
	}

}

?>