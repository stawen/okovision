<?php
include_once '/volume1/web/okovision/_include/exceptions.logger.class.php';

/**
 * Logger class.
 * Usefull to log notices, warnings, errors or fatal errors into a logfile.
 * @author gehaxelt
 * @version 1.1
 */
class logger {
	
	private $logfilehandle=NULL;
	
	const NOTICE  ='INFO   ';
	const WARNING ='WARNING';
	const ERROR   ='ERROR  ';
	const FATAL   ='FATAL  ';
	const DEBUG	  ='DEBUG  '; 
	
	/**
	 * Contructor of Logger.
	 * Opens the new logfile
	 * @param string $logfile is the path to a logfile
	 */
	public function __construct() {
		if($this->logfilehandle==NULL)
			$this->openLogFile(LOGFILE);
	}
	/**
	 * Destructor of Logger
	 */
	public function __destruct() {
		$this->closeLogFile();
	}
	/**
	 * Logs the message into the logfile.
	 * @param string $message message to write into the logfile
	 * @param int $messageType (optional) urgency of the messagee. Possible constants are: notice, warning, error, fatal. Default value: warning
	 * @throws LogFileNotOpenException
	 * @throws NotAStringException
	 * @throws NotAIntegerException
	 * @throws InvalidMessageTypeException
	 */
	public function log($message,$messageType=Logger::WARNING) {
		if($this->logfilehandle==NULL)
			throw new LogFileNotOpenException('Logfile is not opened.');
		
		if(!is_string($message))
			throw new NotAStringException('$message is not a string');
		
		if($messageType != Logger::NOTICE && $messageType != Logger::WARNING && $messageType != Logger::ERROR && $messageType != Logger::FATAL && $messageType != Logger::DEBUG)
			throw new InvalidMessageTypeException('Wrong $messagetype given');
		
		$this->writeToLogFile($this->getTime()." | ".$messageType." | ".$message);
	}
	
	/**
	 * Writes content to the logfile
	 * @param string $message
	 */
	private function writeToLogFile($message) {
		flock($this->logfilehandle,LOCK_EX);
		fwrite($this->logfilehandle,$message."\n");
		flock($this->logfilehandle,LOCK_UN);
	}
	
	/**
	 * Returns the current timestamp in dd.mm.YYYY - HH:MM:SS format
	 * @return string with the current date
	 */
	private function getTime() {
		return date("d.m.Y | H:i:s");
	}
	
	/**
	 * Closes the current logfile.
	 */
	public function closeLogFile() {
		if($this->logfilehandle!=NULL) {
			fclose($this->logfilehandle);
			$this->logfilehandle=NULL;
		}
	}
	
	/**
	 * Opens a given logfile and closes the old one before, if another logfile was opened before.
	 * @param string $logfile is a path to a logfile
	 * @throws LogFileOpenErrorException
	 */
	public function openLogFile($logfile) {
		
		$this->closeLogFile(); //close old logfile if opened;
		
		$this->logfilehandle=@fopen($logfile,"a");
		
		if(!$this->logfilehandle) 
			throw new LogFileOpenErrorException('Could not open Logfile in append-mode');
	} 
	
	/**
	 * Convenience function to wrap logger->log($message,$messagetype);
	 * @param string $message
	 */
	public function info($message) {
		$this->log($message,Logger::NOTICE);
	}
	
	/**
	 * Convenience function to wrap logger->log($message,$messagetype);
	 * @param string $message
	 */
	public function warn($message) {
		$this->log($message,Logger::WARNING);
	}
	
	/**
	 * Convenience function to wrap logger->log($message,$messagetype);
	 * @param string $message
	 */
	public function error($message) {
		$this->log($message,Logger::ERROR);
	}
	
	/**
	 * Convenience function to wrap logger->log($message,$messagetype);
	 * @param string $message
	 */
	public function fatal($message) {
		$this->log($message,Logger::FATAL);
	}
	
	/**
	 * debug
	 * @param string $message
	 */
	public function debug($message) {
		if(DEBUG){
			$this->log($message,Logger::DEBUG);
			if (VIEW_DEBUG) print_r ('<pre>'.$message.'</pre>');
		}
	}
}
?>