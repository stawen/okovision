<?php

class session {
    
    protected static $lang = 'fr';
    
    public function __construct() {
        
        //session_start();
        self::$lang = 'fr';
        /*
        if(!self::exist('LANG')){
            self::setVar('LANG',self::getDictionnary(self::$lang));
        }
        */
        //print_r( self::exist('sid')); exit;
        /*
        if(!self::exist('sid')){
            $t = substr(md5(uniqid($_COOKIE['PHPSESSID'], true)), 0,8);
            self::setVar('sid', $t);
        }
        */
        
    }
    
    public function __destruct(){
        //session_destroy();
        //if (DEBUG) session_unset();
    }
    
    private function getDictionnary($lg){
		$file = '_langs/' . $lg . '.text.ini';
	    if(file_exists($file)){
	        return parse_ini_file($file);
	    }
	    
	}
	
	public function getLabel($label){
	    //return $_SESSION['LANG'][$label];
	    return self::getDictionnary(self::$lang)[$label];
	}
	
	public function getLang(){
	    return self::$lang;
	}
	
	public function setVar($index, $value){
	    $_SESSION[$index] = $value;
	}
	
	public function exist($index){
	    return isset($_SESSION[$index]);
	}
	
	public function getVar($index){
	    return $_SESSION[$index];
	}
}

?>