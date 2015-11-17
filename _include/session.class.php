<?php

class session extends connectDb {
    //protected static $lang = 'fr';
    private $lang = 'fr';
    private $dico = null;
    private static $_instance;
    
    public function __construct() {
        
        
        //self::$lang = 'fr';
        //$this->lang = 'fr';
        /*
        if(!$this->exist('LANG')){
            $this->setVar('LANG',$this->getDictionnary($this->lang));
        }
        */
        //print_r( self::exist('sid')); exit;
        
        session_start();
        
        if(!$this->exist('sid')){
            $t = substr(md5(uniqid(session_id(), true)), 0,8);
            $this->setVar('sid', $t);
        }
        
        $this->dico = $this->getDictionnary($this->getLang());
        
    }
    
    public function __destruct(){
        //session_destroy();
        if (DEBUG) session_destroy();
    }
    
    	// Magic method clone is empty to prevent duplication of connection
	private function __clone() { }
	
	public static function getInstance() {
		if(!self::$_instance) { // If no instance then make one
			self::$_instance = new self();
		}
		return self::$_instance;
	}
	
    
    private function getDictionnary($lg){
		$file = '_langs/' . $lg . '.text.ini';
	    if(file_exists($file)){
	        return parse_ini_file($file);
	    }
	    
	}
	
	public function getLabel($label){
	    return $this->dico[$label];
	    
	}
	
	public function getLang(){
	    return $this->lang;
	}
	
	public function setVar($key, $value){
	    $_SESSION[$key] = $value;
	}
	
	public  function exist($key){
	    return isset($_SESSION[$key]);
	}
	
	public function getVar($key){
	    return isset($_SESSION[$key]) ? $_SESSION[$key]:null;
	}
	
	public function deleteVar($key){
		unset($_SESSION[$key]);
	}
	
}

?>