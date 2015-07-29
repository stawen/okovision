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
    
    
    
    
}

?>