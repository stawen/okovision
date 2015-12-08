<?php

/*****************************************************
* Projet : Okovision - Supervision chaudiere OeKofen
* Auteur : Stawen Dronek
* Utilisation commerciale interdite sans mon accord
******************************************************/

class realTime extends connectDb{
	
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
	
	
	public function getOkoValue($data = array()){
		
		$o = new okofen();
        $o->requestBoilerInfo( $data );
        
		$r = array();
		//$r = stdObject();
		
		
		$dataBoiler = json_decode($o->getResponseBoiler());
		
		if($o->isConnected()){
			foreach($dataBoiler as $capt){
				
				if($capt->formatTexts != ''){
					
					$shortTxt 	= 'ERROR';
					$value		= 'null';
					$s= array();
					
					
					if($capt->value != '???'){
						$s = explode ("|",$capt->formatTexts);
						$shortTxt 	= $capt->shortText;
						$value		= $s[$capt->value];
					}
					
					$r[$capt->name] = (object) array(
											"value" => $value,
											"unitText" => ''
											);
				}else{
					$r[$capt->name] = (object) array(
											"value" => ($capt->divisor != '')?($capt->value / $capt->divisor):($capt->value),
											"unitText" => ($capt->unitText=='???')?'':$capt->unitText
											);
				}
			}
		}
		return $r;
		
	}
	
	

    public function getIndic(){
    	$json['response'] = false;
    	
    	$r = $this->getOkoValue(array(
									"CAPPL:FA[0].L_mittlere_laufzeit", // temps moyen du bruleur
									"CAPPL:FA[0].L_brennerstarts", // nb demarrage bruleur
									"CAPPL:FA[0].L_brennerlaufzeit_anzeige", //fonct brûleur
									"CAPPL:FA[0].L_anzahl_zuendung", //nb allumage
									"CAPPL:LOCAL.touch[0].version"
                   					) 
				                );
	
		if(!empty($r)){	
			$json['data'] = array (
					'tpsMoyBruleur' 	=> trim($r['CAPPL:FA[0].L_mittlere_laufzeit']->value.' '.$r['CAPPL:FA[0].L_mittlere_laufzeit']->unitText),
					'nbStartBruleur' 	=> trim($r['CAPPL:FA[0].L_brennerstarts']->value.' '.$r['CAPPL:FA[0].L_brennerstarts']->unitText),
					'tpsTotalBruleur' 	=> trim($r['CAPPL:FA[0].L_brennerlaufzeit_anzeige']->value.' '.$r['CAPPL:FA[0].L_brennerlaufzeit_anzeige']->unitText),
					'nbstart'		 	=> trim($r['CAPPL:FA[0].L_anzahl_zuendung']->value.' '.$r['CAPPL:FA[0].L_anzahl_zuendung']->unitText),
					'version'		 	=> trim($r['CAPPL:LOCAL.touch[0].version']->value.' '.$r['CAPPL:LOCAL.touch[0].version']->unitText),
			);
			$json['response'] = true;	
		}
		
		//var_dump($resp);		                
		$this->sendResponse(json_encode($json));
    }
    
    
}

?>