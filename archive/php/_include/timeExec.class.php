<?php
/*
* Projet : Okovision - Supervision chaudiere OeKofen
* Auteur : Stawen Dronek
* Utilisation commerciale interdite sans mon accord
*/

class timeExec
{
    private $timestart;

    public function __construct()
    {
        $this->timestart = microtime(true);
    }

    public function getTime()
    {
        return number_format(microtime(true) - $this->timestart, 3);
    }
}
