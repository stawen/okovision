<?php
/*****************************************************
* Projet : Okovision - Supervision chaudiere OeKofen
* Auteur : Stawen Dronek
* Utilisation commerciale interdite sans mon accord
******************************************************/

class capteur extends connectDb{
    
    public function __construct() {
		parent::__construct();
	}
	
	public function __destruct() {
		parent::__destruct();
	}
	
	public function getAll(){
	    $result = $this->db->query("select id, name, position_column_csv, original_name, type from oko_capteur;");
	    while($row = $result->fetch_assoc()){
            $rows[] = $row;
        }
        //$result->free();
        return $rows;
        
	}
	
	public function get($id){
	    $capteur = array();
	    if ($id <> null){
	        $result = $this->db->query("select id, name, position_column_csv, original_name, type from oko_capteur where id= ".$id);
	        $capteur = $result->fetch_assoc();
        }
        //$result->free();
        return $capteur;
        
	}
	
	public function getForImportCsv(){
		$result = $this->db->query("select id, name, position_column_csv, original_name, type from oko_capteur;");
	    while($row = $result->fetch_assoc()){
            $r[$row['position_column_csv']] = $row;
        }
        //$result->free();
        return $r;
	}
	
	public function getByType($type = ''){
		if ($type <> '' ){
			$result = $this->db->query("select id, name, position_column_csv, original_name, type from oko_capteur where type = '".$type."';");
			$capteur =  $result->fetch_assoc();
			
			//$result->free();
			return $capteur;
		}
		
	}
	
	
	
}

?>

