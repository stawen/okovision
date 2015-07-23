<?php
/*****************************************************
* Projet : Okovision - Supervision chaudiere OeKofen
* Auteur : Stawen Dronek
* Utilisation commerciale interdite sans mon accord
******************************************************/

include_once 'config.php';
include_once '_include/connectDb.class.php';
include_once '_include/okofen.php'; 
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
	        $import = $oko->csv2bdd();
	    }else{
	        $r['response'] = false;
	    }
	    if (!$import) $r['response'] = false;
	    
	    $this->sendResponse($r);
	    
	}
	
	public function uploadMatrice($s,$f){
		$upload_handler = new UploadHandler();

		if(isset($s['actionFile'])){
			
			if($s['actionFile'] == 'matrice'){
				$matrice = 'matrice.csv';
				$rep = $upload_handler->getOption()['upload_dir'];
				
				if(file_exists ( $rep.$matrice )){
					unlink($rep.$matrice);
				}
				
				rename($rep.$f['files']['name'][0], $rep.$matrice);
			}
		}
	}
	
	public function getHeaderFromOkoCsv(){
		$r = array();
	    $r['response'] = true;
	    
	    $lock = array("Datum","Zeit","AT [°C]","PE1 Einschublaufzeit[zs]","PE1 Pausenzeit[zs]","PE1 Status");
	    
	    
	    $this->sendResponse($r);
	}

}

?>