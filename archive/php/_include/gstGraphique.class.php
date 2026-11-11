<?php

class gstGraphique extends connectDb
{
    public function __construct()
    {
        parent::__construct();
    }

    public function __destruct()
    {
        parent::__destruct();
    }

    public function getGraphe()
    {
        $q = 'select id, name, position from oko_graphe order by position';

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

    public function getLastGraphePosition()
    {
        $q = 'select max(position) as lastPosition from oko_graphe';
        $this->log->debug('Class '.__CLASS__.' | '.__FUNCTION__.' | '.$q); //.$r['data']['lastPosition']

        $result = $this->query($q);

        $r['response'] = false;

        if ($result) {
            $r['response'] = true;
            $r['data'] = $result->fetch_object();
        }

        $this->sendResponse($r);
    }

    public function grapheNameExist($name)
    {
        $q = "select count(*) from oko_graphe where name='".$name."'";
        $result = $this->query($q);

        $r['exist'] = false;
        if ($result) {
            $res = $result->fetch_row();
            if ($res[0] > 0) {
                $r['exist'] = true;
            }
        }
        $this->sendResponse($r);
    }

    public function addGraphe($s)
    {
        $name = $this->realEscapeString($s['name']);

        $q = "INSERT INTO oko_graphe (name, position) value ('".$name."','".$s['position']."')";
        $this->log->debug('Class gestGraphique | addGraphe | '.$q);
        $r = [];

        $r['response'] = false;

        if ($this->query($q)) {
            $r['response'] = true;
        }

        $this->sendResponse($r);
    }

    public function updateGraphe($s)
    {
        $name = $this->realEscapeString($s['name']);
        $q = "UPDATE oko_graphe SET name='".$name."' where id=".$s['id'];

        $r['response'] = false;

        if ($this->query($q)) {
            $r['response'] = true;
        }

        $this->sendResponse($r);
    }

    public function updateGraphePosition($s)
    {
        $r['response'] = false;
        //si position des autres est = ou sup alors on fait + 1, si position est inf on fait -1
        //on met a jour la position du grpahe selectionné

        $q = 'UPDATE oko_graphe SET position='.$s['position'].' WHERE id = '.$s['id_graphe'];
        $this->log->debug('Class '.__CLASS__.' | '.__FUNCTION__.' | '.$q);

        if ($this->query($q)) {
            if ($s['position'] > $s['current']) {
                $q = 'UPDATE oko_graphe SET position=(position - 1) WHERE position <= '.$s['position'].' AND position > '.$s['current'].' AND id <> '.$s['id_graphe'];
            } else {
                $q = 'UPDATE oko_graphe SET position=(position + 1) WHERE position >= '.$s['position'].' AND position < ('.$s['current'].' + 1) AND id <> '.$s['id_graphe'];
            }
            $this->log->debug('Class '.__CLASS__.' | '.__FUNCTION__.' | '.$q);

            if ($this->query($q)) {
                $r['response'] = true;
            }
        }

        $this->sendResponse($r);
    }

    public function deleteGraphe($s)
    {
        $r['response'] = false;

        $q = 'SELECT position from oko_graphe where id='.$s['id'];
        $this->log->debug('Class '.__CLASS__.' | '.__FUNCTION__.' | '.$q);

        $result = $this->query($q);

        if ($result) {
            $res = $result->fetch_object();
            $position = $res->position;

            $q = 'DELETE from oko_graphe where id='.$s['id'];
            $this->log->debug('Class '.__CLASS__.' | '.__FUNCTION__.' | '.$q);

            if ($this->query($q)) {
                $q = 'UPDATE oko_graphe SET position=(position - 1) WHERE position > '.$position;
                $this->log->debug('Class '.__CLASS__.' | '.__FUNCTION__.' | '.$q);

                if ($this->query($q)) {
                    $r['response'] = true;
                }
            }
        }

        $this->sendResponse($r);
    }

    public function getCapteurs()
    {
        $q = 'select id, name from oko_capteur order by id asc';
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

    public function grapheAssoCapteurExist($graphe, $capteur)
    {
        $q = 'select count(*) from oko_asso_capteur_graphe where oko_graphe_id='.$graphe.' and oko_capteur_id='.$capteur;
        $result = $this->query($q);

        $r['exist'] = false;
        if ($result) {
            $res = $result->fetch_row();

            if ($res[0] > 0) {
                $r['exist'] = true;
            }
        }
        $this->sendResponse($r);
    }

    public function addGrapheAsso($s)
    {
        $q = 'INSERT INTO oko_asso_capteur_graphe (oko_graphe_id, oko_capteur_id, position, correction_effect) value ('.$s['id_graphe'].','.$s['id_capteur'].','.$s['position'].','.$s['coeff'].')';
        $this->log->debug('Class '.__CLASS__.' | '.__FUNCTION__.' | '.$q);
        $r = [];

        $r['response'] = false;

        if ($this->query($q)) {
            $r['response'] = true;
        }

        $this->sendResponse($r);
    }

    public function getGrapheAsso($grapheId)
    {
        $q = 'SELECT capteur.id, capteur.name, asso.correction_effect as coeff from oko_asso_capteur_graphe as asso '.
            'LEFT JOIN oko_capteur as capteur ON asso.oko_capteur_id = capteur.id '
            .'WHERE asso.oko_graphe_id='.$grapheId.' ORDER BY asso.position';

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

    public function updateGrapheAsso($s)
    {
        $q = 'UPDATE oko_asso_capteur_graphe SET correction_effect='.$s['coeff'].' where oko_graphe_id='.$s['id_graphe'].' AND '
            .'oko_capteur_id='.$s['id_capteur'];
        $this->log->debug('Class '.__CLASS__.' | '.__FUNCTION__.' | '.$q);

        $r['response'] = false;

        if ($this->query($q)) {
            $r['response'] = true;
        }

        $this->sendResponse($r);
    }

    public function updateGrapheAssoPosition($s)
    {
        $r['response'] = false;
        //si position des autres est = ou sup alors on fait + 1, si position est inf on fait -1
        //on met a jour la position du grpahe selectionné
        $q = 'UPDATE oko_asso_capteur_graphe SET position='.$s['position'].' WHERE oko_graphe_id = '.$s['id_graphe'].' AND oko_capteur_id = '.$s['id_capteur'];
        $this->log->debug('Class '.__CLASS__.' | '.__FUNCTION__.' | '.$q);

        if ($this->query($q)) {
            if ($s['position'] > $s['current']) {
                $q = 'UPDATE oko_asso_capteur_graphe SET position=(position - 1) WHERE position <= '.$s['position'].' AND position > '.$s['current'].' AND oko_graphe_id = '.$s['id_graphe'].' AND oko_capteur_id <> '.$s['id_capteur'];
            } else {
                $q = 'UPDATE oko_asso_capteur_graphe SET position=(position + 1) WHERE position >= '.$s['position'].' AND position < ('.$s['current'].' + 1) AND oko_graphe_id = '.$s['id_graphe'].' AND oko_capteur_id <> '.$s['id_capteur'];
            }
            $this->log->debug('Class '.__CLASS__.' | '.__FUNCTION__.' | '.$q);

            if ($this->query($q)) {
                $r['response'] = true;
            }
        }

        $this->sendResponse($r);
    }

    public function deleteAssoGraphe($s)
    {
        $r['response'] = false;
        //on recupere la position du capteur dans le graphe
        $q = 'SELECT position from oko_asso_capteur_graphe WHERE oko_graphe_id='.$s['id_graphe'].' AND '
            .'oko_capteur_id='.$s['id_capteur'];

        $this->log->debug('Class '.__CLASS__.' | '.__FUNCTION__.' | '.$q);

        $result = $this->query($q);

        if ($result) {
            $res = $result->fetch_object();
            $position = $res->position;

            $q = 'DELETE FROM oko_asso_capteur_graphe WHERE oko_graphe_id='.$s['id_graphe'].' AND '
                .'oko_capteur_id='.$s['id_capteur'];
            $this->log->debug('Class '.__CLASS__.' | '.__FUNCTION__.' | '.$q);

            if ($this->query($q)) {
                $q = 'UPDATE oko_asso_capteur_graphe SET position=(position - 1) WHERE position > '.$position.' AND oko_graphe_id = '.$s['id_graphe'];
                $this->log->debug('Class '.__CLASS__.' | '.__FUNCTION__.' | '.$q);

                if ($this->query($q)) {
                    $r['response'] = true;
                }
            }
        }

        $this->sendResponse($r);
    }

    private function sendResponse($t)
    {
        header('Content-type: text/json');
        echo json_encode($t, JSON_NUMERIC_CHECK);
    }
}
