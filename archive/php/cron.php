<?php
/*
* Projet : Okovision - Supervision chaudiere OeKofen
* Auteur : Stawen Dronek
* Utilisation commerciale interdite sans mon accord
*/

include_once __DIR__.'/config.php';

$oko = new okofen();
$log = new logger();
//on telecharge le csv depuis la chaudiere
if (GET_CHAUDIERE_DATA_BY_IP) {
    $files = $oko->getAvailableBoilerDataFiles();
    foreach ($files as $fileToDownload) {
        $date = $oko->getDateFromFilename($fileToDownload);

        if (!$oko->isDayComplete($date)) {
            $log->info("Cron | {$fileToDownload} --> need to download again");

            $oko->getChaudiereData('http://'.CHAUDIERE.URL.'/'.$fileToDownload);
            $oko->csv2bdd();

            // Force the synthese in case it has been built already
            $oko->makeSyntheseByDay($date, true);
        } else {
            $log->info("Cron | {$fileToDownload} --> Day is complete - building synthese if required");

            // The synthese will be rebuilt only if needed
            $oko->makeSyntheseByDay($date, false);
        }
    }
} else {
    // on lance le traitement pour la veille seulement :
    $day = date('Y-m-d', mktime(0, 0, 0, date('m'), date('d') - 1, date('Y')));
    $oko->makeSyntheseByDay($day, false);
}

  echo 'done';
