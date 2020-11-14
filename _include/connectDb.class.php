<?php
/*
* Projet : Okovision - Supervision chaudiere OeKofen
* Auteur : Stawen Dronek
* Utilisation commerciale interdite sans mon accord
*/

class connectDb
{
    protected $log;

    private $db;
    private $_ip = BDD_IP;
    private $_user = BDD_USER;
    private $_pass = BDD_PASS;
    private $_schema = BDD_SCHEMA;

    private static $_instance; //The single instance

    public function __construct()
    {
        $this->log = new logger();
    }

    // Destructor
    public function __destruct()
    {
        //$this->disconnect();
    }

    // Magic method clone is empty to prevent duplication of connection
    private function __clone()
    {
    }

    // Get mysqli connection
    protected function getConnection()
    {
        if (null == $this->db) {
            $this->connect();
        }

        return $this->db;
    }

    protected function realEscapeString($s)
    {
        $con = self::getInstance()->getConnection();

        return $con->real_escape_string($s);
    }

    protected function query($q)
    {
        $con = self::getInstance()->getConnection();

        return $con->query($q);
    }

    protected function multi_query($q)
    {
        $con = self::getInstance()->getConnection();

        return $con->multi_query($q);
    }

    protected function flush_multi_queries()
    {
        $con = self::getInstance()->getConnection();

        return $con->next_result() && $con->more_results();
    }

    private static function getInstance()
    {
        if (!self::$_instance) { // If no instance then make one
            self::$_instance = new self();
        }

        return self::$_instance;
    }

    private function connect()
    {
        $this->db = new mysqli($this->_ip, $this->_user, $this->_pass, $this->_schema);

        if ($this->db->connect_errno) {
            $this->log->error('GLOBAL | Connection MySQL impossible : '.$this->db->connect_error);
            exit(22);
        }

        if (!$this->db->set_charset('utf8')) {
            $this->log->error('GLOBAL | Erreur lors du chargement du jeu de caractères utf8 :'.$this->db->error);
        }

        $this->query("SET time_zone='+00:00'");
        $this->query("SET @@SESSION.SQL_MODE = REPLACE(@@SQL_MODE, 'ONLY_FULL_GROUP_BY,', '')");
    }

    private function disconnect()
    {
        $this->db->close();
    }
}
