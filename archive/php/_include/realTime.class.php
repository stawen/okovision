<?php

/*
* Projet : Okovision - Supervision chaudiere OeKofen
* Auteur : Stawen Dronek
* Utilisation commerciale interdite sans mon accord
*/

class realTime extends connectDb
{
    public function __construct()
    {
        parent::__construct();
    }

    public function __destruct()
    {
        parent::__destruct();
    }

    public function getOkoValue($data = [])
    {
        $o = new okofen();
        $o->requestBoilerInfo($data);

        $r = [];

        $dataBoiler = json_decode($o->getResponseBoiler());

        if ($o->isConnected()) {
            foreach ($dataBoiler as $capt) {
                if ('' != $capt->formatTexts) {
                    $shortTxt = 'ERROR';
                    $value = 'null';
                    $s = [];

                    if ('???' != $capt->value) {
                        $s = explode('|', $capt->formatTexts);
                        $shortTxt = $capt->shortText;
                        $value = $s[$capt->value];
                    }

                    $r[$capt->name] = (object) [
                        'value' => $value,
                        'unitText' => '',
                    ];
                } else {
                    $r[$capt->name] = (object) [
                        'value' => ('' != $capt->divisor && '???' != $capt->divisor) ? ($capt->value / $capt->divisor) : ($capt->value),
                        'unitText' => ('???' == $capt->unitText) ? '' : (('K' == $capt->unitText) ? '°C' : $capt->unitText),
                        'divisor' => $capt->divisor,
                        'lowerLimit' => $capt->lowerLimit,
                        'upperLimit' => $capt->upperLimit,
                    ];
                }
            }
        }

        return $r;
    }

    public function getIndic($way = 1)
    {
        $json['response'] = false;

        //la numérotation des circuits commencent à 0
        //zone 1 = 0
        $hk = $way - 1;
        $indic = ['CAPPL:FA[0].L_mittlere_laufzeit', // temps moyen du bruleur
            'CAPPL:FA[0].L_brennerstarts', // nb demarrage bruleur
            'CAPPL:FA[0].L_brennerlaufzeit_anzeige', //fonct brûleur
            'CAPPL:FA[0].L_anzahl_zuendung', //nb allumage
            'CAPPL:LOCAL.touch[0].version', // version
            //chauffage -> T°C sonde
            'CAPPL:LOCAL.L_aussentemperatur_ist', //T°C extérieur mesurée par la sonde
            "CAPPL:LOCAL.L_hk[{$hk}].raumtemp_ist", //T°C intérieur mesurée par la sonde
            "CAPPL:LOCAL.L_hk[{$hk}].raumtemp_soll", //T°C intérieur consigne actuelle
            //chauffage -> T°C ambiante
            "CAPPL:LOCAL.hk[{$hk}].raumtemp_heizen", //T°C ambiante confort
            "CAPPL:LOCAL.hk[{$hk}].raumtemp_absenken", //T°C ambiante reduit
            "CAPPL:LOCAL.hk[{$hk}].heizkurve_steigung", //pente
            "CAPPL:LOCAL.hk[{$hk}].heizkurve_fusspunkt", //pied de courbe
            "CAPPL:LOCAL.hk[{$hk}].heizgrenze_heizen", //T°c ext de coupure (Confort)
            "CAPPL:LOCAL.hk[{$hk}].heizgrenze_absenken", //T°c ext de coupure (Reduit)
            //Chauffage -> Gestion Eau dans Radiateur
            "CAPPL:LOCAL.hk[{$hk}].vorlauftemp_max", //T°C depart Max
            "CAPPL:LOCAL.hk[{$hk}].vorlauftemp_min", //T°C depart Min
            "CAPPL:LOCAL.hk[{$hk}].ueberhoehung", //Augmentation
            "CAPPL:LOCAL.hk[{$hk}].mischer_max_auf_zeit", //V3V Ouverture
            "CAPPL:LOCAL.hk[{$hk}].mischer_max_aus_zeit", //V3V Pause
            "CAPPL:LOCAL.hk[{$hk}].mischer_max_zu_zeit", //V3V Fermeture
            "CAPPL:LOCAL.hk[{$hk}].mischer_regelbereich_quelle", //Plage réglage TC
            "CAPPL:LOCAL.hk[{$hk}].mischer_regelbereich_vorlauf", //Plage réglage TD
            "CAPPL:LOCAL.hk[{$hk}].quellentempverlauf_anstiegstemp", //Hausse ETC
            "CAPPL:LOCAL.hk[{$hk}].quellentempverlauf_regelbereich", //Correction réglage ETC (Evolution Température Chaudière)
            //	Parametrage bruleur :
            'CAPPL:FA[0].pe_kesseltemperatur_soll', //T°C Consigne
            'CAPPL:FA[0].pe_abschalttemperatur', //T°C Coupure
            'CAPPL:FA[0].pe_einschalthysterese_smart', // Hysteresis marche
            'CAPPL:FA[0].pe_kesselleistung', 			 //Puissance chaudiere
        ];

        $r = $this->getOkoValue($indic);

        if (!empty($r)) {
            $tmp = [];

            foreach ($indic as $key) {
                $tmp[$key] = trim($r[$key]->value.' '.$r[$key]->unitText);
            }
            $json['data'] = $tmp;
            $json['response'] = true;
        }

        $this->sendResponse(json_encode($json));
    }

    public function setOkoLogin($user, $pass)
    {
        $pass = base64_encode($this->realEscapeString($pass));
        $userId = session::getInstance()->getVar('userId');
        $r['response'] = false;

        $q = "update oko_user set login_boiler='{$user}', pass_boiler='{$pass}' where id={$userId}";
        $this->log->debug('Class '.__CLASS__.' | '.__FUNCTION__.' | '.$q);

        if ($this->query($q)) {
            $o = new okofen();
            $o->boilerDisconnect();
            $r['response'] = true;
        }

        $this->sendResponse(json_encode($r));
    }

    public function getdata($id)
    {
        $q = 'select capteur.boiler as boiler, capteur.name as name, capteur.id as id, asso.correction_effect as coeff from oko_asso_capteur_graphe as asso '.
                'LEFT JOIN oko_capteur as capteur ON capteur.id = asso.oko_capteur_id  '.
                'WHERE asso.oko_graphe_id='.$id." AND capteur.boiler <> '' ORDER BY asso.position";

        $this->log->debug('Class '.__CLASS__.' | '.__FUNCTION__.' | '.$q);

        $result = $this->query($q);

        $sensor = [];

        while ($c = $result->fetch_object()) {
            $sensor[$c->boiler] = [
                'name' => $c->name,
                'coeff' => $c->coeff,
            ];
        }

        $r = $this->getOkoValue($sensor);
        $resultat = '';

        foreach ($sensor as $boiler => $param) {
            $resultat .= '{ "name": "'.$param['name'].'",';
            $data = '['.substr($r['CAPPL:LOCAL.L_fernwartung_datum_zeit_sek']->value, 0, -7).'000,'.$r[$boiler]->value * $param['coeff'].']';
            $resultat .= '"data": '.$data.'},';
        }

        //on retire la derniere virgule qui ne sert à rien
        $resultat = substr($resultat, 0, strlen($resultat) - 1);
        $this->sendResponse('['.$resultat.']');
    }

    public function getSensorInfo($sensor)
    {
        $sensor = session::getInstance()->getSensorName($sensor);

        $this->log->debug('Class '.__CLASS__.' | '.__FUNCTION__.' | '.$sensor);

        $r = $this->getOkoValue(
            [$sensor]
        );

        $this->sendResponse(json_encode($r[$sensor]));
    }

    public function saveBoilerConfig($config, $description, $dateChoisen = '')
    {
        if ('' != $dateChoisen) {
            $date = DateTime::createFromFormat('d/m/Y H:i:s', $dateChoisen);
        } else {
            $date = new DateTime();
        }

        $utc = ($date->getTimestamp() + $date->getOffset());

        $config = json_encode($config);
        $this->log->debug('Class '.__CLASS__.' | '.__FUNCTION__.' | '.$config);

        $config = $this->realEscapeString($config);
        $this->log->debug('Class '.__CLASS__.' | '.__FUNCTION__.' | '.$config);

        $description = $this->realEscapeString($description);

        $q = "INSERT INTO oko_boiler set timestamp={$utc}, description='{$description}', config='{$config}' ;";

        $this->log->debug('Class '.__CLASS__.' | '.__FUNCTION__.' | '.$q);

        $r['response'] = $this->query($q);

        $this->sendResponse(json_encode($r));
    }

    public function deleteConfigBoiler($timestamp)
    {
        $q = "DELETE FROM oko_boiler where timestamp={$timestamp};";

        $this->log->debug('Class '.__CLASS__.' | '.__FUNCTION__.' | '.$q);

        $r['response'] = $this->query($q);

        $this->sendResponse(json_encode($r));
    }

    public function getListConfigBoiler()
    {
        $q = "SELECT timestamp as timestamp, DATE_FORMAT(FROM_UNIXTIME(timestamp), '%d/%m/%Y %H:%i:%s') as date, description, config FROM oko_boiler order by timestamp desc; ";

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

        $this->sendResponse(json_encode($r));
    }

    public function getConfigBoiler($timestamp)
    {
        $q = "SELECT config FROM oko_boiler where timestamp={$timestamp}; ";

        $this->log->debug('Class '.__CLASS__.' | '.__FUNCTION__.' | '.$q);

        $result = $this->query($q);
        $r = null;

        if ($result) {
            $r .= '"response":true';
            $res = $result->fetch_object();
            $r .= ',"data":'.$res->config;
            $this->log->debug('Class '.__CLASS__.' | '.__FUNCTION__.' | '.$res->config);
        } else {
            $r .= '"response":false';
        }

        $this->sendResponse('{'.$r.'}');
    }

    public function applyBoilerConfig($config)
    {
        //$config = json_decode($config);
        $sensors = [];
        $param = [];

        foreach ($config as $key => $value) {
            $t = explode(' ', $value);
            $name = session::getInstance()->getSensorName($key);

            $param[$name] = $t[0];
            $sensors[] = $name;
        }
        //var_dump($sensors);exit;
        //preparation du message a transmettre au boiler
        //recuperation des informations de chaque capteur pour le mettre au bon format
        $sensorsInfo = $this->getOkoValue($sensors);

        //var_dump($sensorsInfo); exit;

        foreach ($param as $name => $value) {
            $c = $sensorsInfo[$name];
            $param[$name] = $value * $c->divisor;
        }

        $this->log->debug('Class '.__CLASS__.' | '.__FUNCTION__.' | '.json_encode($param));

        $o = new okofen();
        $o->applyConfiguration($param);

        $this->sendResponse($o->getResponseBoiler());
    }

    public function getBoilerMode($way = 1)
    {
        $json['response'] = false;

        // le numéro du circuit ou de la zone commence à 0
        // zone 1 = 0
        $hk = $way - 1;

        $sensor = ["CAPPL:LOCAL.hk[{$hk}].betriebsart[1]", // temps moyen du bruleur
        ];

        $r = $this->getOkoValue($sensor);

        if (!empty($r)) {
            $tmp = [];

            foreach ($sensor as $key) {
                $tmp[$key] = trim($r[$key]->value.' '.$r[$key]->unitText);
            }
            $json['data'] = $tmp;
            $json['response'] = true;
        }

        $this->sendResponse(json_encode($json));
    }

    public function setBoilerMode($mode = 0, $way = 1)
    {
        // le numéro du circuit ou de la zone commence à 0
        // zone 1 = 0
        $hk = $way - 1;
        $o = new okofen();
        $o->applyConfiguration(
            [
                "CAPPL:LOCAL.hk[{$hk}].betriebsart[1]" => $mode,
            ]
        );

        $this->sendResponse($o->getResponseBoiler());
    }

    private function sendResponse($t)
    {
        header('Content-type: text/json; charset=utf-8');
        echo $t;
    }
}
