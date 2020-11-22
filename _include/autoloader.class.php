<?php
/**
 * Class Autoloader.
 */
class autoloader
{
    /**
     * Enregistre notre autoloader.
     */
    public static function register()
    {
        spl_autoload_register([__CLASS__, 'autoload']);
    }

    /**
     * Inclue le fichier correspondant à notre classe.
     *
     * @param $class string Le nom de la classe à charger
     */
    public static function autoload($class)
    {
        $logException = ['LogFileDoesNotExistExeception', 'LogFileOpenErrorException', 'LogFileNotOpenException',
            'LogFileAlreadyExistsException', 'FileCreationErrorException', 'NotAStringException',
            'NotAIntegerException', 'InvalidMessageTypeException', ];

        if (in_array($class, $logException)) {
            require __DIR__.'/exceptions.logger.class.php';
        } else {
            require __DIR__.'/'.$class.'.class.php';
        }
    }
}
