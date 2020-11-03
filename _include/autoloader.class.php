<?php
/**
 * Class Autoloader
 */
class autoloader{

    /**
     * Enregistre notre autoloader
     */
    static function register(){
        spl_autoload_register(array(__CLASS__, 'autoload'));
    }

    /**
     * Inclue le fichier correspondant à notre classe
     * @param $class string Le nom de la classe à charger
     */
    static function autoload($class){
		$logException = array("LogFileDoesNotExistExeception","LogFileOpenErrorException","LogFileNotOpenException",
						"LogFileAlreadyExistsException","FileCreationErrorException","NotAStringException",
						"NotAIntegerException","InvalidMessageTypeException");
						
		if (in_array($class,$logException)){
			require __DIR__ . '/exceptions.logger.class.php';
		}else{
			require __DIR__ . '/' . $class . '.class.php';
		}
    }

}



