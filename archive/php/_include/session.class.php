<?php

class session extends connectDb
{
    private $lang = 'en';
    private $dico;
    private static $_instance;

    public function __construct()
    {
        session_start();

        if (!$this->exist('sid')) {
            $t = substr(md5(uniqid(session_id(), true)), 0, 8);
            $this->setVar('sid', $t);
        }

        $cf = json_decode(file_get_contents('config.json'), true);

        $this->setLang(
            // by default English
            isset($cf['lang']) ? $cf['lang'] : 'en'
        );

        $this->dico = $this->getDictionnary($this->getLang());
    }

    public function __destruct()
    {
        //session_destroy();
        //if (DEBUG) session_destroy();
    }

    // Magic method clone is empty to prevent duplication of connection
    private function __clone()
    {
    }

    public static function getInstance()
    {
        if (!self::$_instance) { // If no instance then make one
            self::$_instance = new self();
        }

        return self::$_instance;
    }

    public function getLabel($label)
    {
        return $this->dico[$label];
    }

    public function getLang()
    {
        return $this->lang;
    }

    public function setVar($key, $value)
    {
        $_SESSION[$key] = $value;
    }

    public function exist($key)
    {
        return isset($_SESSION[$key]);
    }

    public function getVar($key)
    {
        return isset($_SESSION[$key]) ? $_SESSION[$key] : null;
    }

    public function deleteVar($key)
    {
        unset($_SESSION[$key]);
    }

    public function getSensorName($sensor)
    {
        return $this->dico[$sensor];
    }

    private function getDictionnary($lg)
    {
        $file = '_langs/'.$lg.'.text.json';
        if (file_exists($file)) {
            return (array) json_decode(file_get_contents($file));
        }
    }

    private function setLang($lg)
    {
        $this->lang = $lg;
    }
}
