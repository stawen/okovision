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
    	
    	$r['response'] = false;
    	 
    	if($this->db->query($q)){
    	 	$r['response'] = true;	
    	}
    	
    	$this->sendResponse($r);
    }
    /*
    public function getGrapheAsso($grapheId){
    	$q = "select oko from oko_asso_capteur_graphe where oko_graphe_id=".$grapheId;
	    
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
    }*/
    
    
    
    
}

?>