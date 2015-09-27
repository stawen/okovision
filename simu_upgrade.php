<?php
include_once 'config.php';

class simu_upgrade extends connectDb{
    
    public function __construct() {
		parent::__construct();
		require('_upgrade.php');
	}
	
	public function __destruct() {
		parent::__destruct();
	}
}

new simu_upgrade();
    
?>
