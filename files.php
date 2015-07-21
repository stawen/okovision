<?php
/*
 * jQuery File Upload Plugin PHP Example 5.14
 * https://github.com/blueimp/jQuery-File-Upload
 *
 * Copyright 2010, Sebastian Tschan
 * https://blueimp.net
 * 
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/MIT
 */

error_reporting(E_ALL | E_STRICT);
require('_include/UploadHandler.php');


//print_r($_POST);
//print_r("-----------------------------------------------");
$upload_handler = new UploadHandler();

if(isset($_POST['action'])){
	if($_POST['action'] == 'matrice'){
		print_r($_POST['fichier']);
		print_r($_FILES['files']['name'][0]);
	//rename("/tmp/tmp_file.txt", "/home/user/login/docs/my_file.txt");
	}
}
 
print_r("-----------------------------------------------");
print_r ($upload_handler->options); exit;
?>