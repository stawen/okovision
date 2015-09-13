<?php
/*****************************************************
* Projet : Okovision - Supervision chaudiere OeKofen
* Auteur : Stawen Dronek
* Utilisation commerciale interdite sans mon accord
******************************************************/

class connectDb {
	protected $db;
	protected $log;
	
	public function __construct() {
		$this->log = new logger();
		
		$this->db = new mysqli(BDD_IP,BDD_USER,BDD_PASS,BDD_SCHEMA);
			
		if ($this->db->connect_errno) {
			    $this->log->info('GLOBAL | Connection MySQL impossible : ' . $this->db->connect_error );
			    exit;
		}
		$this->db->set_charset("utf8");
	}
	/*
	 * *
	 * Destructor
	 */
	public function __destruct() {
		$this->db->close();
	}
	
	
	
}

?>