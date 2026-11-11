<?php
/*
* Projet : Okovision - Supervision chaudiere OeKofen
* Auteur : Stawen Dronek
* Utilisation commerciale interdite sans mon accord
*/

class okofen extends connectDb
{
    private $_loginUrl = '';
    private $_cookies = '';
    private $_responseBoiler = '';
    private $_response = '';
    private $_connected = true;

    public function __construct()
    {
        parent::__construct();

        $this->_loginUrl = 'http://'.CHAUDIERE.'/index.cgi';
        $this->_cookies = CONTEXT.'/_tmp/cookies_boiler.txt';
    }

    public function __destruct()
    {
        parent::__destruct();
    }

    // Fonction pour recuperer les fichiers csv present sur la chaudiere
    public function getChaudiereData($url)
    {
        $link = $url;

        $this->log->info('Class '.__CLASS__.' | '.__FUNCTION__.' |  Recuperation du fichier '.$link);
        //on lance le dl
        $result = $this->download($link, CSVFILE);

        if (!$result) {
            //throw new Exception('Download error...');
            $this->log->error('Class '.__CLASS__.' | '.__FUNCTION__.' | Données chaudiere non recupérées');

            return false;
        }
        $this->log->info('Class '.__CLASS__.' | '.__FUNCTION__.' | SUCCESS - données chaudiere récupérées');

        return true;
    }

    /**
     * Look into the DB to check if we have the data for the last minute of the data.
     * If the minute is missing, then we need to download the file again.
     *
     * @param type  $dataFilename
     * @param mixed $dateChoosen
     */
    public function isDayComplete($dateChoosen)
    {
        if (empty($dateChoosen)) {
            return false;
        }
        $sql = "SELECT COUNT(*) FROM oko_historique_full WHERE jour = '{$dateChoosen}' AND heure = '23:59:00'";

        $result = $this->query($sql);

        if ($result) {
            if ($res = $result->fetch_row()) {
                return 1 == $res[0];
            }
        }

        return false;
    }

    /**
     * Converts a filename of the form 'touch_20161016.csv' to the corresponding
     * date - ie : '2016-10-16'.
     *
     * @param type $dataFilename
     */
    public function getDateFromFilename($dataFilename)
    {
        $matches = [];
        if (preg_match('@touch_([0-9]{4})([0-9]{2})([0-9]{2})\.csv@', $dataFilename, $matches)) {
            $year = $matches[1];
            $month = $matches[2];
            $day = $matches[3];

            return "{$year}-{$month}-{$day}";
        }

        return false;
    }

    // integration du fichier csv dans okovision
    //V1.3.0
    public function csv2bdd()
    {
        ini_set('max_execution_time', 120);
        $t = new timeExec();

        $ob_capteur = new capteur();
        $capteurs = $ob_capteur->getForImportCsv(); //l'index du tableau correspond a la colonne du capteur dans le fichier csv
        $capteurStatus = $ob_capteur->getByType('status');
        $startCycle = $ob_capteur->getByType('startCycle');
        unset($ob_capteur);

        $file = fopen(CSVFILE, 'r');
        $ln = 0;
        $old_status = 0;
        $start_cycle = 0;
        $nbColCsv = count($capteurs);

        $insert = 'INSERT IGNORE INTO oko_historique_full SET ';
        while (!feof($file)) {
            $ligne = fgets($file);
            //ne pas prendre en compte la derniere colonne vide
            $ligne = substr($ligne, 0, strlen($ligne) - 2);

            if (0 != $ln) { //pour ne pas lire la premiere ligne d'entete du fichier csv
                $colCsv = explode(CSV_SEPARATEUR, $ligne);

                if (isset($colCsv[1])) { //test si ligne non vide
                    $jour = $colCsv[0];
                    $heure = $colCsv[1];

                    // Round to the minute, since in some cases it is possible to
                    // import two files with the same data but not the same seconds
                    // Case of an import on the same day of the web files and the USB files
                    $heure = preg_replace('/:[0-9]{2}$/', ':00', $heure);

                    $query = '';

                    $beginValue = "jour = STR_TO_DATE('".$jour."','%d.%m.%Y'),".		// jour
                                    "heure = '".$heure."',".// heure
                                    "timestamp = UNIX_TIMESTAMP(CONCAT(STR_TO_DATE('".$jour."','%d.%m.%Y'),' ','".$heure."'))"; //utc timestamp

                    $query = $insert.$beginValue;
                    //Detection demarrage d'un cycle //Statut 4 = Debut d'un cycle sur le front montant du statut
                    if ('4' == $colCsv[$capteurStatus['position_column_csv']] && $colCsv[$capteurStatus['position_column_csv']] != $old_status) {
                        $st = 1;
                        //creation de la requette pour le comptage des cycle de la chaudiere
                        //Enregistrement de 1 si nous commençons un cycle d'allumage
                        $query .= ', col_'.$startCycle['column_oko'].'='.$st;
                    }

                    //creation de la requette sql pour les capteurs
                    //on commence à la deuxieme colonne de la ligne du csv
                    for ($i = 2; $i <= $nbColCsv; ++$i) {
                        $query .= ', col_'.$capteurs[$i]['column_oko'].'='.$this->cvtDec($colCsv[$i]);
                    }

                    $query .= ';';
                    //execution de la requette representant l'ensemble d'un ligne du csv
                    $this->log->debug('Class '.__CLASS__.' | '.__FUNCTION__.' | '.$query);

                    $this->query($query);
                    $old_status = $colCsv[$capteurStatus['position_column_csv']];
                }
            }
            ++$ln;
        }
        fclose($file);

        $this->log->info('Class '.__CLASS__.' | '.__FUNCTION__.' | SUCCESS - import du CSV dans la BDD - '.$ln.' lignes en '.$t->getTime().' sec ');

        return true;
    }

    /**
     * Fonction lancant les requettes de synthèse du jour, elle ne s'active
     * que si la date demandée est dans le passé.
     *
     * @param string $dateChoosen A date of the form '2015-10-25'
     * @param bool   $bForce      If true, the synthese will be rebuilt even if it
     *                            exists already
     *
     * @return bool
     */
    public function makeSyntheseByDay($dateChoosen = null, $bForce = true)
    {
        //on ne fait rien si la date choisie est la date du jour
        if ($dateChoosen == date('Y-m-d', mktime(0, 0, 0, date('m'), date('d'), date('Y')))) {
            return false;
        }

        if (!$bForce && $this->isSyntheseDone($dateChoosen)) {
            return true;
        }
        // On supprime les data éventuels
        if (!$this->deleteSyntheseDay($dateChoosen)) {
            return false;
        }

        return $this->insertSyntheseDay($dateChoosen);
    }

    /**
     * Function for changing in live a boiler configuration.
     *
     * @param array list of value boiler to change
     * @param mixed $data
     */
    public function applyConfiguration($data = [])
    {
        $this->_formdata = json_encode($data);

        if (!$this->curlGet('set')) {
            $this->curlConnect();
            $this->curlGet('set');
        }
    }

    public function requestBoilerInfo($data = [])
    {
        $this->setFormData($data);
        $this->_responseBoiler = '';
        $this->sendRequest();
    }

    public function getResponseBoiler()
    {
        return $this->_responseBoiler;
    }

    public function isConnected()
    {
        return $this->_connected;
    }

    public function boilerDisconnect()
    {
        return @unlink($this->_cookies);
    }

    /**
     * Look at the boiler data repository, and returns a list of the data
     * files that are available.
     */
    public function getAvailableBoilerDataFiles()
    {
        $rh = fopen('http://'.CHAUDIERE.URL, 'rb');
        while (!feof($rh)) {
            $dirData = fread($rh, 4096);
        }
        fclose($rh);

        $matches = [];
        if (preg_match_all('@touch_[0-9]{8}\.csv@sm', $dirData, $matches)) {
            return array_unique($matches[0]);
        }

        return $matches;
    }

    //fonction de telechargement de fichier sur internet
    // download('http://xxx','/usr/var/tmp)');
    private function download($file_source, $file_target)
    {
        $rh = fopen($file_source, 'rb');
        $wh = fopen($file_target, 'w+b');
        if (!$rh || !$wh) {
            return false;
        }

        while (!feof($rh)) {
            if (false === fwrite($wh, fread($rh, 4096))) {
                return false;
            }
        }

        fclose($rh);
        fclose($wh);

        return true;
    }

    //function de convertion du format decimal de l'import au format bdd
    private function cvtDec($n)
    {
        return str_replace(CSV_DECIMAL, BDD_DECIMAL, $n);
    }

    private function deleteSyntheseDay($day)
    {
        $q = "DELETE FROM oko_resume_day where jour = '".$day."'";
        $this->log->debug('Class '.__CLASS__.' | '.__FUNCTION__.' | '.$q);

        return $this->query($q);
    }

    /**
     * Checks if a synthese already exists for this date.
     *
     * @param type $day
     */
    private function isSyntheseDone($day)
    {
        $sql = "SELECT COUNT(*) FROM oko_resume_day WHERE jour = '{$day}'";

        $result = $this->query($sql);

        if ($result) {
            if ($res = $result->fetch_row()) {
                return 1 == $res[0];
            }
        }

        return false;
    }

    private function insertSyntheseDay($day)
    {
        $query = 'INSERT INTO oko_resume_day ( jour, tc_ext_max, tc_ext_min, conso_kg, conso_ecs_kg, dju, nb_cycle ) VALUE ';

        $rendu = new rendu();
        $max = $rendu->getTcMaxByDay($day);
        $min = $rendu->getTcMinByDay($day);
        $conso = $rendu->getConsoByday($day);
        $conso_ecs = $rendu->getConsoByday($day, null, null, 'hotwater');
        $dju = $rendu->getDju($max->tcExtMax, $min->tcExtMin);
        $cycle = $rendu->getNbCycleByDay($day);

        $consoPellet = (null == $conso->consoPellet) ? 0 : $conso->consoPellet;
        $consoEcsPellet = (null == $conso_ecs->consoPellet) ? 0 : $conso_ecs->consoPellet;
        $nbCycle = (null == $cycle->nbCycle) ? 0 : $cycle->nbCycle;

        $query .= "('".$day."', ".$max->tcExtMax.', '.$min->tcExtMin.', '.$consoPellet.', '.$consoEcsPellet.', '.$dju.', '.$nbCycle.' );';

        $this->log->debug('Class '.__CLASS__.' | '.__FUNCTION__.' | '.$query);

        $n = $this->query($query);

        if (!$n) {
            $this->log->error('Class '.__CLASS__.' | '.__FUNCTION__.' | creation synthèse du '.$day.' impossible');

            return false;
        }
        $this->log->info('Class '.__CLASS__.' | '.__FUNCTION__.' | SUCCESS | creation synthèse du '.$day);

        return true;
    }

    /**
     * Function making live connection whit boiler.
     */
    private function curlConnect()
    {
        $q = "select login_boiler as login, pass_boiler as pass from oko_user where user='admin';";
        $result = $this->query($q);
        $boiler = $result->fetch_object();

        $code = false;
        $curl = curl_init();

        curl_setopt_array($curl, [
            CURLOPT_VERBOSE => false,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_URL => $this->_loginUrl,
            CURLOPT_USERAGENT => 'Okovision Agent',
            CURLOPT_POST => 1,
            CURLOPT_COOKIEJAR => $this->_cookies,
            CURLOPT_POSTFIELDS => http_build_query([
                'username' => $boiler->login,
                'password' => base64_decode($boiler->pass),
                'language' => 'en',
                'submit' => 'Login',
            ]),
        ]);
        // Send the request & save response to $resp
        $resp = curl_exec($curl);

        $info = curl_getinfo($curl);
        //var_dump($info);exit;
        if ('303' == $info['http_code']) {
            $code = true;
        } else {
            $this->log->info('Class '.__CLASS__.' | '.__FUNCTION__.' | Open Session impossible in'.CHAUDIERE);
            $this->_connected = false;
        }
        curl_close($curl);
    }

    /**
     * Function getting/sending live value into boiler.
     *
     * @param mixed $action
     *
     * @return json
     */
    private function curlGet($action = 'get&attr=1')
    {
        $code = false;
        $curl = curl_init();

        curl_setopt_array($curl, [
            CURLOPT_VERBOSE => false,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_URL => $this->_loginUrl.'?action='.$action,
            CURLOPT_POST => 1,
            CURLOPT_HTTPHEADER => [
                'Accept: application/json',
                'Content-Type: application/x-www-form-urlencoded; charset=UTF-8',
                'Accept-Language: en', ],
            CURLOPT_COOKIEFILE => $this->_cookies,
            CURLOPT_POSTFIELDS => $this->_formdata,
        ]);

        $resp = curl_exec($curl);

        if (!curl_errno($curl)) {
            $info = curl_getinfo($curl);

            if ('200' == $info['http_code']) {
                $this->_responseBoiler = $resp;
                $this->log->debug('Class '.__CLASS__.' | '.__FUNCTION__.' | '.$resp);
                $code = true;
            }
        }

        curl_close($curl);

        return $code;
    }

    /**
     * Function sending live resquest into boiler, and make connection if it doesn't exist.
     */
    private function sendRequest()
    {
        if (!$this->curlGet()) {
            $this->curlConnect();
            $this->curlGet();
        }
    }

    private function setFormData($a)
    {
        $d = '';

        foreach ($a as $key => $capteur) {
            //var_dump($capteur);
            if (!is_array($capteur)) {
                $d .= ',"'.$capteur.'"';
            } else {
                $d .= ',"'.$key.'"';
            }
        }

        $this->_formdata = '["CAPPL:LOCAL.L_fernwartung_datum_zeit_sek"'.$d.']';
    }
}
