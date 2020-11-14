<?php
/*
* Projet : Okovision - Supervision chaudiere OeKofen
* Auteur : Stawen Dronek
* Utilisation commerciale interdite sans mon accord
*/

include_once 'config.php';

function is_ajax()
{
    //return isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest';
    return true;
}

function is_valid()
{
    $apiToken = substr(TOKEN, 0, 12);

    if (isset($_GET['token'])) {
        return (0 == strcmp($apiToken, $_GET['token'])) ? true : false;
    }
    if (isset($_POST['token'])) {
        return (0 == strcmp($apiToken, $_POST['token'])) ? true : false;
    }

    return false;
}

if (is_ajax() && is_valid()) {
    if ('POST' === $_SERVER['REQUEST_METHOD']) {
    }

    if (isset($_GET['type'], $_GET['action'])) {
        /*
        * TODO
        * Ajotuer ici un control pour savoir si l'utilisateur en cours a le droit d'appeler les fonctions suivantes
        */
        switch ($_GET['type']) {
                case 'admin':
                    $a = new administration();

                    switch ($_GET['action']) {
                        case 'getFileFromChaudiere':
                            $a->getFileFromChaudiere();

                            break;
                        case 'getHeaderFromOkoCsv':
                            $a->getHeaderFromOkoCsv();

                            break;
                        case 'getSaisons':
                            $a->getSaisons();

                            break;
                        case 'checkUpdate':
                            $a->checkUpdate();

                            break;
                        case 'getVersion':
                            $a->getVersion();

                            break;
                    }

                    break;
                case 'graphique':
                    $g = new gstGraphique();

                    switch ($_GET['action']) {
                        case 'getCapteurs':
                            $g->getCapteurs();

                            break;
                        case 'getGrapheAsso':
                            $g->getGrapheAsso($_GET['id']);

                            break;
                    }

                    break;
                case 'rendu':
                    $r = new rendu();
                    switch ($_GET['action']) {
                        case 'getGraphe':
                            $g = new gstGraphique();
                            $g->getGraphe();

                            break;
                        case 'getGrapheData':
                            $r->getGrapheData($_GET['id'], $_GET['day']);

                            break;
                        case 'getIndicByDay':
                            if (isset($_GET['timeStart'], $_GET['timeEnd'])) {
                                $r->getIndicByDay($_GET['day'], $_GET['timeStart'], $_GET['timeEnd']);
                            } else {
                                $r->getIndicByDay($_GET['day']);
                            }

                            break;
                        case 'getIndicByMonth':
                            $r->getIndicByMonth($_GET['month'], $_GET['year']);

                            break;
                        case 'getStockStatus':
                            $r->getStockStatus();

                            break;
                        case 'getAshtrayStatus':
                            $r->getAshtrayStatus();

                            break;
                        case 'getHistoByMonth':
                            $r->getHistoByMonth($_GET['month'], $_GET['year']);

                            break;
                        case 'getTotalSaison':
                            $r->getTotalSaison($_GET['id']);

                            break;
                        case 'getSyntheseSaison':
                            $r->getSyntheseSaison($_GET['id']);

                            break;
                        case 'getSyntheseSaisonTable':
                            $r->getSyntheseSaisonTable($_GET['id']);

                            break;
                        case 'getAnnotationByDay':
                            $r->getAnnotationByDay($_GET['day']);

                            break;
                    }

                    break;
                case 'rt':
                    $rt = new realTime();

                    switch ($_GET['action']) {
                        case 'getIndic':
                            if (isset($_GET['way'])) {
                                $rt->getIndic($_GET['way']);
                            } else {
                                $rt->getIndic();
                            }

                            break;
                        case 'getData':
                            if (isset($_GET['idgraphe'])) {
                                $rt->getData($_GET['idgraphe']);
                            }

                            break;
                        case 'getBoilerMode':
                            if (isset($_GET['way'])) {
                                $rt->getBoilerMode($_GET['way']);
                            }

                            break;
                        case 'setBoilerMode':
                            if (isset($_GET['mode'], $_GET['way'])) {
                                $rt->setBoilerMode($_GET['mode']);

                                break;
                            }
                    }

                    break;
            }
    }
} else {
    if (!is_ajax()) {
        echo '<pre>xmlhttprequest needed ! </pre>';
    }
    if (!is_valid()) {
        header('Content-type: text/json; charset=utf-8');
        echo '{"response": false,"apiToken": "invalid"}';
    }
}
