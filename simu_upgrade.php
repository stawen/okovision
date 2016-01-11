<?php
include_once 'config.php';

class simu_upgrade extends connectDb{
    
    public function __construct() {
		parent::__construct();
		$version = "1.7.2";
		require('_upgrade.php');
	}
	
	public function __destruct() {
		parent::__destruct();
	}
}

new simu_upgrade();
echo "Done";    
?>
