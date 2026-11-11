<?php
/*
* Projet : Okovision - Supervision chaudiere OeKofen
* Auteur : Stawen Dronek
* Utilisation commerciale interdite sans mon accord
*/

class oko2ftp
{
    private $log;

    public function __construct()
    {
        $this->log = new Logger();
    }

    public function send2web()
    {
        $this->log->info('Send2Web | envoi du fichier vers '.FTP_SERVEUR);

        try {
            $conn_id = ftp_connect(FTP_SERVEUR);
        } catch (Exception $e) {
            $this->log->error('Send2Web | connection impossible sur le ftp :'.FTP_SERVEUR);
        }

        if (ftp_login($conn_id, FTP_USER, FTP_PASS)) {
            //si connexion ok, nous allons dans le repertoire de depo

            try {
                ftp_chdir($conn_id, REP_DEPOT);

                if (!ftp_put($conn_id, 'import.csv', CSVFILE, FTP_BINARY)) {
                    $this->log->error('Send2Web | echec upload du fichier '.FTP_SERVEUR);
                }
            } catch (Exception $e) {
                $this->log->error('Send2Web | Exception : '.$e);
            }
        } else {
            $this->log->error('Send2Web | Login/password incorrect pour ftp '.FTP_SERVEUR);
        }

        ftp_close($conn_id);
        $this->log->info('Send2Web | envoi terminé');
    }
}
