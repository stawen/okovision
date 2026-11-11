<?php

//namespace vierbergenlars\SemVer;

class SemVerException extends Exception
{
    protected $version;

    public function __construct($message, $version)
    {
        $this->version = $version;
        parent::__construct($message.' [['.$version.']]');
    }

    public function getVersion()
    {
        return $this->version;
    }
}
