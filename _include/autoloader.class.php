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
        //print_r('_include/' . $class . '.class.php');exit;
        require '_include/' . $class . '.class.php';
    }

}



