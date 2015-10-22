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
	    $result = $this->query("select id, name, position_column_csv, column_oko, original_name, type from oko_capteur;");
	    while($row = $result->fetch_assoc()){
            $rows[] = $row;
        }
       
        return $rows;
        
	}
	
	public function get($id){
	    $capteur = array();
	    if ($id <> null){
	        $result = $this->query("select id, name, position_column_csv, column_oko, original_name, type from oko_capteur where id= ".$id);
	        $capteur = $result->fetch_assoc();
        }
        
        return $capteur;
        
	}
	
	public function getForImportCsv(){
		$result = $this->query("select id, name, position_column_csv, column_oko, original_name, type from oko_capteur and position_column_csv <> -1;");
	    while($row = $result->fetch_assoc()){
            $r[$row['position_column_csv']] = $row;
        }
        
        return $r;
	}
	
	public function getMatrix(){
		$result = $this->query("select id, name, position_column_csv, column_oko, original_name, type from oko_capteur where column_oko <> 99 order by position_column_csv asc;");
	    while($row = $result->fetch_object()){
            $r[$row->original_name] = $row;
        }
        
        return $r;
	}
	
	public function getByType($type = ''){
		if ($type <> '' ){
			$result = $this->query("select id, name, position_column_csv, column_oko, original_name, type from oko_capteur where type = '".$type."';");
			$capteur =  $result->fetch_assoc();
			
			return $capteur;
		}
		
	}
	
	public function getLastColumnOko(){
		$result = $this->query("select max(column_oko) as num from oko_capteur where column_oko <> 99;");
	    $r = $result->fetch_object();
	    $this->log->debug("Class ".__CLASS__." | ".__FUNCTION__." | Update oko_capteur | ".$r->num);	
	    return $r->num;
	}
	
	
	
}

?>