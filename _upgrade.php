<?php

ini_set('max_execution_time', 600);


$this->log->info("UPGRADE | $version | begin");
$t = new timeExec();

$configFile = file_get_contents('config.php');
$configFile = str_replace("DEFINE('BDD_DECIMAL','.');","//UNIQUE TOKEN ID\nDEFINE('TOKEN','###_TOKEN_###');\n//NEWPARAMUPDATE",$configFile);

$token = sha1(rand());
$configFile = str_replace("###_TOKEN_###",$token,$configFile);

file_put_contents('config.php',$configFile);



$this->log->info("UPGRADE | $version | end :".$t->getTime());
?>