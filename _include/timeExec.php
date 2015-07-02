<?php

class timeExec {

	private $timestart	=	null;
	
	public function __construct() {
		$this->timestart = microtime(true);
	}
	
	public function getTime(){
		return number_format(microtime(true) - $this->timestart, 3);
	}
	
	
	

}

?>