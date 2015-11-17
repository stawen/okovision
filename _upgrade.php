<?php

ini_set('max_execution_time', 600);


$this->log->info("UPGRADE | begin");
$t = new timeExec();


//creation table oko_user
$create_oko_user = "CREATE TABLE IF NOT EXISTS `oko_user` (
  `id` int(3) NOT NULL AUTO_INCREMENT,
  `user` tinytext NOT NULL,
  `pass` tinytext NOT NULL,
  `type` tinytext NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MYISAM AUTO_INCREMENT=0 DEFAULT CHARSET=utf8;";

if($this->query($create_oko_user)){

    $create_user = 'insert into oko_user set user="admin", pass="97f108bdeaad841227830678c7ecec6dc541bab3" and type="admin";';
    if(!$this->query($create_user)){
        $this->log->error("UPGRADE | create user admin impossible");
    }
}else{
    $this->log->error("UPGRADE | create oko_user impossible");
}


$this->log->info("UPGRADE | end :".$t->getTime());
?>