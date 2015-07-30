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
	    
	    $result = $this->db->query($q);
	    
	    $r['response'] = false;
	    
	    if($result){
	    	$r['response'] = true;
	    	$r['data'] = $result->fetch_object();
	    	
	    	$this->log->debug("gestGraphique | getLastGraphePosition | " ); //.$r['data']['lastPosition']
	    }
	    
	    $this->sendResponse($r);
    }
    
    public function grapheNameExist($name){
    	$q = "select count(*) from oko_graphe where name=".$name;
	    $result = $this->db->query($q);
	    
	    $r['response'] = false;
	    $r['exist'] = false;
	    if($result){
	    	$r['response'] = true;
	    	$res = $result->fetch_row();
	    //	$this->log->debug("Nb capteur | ".$res[0]);
	    	if ($res[0] > 1) {
	    		$r['exist'] = true;
	    	}
	    }
	    
	    //$result->free();
	    $this->sendResponse($r);
    }
    
    public function addGraphe($s){
    	$q = "INSERT INTO oko_graphe (name, position) value ('".$s['name']."','".$s['position']."')";
    	
    	$r['response'] = false;
    	 
    	if($this->db->query($q)){
    	 	$r['response'] = true;	
    	}
    	
    	$this->sendResponse($r);
    	
    }
    
    
    
    
}

?>