<?php

include_once 'config.php';

class simu_upgrade extends connectDb
{
    public function __construct()
    {
        parent::__construct();
        $version = administration::getCurrentVersion();
        require '_upgrade.php';
    }

    public function __destruct()
    {
        parent::__destruct();
    }
}

new simu_upgrade();
echo 'Done';
