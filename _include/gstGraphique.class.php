<?php

class gstGraphique extends connectDb{
    
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
    
    public function getGraphe(){
        $q = "select id, name, position from oko_graphe order by position";
	    
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
    
    public function getLastGraphePosition(){
    	$q = "select max(position) as lastPosition from oko_graphe";
	    $this->log->debug("Class gestGraphique | getLastGraphePosition | ".$q ); //.$r['data']['lastPosition']
	    
	    $result = $this->db->query($q);
	    
	    $r['response'] = false;
	    
	    if($result){
	    	$r['response'] = true;
	    	$r['data'] = $result->fetch_object();
	    	
	    
	    }
	    
	    $this->sendResponse($r);
    }
    
    public function grapheNameExist($name){
    	$q = "select count(*) from oko_graphe where name='".$name."'";
	    $result = $this->db->query($q);
	    
	    
	    $r['exist'] = false;
	    if($result){
	    	
	    	$res = $result->fetch_row();
	    //	$this->log->debug("Nb capteur | ".$res[0]);
	    	if ($res[0] > 0) {
	    		$r['exist'] = true;
	    	}
	    }
	    
	    //$result->free();
	    $this->sendResponse($r);
    }
    
    public function addGraphe($s){
    	$name = $this->db->real_escape_string($s['name']);
    	
    	$q = "INSERT INTO oko_graphe (name, position) value ('".$name."','".$s['position']."')";
    	$this->log->debug("Class gestGraphique | addGraphe | ".$q);
    	$r = array();
    	
    	$r['response'] = false;
    	 
    	if($this->db->query($q)){
    	 	$r['response'] = true;	
    	}
    	
    	$this->sendResponse($r);
    	
    }
    
    public function updateGraphe($s){
    	$name = $this->db->real_escape_string($s['name']);
    	$q = "UPDATE oko_graphe SET name='".$name."' where id=".$s['id'] ;
    	
    	$r['response'] = false;
    	 
    	if($this->db->query($q)){
    	 	$r['response'] = true;	
    	}
    	
    	$this->sendResponse($r);
    }
    
    public function deleteGraphe($s){
    	$q = "DELETE from oko_graphe where id=".$s['id'] ;
    	$this->log->debug("Class gestGraphique | deleteGraphe | ".$q);
    	
    	 
    	if($this->db->query($q)){
    	 	$r['response'] = true;
    	 	
    	 	$q = "DELETE from oko_asso_capteur_graphe where oko_graphe_id=".$s['id'] ;
	    	$this->log->debug("Class gestGraphique | deleteGraphe | ".$q);
	    	 
	    	if($this->db->query($q)){
	    	 	$r['response'] = true;	
	    	}else{
	    		$r['response'] = false;
	    	}
    	}else{
    		$r['response'] = false;
    	}
    	
    	
    	
    	
    	$this->sendResponse($r);
    }
    
    public function getCapteurs(){
    	$q = "select id, name from oko_capteur order by id";
	    $this->log->debug("Class gestGraphique | getCapteurs | ".$q);
	    
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
    
    public function grapheAssoCapteurExist($graphe,$capteur){
    	
    	$q = "select count(*) from oko_asso_capteur_graphe where oko_graphe_id=".$graphe." and oko_capteur_id=".$capteur;
	    $result = $this->db->query($q);
	    
	    
	    $r['exist'] = false;
	    if($result){
	    	$res = $result->fetch_row();
	    //	$this->log->debug("Nb capteur | ".$res[0]);
	    	if ($res[0] > 0) {
	    		$r['exist'] = true;
	    	}
	    }
	    
	    //$result->free();
	    $this->sendResponse($r);
    	
    }
    
    public function addGrapheAsso($s){
    	
    	//$name = $this->db->real_escape_string($s['name']);
    	
    	$q = "INSERT INTO oko_asso_capteur_graphe (oko_graphe_id, oko_capteur_id, position, correction_effect) value (".$s['id_graphe'].",".$s['id_capteur'].",".$s['position'].",".$s['coeff'].")";
    	$this->log->debug("Class gestGraphique | addGrapheAsso | ".$q);
    	$r = array();
    	
    	$r['response'] = false;
    	 
    	if($this->db->query($q)){
    	 	$r['response'] = true;	
    	}
    	
    	$this->sendResponse($r);
    	
    }
    
    
    public function getGrapheAsso($grapheId){
    	$q ="SELECT capteur.id, capteur.name, asso.correction_effect as coeff from oko_asso_capteur_graphe as asso ".
    		"LEFT JOIN oko_capteur as capteur ON asso.oko_capteur_id = capteur.id "
    		."WHERE asso.oko_graphe_id=".$grapheId;
    		
	    $this->log->debug("Class gestGraphique | getGrapheAsso | ".$q);
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
    
    public function updateGrapheAsso($s){
    	
    	$q = "UPDATE oko_asso_capteur_graphe SET correction_effect=".$s['coeff']." where oko_graphe_id=".$s['id_graphe']." AND "
    		."oko_capteur_id=".$s['id_capteur'];
    	$this->log->debug("Class gestGraphique | updateGrapheAsso | ".$q);
    	
    	$r['response'] = false;
    	 
    	if($this->db->query($q)){
    	 	$r['response'] = true;	
    	}
    	
    	$this->sendResponse($r);
    }
    
    public function deleteAssoGraphe($s){
    	$q = "DELETE FROM oko_asso_capteur_graphe WHERE oko_graphe_id=".$s['id_graphe']." AND "
    		."oko_capteur_id=".$s['id_capteur'];
    		
    	$this->log->debug("Class gestGraphique | deleteAssoGraphe | ".$q);
    	
    	$r['response'] = false;
    	 
    	if($this->db->query($q)){
    	 	$r['response'] = true;	
    	}
    	
    	$this->sendResponse($r);
    }
    
    
}

?>