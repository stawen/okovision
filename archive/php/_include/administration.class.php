<?php
/*
* Projet : Okovision - Supervision chaudiere OeKofen
* Auteur : Stawen Dronek
* Utilisation commerciale interdite sans mon accord
*/

class administration extends connectDb
{
    private $_urlApi = 'http://api.okovision.dronek.com';

    public function __construct()
    {
        parent::__construct();
    }

    public function __destruct()
    {
        parent::__destruct();
    }

    /**
     * Test with a ping if the boiler is visible/online.
     *
     * @param string $address Ip address
     *
     * @return json response = true or false
     */
    public function ping($address)
    {
        $waitTimeoutInSeconds = 1;

        $r = [];
        $tmp = explode(':', $address);
        $ip = $tmp[0];
        $port = isset($tmp[1]) ? $tmp[1] : 80;

        if ($fp = @fsockopen($ip, $port, $errCode, $errStr, $waitTimeoutInSeconds)) {
            // It worked
            $r['response'] = true;
            $r['url'] = 'http://'.$address.URL;
        } else {
            $r['response'] = false;
        }
        @fclose($fp);

        $this->sendResponse($r);
    }

    /**
     * Save in /config.json informations from General information Page.
     *
     * @param array $s Global Post Variable $_POST
     *
     * @return json response = true or false
     */
    public function saveInfoGenerale($s)
    {
        // Make config.json

        $param = [
            'chaudiere' => $s['oko_ip'],
            'tc_ref' => $s['param_tcref'],
            'poids_pellet' => $s['param_poids_pellet'],
            'surface_maison' => $s['surface_maison'],
            'get_data_from_chaudiere' => $s['oko_typeconnect'],
            'timezone' => $s['timezone'],
            'send_to_web' => $s['send_to_web'],
            'has_silo' => $s['has_silo'],
            'silo_size' => $s['silo_size'],
            'ashtray' => $s['ashtray'],
            'lang' => $s['lang'],
        ];

        $r = [];
        $r['response'] = true;

        $ok = file_put_contents(CONTEXT.'/config.json', json_encode($param));

        if (!$ok) {
            $r['response'] = false;
        }

        $this->sendResponse($r);
    }

    /**
     * Get file list from boiler.
     *
     * @return json this list
     */
    public function getFileFromChaudiere()
    {
        $r['response'] = true;

        $htmlCode = file_get_contents('http://'.CHAUDIERE.URL);

        $dom = new DOMDocument();

        $dom->LoadHTML($htmlCode);

        $links = $dom->GetElementsByTagName('a');

        $t_href = [];
        foreach ($links as $a) {
            $href = $a->getAttribute('href');

            if (preg_match('/csv/i', $href)) {
                array_push(
                    $t_href,
                    [
                        'file' => trim(str_replace(URL.'/', '', $href)),
                        'url' => 'http://'.CHAUDIERE.$href,
                    ]
                );
            }
        }
        $r['listefiles'] = $t_href;

        $this->sendResponse($r);
    }

    /**
     * Get file from boiler and import data into db.
     *
     * @see okofen::csv2bdd()
     * @see okofen::getChaudiereData()
     *
     * @param array $s $_POST with $_POST[url]
     *
     * @return json response = true or false
     */
    public function importFileFromChaudiere($s)
    {
        $r = [];
        $r['response'] = true;
        $import = false;

        $oko = new okofen();

        $status = $oko->getChaudiereData($s['url']);

        if ($status) {
            $import = $oko->csv2bdd();
        } else {
            $r['response'] = false;
        }
        if (!$import) {
            $r['response'] = false;
        }

        $this->sendResponse($r);
    }

    /**
     * Methode how upload CSV file into /tmp and rename it.
     *
     * If it's call for make or update Matrix, the destination file will be named matrice.csv
     * If it's call for an manual import csv boiler file, then it will be named import.csv.
     *
     * @param string $toto description
     * @param string $toto description
     * @param string $toto description
     * @param mixed  $s
     * @param mixed  $f
     */
    public function uploadCsv($s, $f)
    {
        $upload_handler = new UploadHandler();

        if (isset($s['actionFile'])) {
            if ('matrice' == $s['actionFile']) {
                $matrice = 'matrice.csv';
                $opt = $upload_handler->getOption();
                $rep = $opt['upload_dir'];

                if (file_exists($rep.$matrice)) {
                    unlink($rep.$matrice);
                }
                //si rename ok, alors init de la table capteur
                if (rename($rep.$f['files']['name'][0], $rep.$matrice)) {
                    if (!isset($s['update'])) {
                        $this->initMatriceFromFile();
                    } else {
                        $this->updateMatriceFromFile();
                    }
                }
            }

            if ('majusb' == $s['actionFile']) {
                $matrice = 'import.csv';
                $opt = $upload_handler->getOption();
                $rep = $opt['upload_dir'];

                if (file_exists($rep.$matrice)) {
                    unlink($rep.$matrice);
                }

                rename($rep.$f['files']['name'][0], $rep.$matrice);
            }
        }
        $upload_handler->generate_response_manual();
    }

    /**
     * Get All sensor in oko_capteur and format it into json for page Matrix.
     *
     * @return json all sensor
     */
    public function getHeaderFromOkoCsv()
    {
        $r = [];
        $q = 'select id, name, original_name, type, boiler from oko_capteur where position_column_csv <> -1 order by position_column_csv';
        $this->log->debug('Class '.__CLASS__.' | '.__FUNCTION__.' | '.$q);

        $result = $this->query($q);

        if ($result) {
            $r['response'] = true;
            $tmp = [];
            while ($res = $result->fetch_object()) {
                array_push($tmp, $res);
            }
            $r['data'] = $tmp;
        } else {
            $r['response'] = false;
        }

        $this->sendResponse($r);
    }

    /**
     * Test if matrix has been initiate or not.
     *
     * @return json true -> matrix exist |false -> not exist
     */
    public function statusMatrice()
    {
        $q = 'select count(*) from oko_capteur';

        $result = $this->query($q);

        $r['response'] = false;

        if ($result) {
            $res = $result->fetch_row();
            $this->log->debug('Class '.__CLASS__.' | '.__FUNCTION__.' | '.$res[0]);

            if ($res[0] > 1) {
                $r['response'] = true;
            }
        }

        $this->sendResponse($r);
    }

    /**
     * Delete all row in oko_capteur and flush all data day. But not data history.
     *
     * @return json true|false
     */
    public function deleteMatrice()
    {
        $r['response'] = false;

        $truncCapteur = 'TRUNCATE TABLE oko_capteur;';
        $drop = 'DROP TABLE IF EXISTS oko_historique_full;';

        if ($this->query($truncCapteur) && $this->query($drop)) {
            $create = 'CREATE TABLE IF NOT EXISTS `oko_historique_full` ('
                        .'jour DATE NOT NULL,'
                        .'heure TIME NOT NULL,'
                        .'timestamp int(11) unsigned NOT NULL,'
                        .'PRIMARY KEY (jour, heure)'
                        .') ENGINE=MYISAM DEFAULT CHARSET=utf8;';

            $this->log->debug('Class '.__CLASS__.' | '.__FUNCTION__.' | '.$create);
            $r['response'] = $this->query($create);
        }

        $this->sendResponse($r);
    }

    /**
     * force import csv into db, but it's doesn't download a new file.
     *
     * @return json true|false
     */
    public function importcsv()
    {
        $oko = new okofen();
        $r['response'] = $oko->csv2bdd();
        $this->sendResponse($r);
    }

    /**
     * Detect all day who have data but not a resume day.
     *
     * @return json day list without resume
     */
    public function getDayWithoutSynthese()
    {
        //ne pas proposer la date du jour, car forcement incomplete.
        $now = date('Y-m-d', mktime(0, 0, 0, date('m'), date('d'), date('Y')));

        $q = 'SELECT a.jour as jour FROM oko_historique_full as a '.
                'LEFT OUTER JOIN oko_resume_day as b ON a.jour = b.jour '.
                "WHERE b.jour is NULL AND a.jour <> '".$now."'group by a.jour;";

        $this->log->debug('Class '.__CLASS__.' | '.__FUNCTION__.' | '.$q);

        $result = $this->query($q);
        $r['data'] = [];

        if ($result) {
            $tmp = [];
            while ($res = $result->fetch_object()) {
                array_push($tmp, $res);
            }
            $r['data'] = $tmp;
        }

        $this->sendResponse($r);
    }

    /**
     * Force Synthese for one day.
     *
     * @param string $day (YYYY-MM-DD)
     *
     * @return json true|false
     */
    public function makeSyntheseByDay($day)
    {
        $oko = new okofen();
        $r['response'] = $oko->makeSyntheseByDay($day);
        $this->sendResponse($r);
    }

    /**
     * get list season created in configuration.
     *
     * @return json array of season
     */
    public function getSaisons()
    {
        $r = [];
        $q = "select id, saison, DATE_FORMAT(date_debut,'%d/%m/%Y') as date_debut, date_debut as startDate, DATE_FORMAT(date_fin,'%d/%m/%Y') as date_fin, date_fin as endDate from oko_saisons order by date_debut";

        $this->log->debug('Class '.__CLASS__.' | '.__FUNCTION__.' | '.$q);

        $result = $this->query($q);

        if ($result) {
            $r['response'] = true;
            $tmp = [];
            while ($res = $result->fetch_object()) {
                array_push($tmp, $res);
            }
            $r['data'] = $tmp;
        } else {
            $r['response'] = false;
        }

        //$result->free();
        $this->sendResponse($r);
    }

    /**
     * Test if this date is the first date of a season.
     *
     * @param string $day (YYYY-MM-DD)
     *
     * @return json true|false
     */
    public function existSaison($day)
    {
        $r = [];

        $q = "select count(*) from oko_saisons where date_debut = '".$day."'";

        $this->log->debug('Class '.__CLASS__.' | '.__FUNCTION__.' | '.$q);

        $result = $this->query($q);

        $r['response'] = false;

        if ($result) {
            $res = $result->fetch_row();

            if ($res[0] > 0) {
                $r['response'] = true;
            }
        }

        $this->sendResponse($r);
    }

    /**
     * Record a new season.
     *
     * @param string $s in $_POST[startDate] (YYYY-MM-DD), the first date of the season
     *
     * @return json true|false
     */
    public function setSaison($s)
    {
        $r = [];

        $dates = $this->getDateSaison($s['startDate']);
        //insertion d'une reference au demarrage des cycles de chauffe
        $query = "INSERT INTO oko_saisons (saison, date_debut, date_fin) VALUES('".$dates['saison']."','".$dates['start']."','".$dates['end']."');";
        $this->log->debug('Class '.__CLASS__.' | '.__FUNCTION__.' | '.$query);

        $r['response'] = $this->query($query);

        $this->sendResponse($r);
    }

    /**
     * Update an existing season.
     *
     * @param string $s in $_POST[startDate] (YYYY-MM-DD), the first date of the season
     *
     * @return json true|false
     */
    public function updateSaison($s)
    {
        $r = [];

        $dates = $this->getDateSaison($s['startDate']);
        //insertion d'une reference au demarrage des cycles de chauffe
        $query = "UPDATE oko_saisons set saison='".$dates['saison']."', date_debut='".$dates['start']."', date_fin='".$dates['end']."' where id=".$s['idSaison'];

        $this->log->debug('Class '.__CLASS__.' | '.__FUNCTION__.' | '.$query);

        $r['response'] = $this->query($query);

        $this->sendResponse($r);
    }

    /**
     * Delete an existing season.
     *
     * @param int $s in $_POST[idSaison] , Id of the season
     *
     * @return json true|false
     */
    public function deleteSaison($s)
    {
        $r = [];
        $query = 'DELETE FROM oko_saisons where id='.$s['idSaison'];

        $r['response'] = $this->query($query);
        $this->sendResponse($r);
    }

    /**
     * Get Silo Event.
     */
    public function getEvents()
    {
        $r = [];

        $q = 'SELECT id, '
                  ."DATE_FORMAT(event_date,'%d/%m/%Y') AS event_date, "
                  .'quantity, '
                  .'remaining, '
                  .'price, '
                  .'event_type '
              .'FROM oko_silo_events '
              .'ORDER BY oko_silo_events.event_date DESC';

        $this->log->debug('Class '.__CLASS__.' | '.__FUNCTION__.' | '.$q);

        $result = $this->query($q);

        if ($result) {
            $r['response'] = true;
            $tmp = [];
            while ($res = $result->fetch_object()) {
                array_push($tmp, $res);
            }

            $r['data'] = $tmp;
        } else {
            $r['response'] = false;
        }

        $this->sendResponse($r);
    }

    /**
     * Set Silo Event.
     *
     * @param mixed $s
     */
    public function setEvent($s)
    {
        $r = [];

        $query = 'INSERT INTO oko_silo_events '
                .'(event_date, quantity, remaining,  price,  event_type) '
                .'VALUES '
                ."('".$this->realEscapeString($s['event_date'])."',"
                ." '".$this->realEscapeString($s['quantity'])."',"
                ." '".$this->realEscapeString($s['remaining'])."',"
                ." '".$this->realEscapeString($s['price'])."',"
                ." '".$this->realEscapeString($s['event_type'])."')";

        $this->log->debug('Class '.__CLASS__.' | '.__FUNCTION__.' | '.$query);

        $r['response'] = $this->query($query);

        $this->sendResponse($r);
    }

    /**
     * Update Silo Event.
     *
     * @param mixed $s
     */
    public function updateEvent($s)
    {
        $r = [];

        $query = 'UPDATE oko_silo_events SET '
                ." event_date='".$this->realEscapeString($s['event_date'])."', "
                ." quantity='".$this->realEscapeString($s['quantity'])."', "
                ." remaining='".$this->realEscapeString($s['remaining'])."', "
                ." price='".$this->realEscapeString($s['price'])."', "
                ." event_type='".$this->realEscapeString($s['event_type'])."' "
                .' WHERE id='.$s['idEvent'];

        $this->log->debug('Class '.__CLASS__.' | '.__FUNCTION__.' | '.$query);

        $r['response'] = $this->query($query);

        $this->sendResponse($r);
    }

    /**
     * Delete Silo Event.
     *
     * @param mixed $s
     */
    public function deleteEvent($s)
    {
        $r = [];
        $query = 'DELETE FROM oko_silo_events where id='.$s['idEvent'];

        $r['response'] = $this->query($query);
        $this->sendResponse($r);
    }

    /*
    * Function return current version
    *
    * @return json
    */

    public function getVersion()
    {
        $this->sendResponse($this->getCurrentVersion());
    }

    /**
     * Function get current local version.
     *
     * @return string
     */
    public static function getCurrentVersion()
    {
        return trim(file_get_contents('_include/version.json'));
    }

    /**
     * Function checking if new okovision version is available.
     *
     * @return json
     */
    public function checkUpdate()
    {
        $r = [];
        $r['newVersion'] = false;
        $r['information'] = '';

        $this->addOkoStat();

        $update = new AutoUpdate();
        $update->setCurrentVersion($this->getCurrentVersion());

        if (false === $update->checkUpdate()) {
            $r['information'] = session::getInstance()->getLabel('lang.error.maj.information');
        } elseif ($update->newVersionAvailable()) {
            $r['newVersion'] = true;
            $r['list'] = $update->getVersionsInformationToUpdate();
        } else {
            $r['information'] = session::getInstance()->getLabel('lang.valid.maj.information');
        }

        return $this->sendResponse($r);
    }

    /**
     * Function notify stawen's server for making an update.
     *
     * @return json
     */
    public function addOkoStat()
    {
        $curl = curl_init();
        // Set some options - we are passing in a useragent too here
        $host = $_SERVER['HTTP_HOST'];
        $folder = dirname($_SERVER['SCRIPT_NAME']);
        $source = $host.$folder;

        curl_setopt_array($curl, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_URL => $this->_urlApi,
            CURLOPT_USERAGENT => 'Okovision :-:'.TOKEN.':-:',
            CURLOPT_POST => 1,
            CURLOPT_POSTFIELDS => [
                'token' => TOKEN,
                'source' => $source,
                'version' => $this->getCurrentVersion(),
            ],
        ]);
        // Send the request & save response to $resp
        $resp = curl_exec($curl);
        // Close request to clear up some resources
        curl_close($curl);
    }

    /**
     * Function making the update if a new version is available.
     *
     * @return json
     */
    public function makeUpdate()
    {
        $r = [];
        $r['install'] = false;
        $update = new AutoUpdate();
        $update->setCurrentVersion($this->getCurrentVersion());

        $result = $update->update(); //fait une simulation d'abord, si ok ça install
        if (true === $result) {
            $r['install'] = true;
        } else { // si echec de la simulation d'install
            if ($result = AutoUpdate::ERROR_SIMULATE) {
                $r['information'] = '<pre>'.var_dump($update->getSimulationResults()).'</pre>';
            }
        }

        return $this->sendResponse($r);
    }

    /**
     * Function return all file in _tmp/ folder.
     *
     * @return json
     */
    public function getFileFromTmp()
    {
        $files = scandir('_tmp');
        $r = [];
        foreach ($files as $f) {
            if ('.' != $f && '..' != $f && 'matrice.csv' != $f && 'import.csv' != $f && 'readme.md' != $f && 'cookies_boiler.txt' != $f) {
                $r[] = $f;
            }
        }

        return $this->sendResponse($r);
    }

    /**
     * Function importing boiler file from _tmp/ folder.
     *
     * @see importcsv()
     *
     * @param mixed $file
     */
    public function importFileFromTmp($file)
    {
        if (file_exists('_tmp/import.csv')) {
            unlink('_tmp/import.csv');
        }

        rename('_tmp/'.$file, '_tmp/import.csv');

        $this->importcsv();
    }

    /**
     * Function login. Check if user/password is ok.
     *
     * @param mixed $user
     * @param mixed $pass
     *
     * @return json
     */
    public function login($user, $pass)
    {
        $user = $this->realEscapeString($user);
        $pass = sha1($this->realEscapeString($pass));

        $q = "select count(*) as nb, id, type from oko_user where user='{$user}' and pass='{$pass}' group by id";

        $result = $this->query($q);
        $this->log->debug('Class '.__CLASS__.' | '.__FUNCTION__.' | '.$q);

        $r['response'] = false;

        if ($result) {
            $res = $result->fetch_object();

            if (1 == $res->nb) {
                $r['response'] = true;
                session::getInstance()->setVar('typeUser', $res->type);
                session::getInstance()->setVar('logged', true);
                session::getInstance()->setVar('userId', $res->id);
            }
        }
        $this->sendResponse($r);
    }

    /**
     * Function logout. destroy session.
     *
     * @return json
     */
    public function logout()
    {
        session::getInstance()->deleteVar('logged');
        session::getInstance()->deleteVar('typeUser');
        session::getInstance()->deleteVar('userId');
        $r['response'] = true;
        $this->sendResponse($r);
    }

    /**
     * Function changing password.
     *
     * @param mixed $pass
     *
     * @return json
     */
    public function changePassword($pass)
    {
        $pass = sha1($this->realEscapeString($pass));
        $userId = session::getInstance()->getVar('userId');

        $q = "update oko_user set pass='{$pass}' where id={$userId}";
        $this->log->debug('Class '.__CLASS__.' | '.__FUNCTION__.' | '.$q);

        $r['response'] = $this->query($q);

        $this->sendResponse($r);
    }

    /**
     * Send response to client. Any array will be transform into json.
     *
     * @param array $t Any array will be accepted
     */
    private function sendResponse($t)
    {
        header('Content-type: text/json; charset=utf-8');
        echo json_encode($t, JSON_NUMERIC_CHECK);
    }

    /**
     * Method how create matrix after the first csv file upload.
     *
     * This method create row into oko_historique_full (nb row table = nb row csv)
     * It's update table oko_capteur. ths method add for each sensor is csv name, Real Time Name, position into csv file
     *
     * @see administration::uploadCsv()
     */
    private function initMatriceFromFile()
    {
        //translation
        $dico = json_decode(file_get_contents('_langs/'.session::getInstance()->getLang().'.matrice.json'), true);
        //open matrice file just uploaded, first line
        $line = trim(fgets(fopen('_tmp/matrice.csv', 'r')));

        //on retire le dernier ; de la ligne et on convertie la chaine en utf8
        $string = substr($line, 0, strlen($line) - 2);
        $line = mb_convert_encoding($string, 'UTF-8', mb_detect_encoding($string, 'UTF-8, ISO-8859-1, ISO-8859-15', true));

        $this->log->debug('Class '.__CLASS__.' | '.__FUNCTION__.' | CSV First Line | '.$line);

        $query = '';
        $positionOko = 2;
        $column = explode(CSV_SEPARATEUR, $line);

        foreach ($column as $position => $t) {
            //set only capteur not day and hour
            if ($position > 1) {
                $title = trim($t);

                if (isset($dico[$title])) {
                    $name = $dico[$title]['name'];
                    $type = $dico[$title]['type'];
                    $boiler = $dico[$title]['boiler'];
                } else {
                    $name = $title;
                    $type = '';
                    $boiler = '';
                }

                $addColumn = "ALTER TABLE oko_historique_full ADD COLUMN col_{$positionOko} DECIMAL(6,2) NULL DEFAULT NULL;";
                $this->log->debug('Class '.__CLASS__.' | '.__FUNCTION__.' | Create oko_capteur | '.$addColumn);

                $query .= $addColumn;

                $q = "INSERT INTO oko_capteur(name,position_column_csv,column_oko, original_name,type,boiler) VALUE ('{$name}',{$position},{$positionOko},'{$title}','{$type}','{$boiler}');";

                ++$positionOko;

                $this->log->debug('Class '.__CLASS__.' | '.__FUNCTION__.' | Create oko_capteur | '.$q);
                $query .= $q;
            }
        }
        //insertion d'une reference au demarrage des cycles de chauffe
        $nbColumnCsv = count($column);

        $addColumn = "ALTER TABLE oko_historique_full ADD COLUMN col_{$positionOko} DECIMAL(6,2) NULL DEFAULT NULL;";
        $this->log->debug('Class '.__CLASS__.' | '.__FUNCTION__.' | Create oko_capteur | '.$addColumn);

        $query .= $addColumn;

        $query .= "INSERT INTO oko_capteur(name,position_column_csv,column_oko,original_name,type) VALUES ('Start Cycle',{$nbColumnCsv},{$positionOko},'Start Cycle','startCycle');";

        $result = $this->multi_query($query);
        while ($this->flush_multi_queries()) {
        } // flush multi_queries
    }

    /**
     * Update into oko_capteur all capteur in csv file from okofen.
     *
     * @see administration::uploadCsv()
     */
    private function updateMatriceFromFile()
    {
        //translation
        $dico = json_decode(file_get_contents('_langs/'.session::getInstance()->getLang().'.matrice.json'), true);
        //open matrice file just uploaded, first line
        $line = fgets(fopen('_tmp/matrice.csv', 'r'));
        //on retire le dernier ; de la ligne
        $line = mb_convert_encoding(substr($line, 0, strlen($line) - 2), 'UTF-8');

        $this->log->debug('Class '.__CLASS__.' | '.__FUNCTION__.' | CSV First Line | '.$line);

        $c = new capteur();
        $capteurs = $c->getMatrix();
        $capteursCsv = [];
        $lastColumnOko = $c->getLastColumnOko();

        $query = '';

        $column = explode(CSV_SEPARATEUR, $line);
        //$capteursCsv = array_slice(array_flip($column),2);

        //on deroule la liste des capteurs dans le csv
        //cela va tester le deplacement d'un capteur par rapport à la bdd ou l'ajout d'un capteur
        foreach ($column as $position => $t) {
            //set only capteur not day and hour
            if ($position > 1) {
                $title = trim($t);

                $capteursCsv[$title] = $position;

                //on test si le capteur etait deja connu dans la base oko_capteur
                if (array_key_exists($title, $capteurs)) {
                    //on verifie si la position du capteur a changer, si oui, maj de la bdd
                    if ($capteurs[$title]->position_column_csv !== $position) {
                        $q = 'UPDATE oko_capteur set position_column_csv='.$position.' where id='.$capteurs[$title]->id.';';
                        $this->log->debug('Class '.__CLASS__.' | '.__FUNCTION__.' | Update oko_capteur | '.$q);
                    }
                } else {
                    //capteur pas connu dans la base, on le met en fin de table  oko_capteur
                    if (isset($dico[$title])) {
                        $name = $dico[$title]['name'];
                        $type = $dico[$title]['type'];
                        $boiler = $dico[$title]['boiler'];
                    } else {
                        $name = $title;
                        $type = '';
                        $boiler = '';
                    }
                    ++$lastColumnOko;

                    $addColumn = "ALTER TABLE oko_historique_full ADD COLUMN col_{$lastColumnOko} DECIMAL(6,2) NULL DEFAULT NULL;";
                    $this->log->debug('Class '.__CLASS__.' | '.__FUNCTION__.' | Create New oko_capteur | '.$addColumn);
                    $query .= $addColumn;

                    $q = "INSERT INTO oko_capteur(name,position_column_csv,column_oko, original_name,type,boiler) VALUE ('{$name}',{$position},{$lastColumnOko},'{$title}','{$type}','{$boiler}');";

                    $this->log->debug('Class '.__CLASS__.' | '.__FUNCTION__.' | Create New oko_capteur | '.$q);
                }

                $query .= $q;
            }
        }
        //on test maintenant le retrait d'un capteur dans le csv par rapport à la base oko_capteur
        $forbidenCapteurs = array_diff_key($capteurs, $capteursCsv);

        foreach ($forbidenCapteurs as $t => $position) {
            //si le capteur n'est plus present dans le csv, on met a jour la table en lui mettant -1 dans sa position_csv
            $title = trim($t);
            $q = 'UPDATE oko_capteur set position_column_csv=-1 where id='.$capteurs[$title]->id.';';
            $this->log->debug('Class '.__CLASS__.' | '.__FUNCTION__.' | Disable oko_capteur | '.$q);

            $query .= $q;
        }

        //on met a jour le startCycle
        $nbColumnCsv = count($column);
        $q = "UPDATE oko_capteur set position_column_csv={$nbColumnCsv} where type = 'startCycle';";
        $query .= $q;

        $result = $this->multi_query($query);
        while ($this->flush_multi_queries()) {
        } // flush multi_queries
    }

    /**
     * Make a season with the first date.
     *
     * @param string $startDate (YYYY-MM-DD)
     *
     * @return json true|false
     */
    private function getDateSaison($startDate)
    {
        $date = DateTime::createFromFormat('Y-m-d', $startDate);

        $start = $date->format('Y-m-d');
        $saison = $date->format('Y');

        $date->add(new DateInterval('P1Y'));
        $date->sub(new DateInterval('P1D'));
        $end = $date->format('Y-m-d');

        $saison .= '-'.$date->format('Y');

        return [
            'start' => $start,
            'end' => $end,
            'saison' => $saison,
        ];
    }

    /**
     * Function set current version in version.json.
     *
     * @param string (x.y.z)
     * @param mixed $v
     */
    private function setCurrentVersion($v)
    {
        return file_put_contents('_include/version.json', $v);
    }
}
