<?PHP
/*****************************************************
* Projet : Okovision - Supervision chaudiere OeKofen
* Auteur : Stawen Dronek
* Utilisation commerciale interdite sans mon accord
******************************************************/

include_once 'config.php';

function is_ajax() {
  //return isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest';
  return true;
}

if (is_ajax()) {
	
		if (isset($_GET['type']) && isset($_GET['action']) ){
			
			
    		switch ($_GET['type']){
    			case "admin":
    				$a = new administration();
    				
    				switch ($_GET['action']){
    				    case "testIp":
    				        if( isset( $_GET['ip'] ) ){
    				            $a->ping($_GET['ip']);
    				        }
    				        break; 
    				    case "saveInfoGe":
    				        $a->saveInfoGenerale($_POST);
    				        break;
    				    case "getFileFromChaudiere":
    				        $a->getFileFromChaudiere();
    				        break; 
                        case "importFileFromChaudiere":
                            $a->importFileFromChaudiere($_POST);
                            break;
                        case "importFileFromUpload":
                            $a->importFileFromUpload($_POST);
                            break;
                        case "uploadCsv":
                        	$a->uploadCsv($_POST,$_FILES);
                            break;
                        case "getHeaderFromOkoCsv":
                        	$a->getHeaderFromOkoCsv();
                        	break;
                        case "statusMatrice":
                        	$a->statusMatrice();
                        	break;
                        case "importcsv":
                        	$a->importcsv();
                        	break;
                        case "getSaisons":
                        	$a->getSaisons();
                        case "existSaison":
                        	if( isset( $_GET['date'] ) ){
                        		$a->existSaison($_GET['date']);
                        	}
                        	break;
                        case "setSaison":
                        	$a->setSaison($_POST);
                        	break;
                        case "deleteSaison":
                        	$a->deleteSaison($_POST);
                        	break;
                        case "updateSaison":
                        	$a->updateSaison($_POST);
                        	break;
                        case "makeSyntheseByDay":
                            $a->makeSyntheseByDay($_GET['date']);
                            break;
                        case "getDayWithoutSynthese":
                            $a->getDayWithoutSynthese();
                            break;
    				}
    				break; //
    			case "graphique":
    				$g = new gstGraphique();
    				
    				switch ($_GET['action']){
    					case "getLastGraphePosition":
    						$g->getLastGraphePosition();
    						break;
    					case "grapheNameExist":
    						if( isset( $_GET['name'] ) ){
    							$g->grapheNameExist($_GET['name']);
    						}
    						break;
    					case "addGraphe":
    						$g->addGraphe($_POST);
    						break;
    				    case "getGraphe":
    				    	$g->getGraphe();
    				    	break;
    				    case "updateGraphe":
    				    	$g->updateGraphe($_POST);
    				    	break;
    				    case "deleteGraphe":
    				    	$g->deleteGraphe($_POST);
    				    	break;
    				    case "getCapteurs":	
    				    	$g->getCapteurs();
    				    	break;
    				    case "grapheAssoCapteurExist":
    				    	$g->grapheAssoCapteurExist($_GET['graphe'],$_GET['capteur']);
    				    	break;
    				    case "addGrapheAsso":
    				    	$g->addGrapheAsso($_POST);
    				    	break;
    				    case "getGrapheAsso":
    				    	$g->getGrapheAsso($_GET['graphe']);
    				    	break;
    				    case "updateGrapheAsso":
    				    	$g->updateGrapheAsso($_POST);
    				    	break;
    				    case "deleteAssoGraphe":
    				    	$g->deleteAssoGraphe($_POST);
    				    	break;
    				    	
    				}
    				break;
    			case "rendu":
    			    $r = new rendu();
    				switch ($_GET['action']){
    				    case "getGraphe":
    						$g = new gstGraphique();
    						$g->getGraphe();
    						break;
    					case "getGrapheData":
    						$r->getGrapheData($_GET['id'],$_GET['jour']);
    						break;
    					case "getIndicByDay":
    					    $r->getIndicByDay($_GET['jour']);
    					    break;
    					case "getIndicByMonth":
    					    $r->getIndicByMonth($_GET['month'],$_GET['year']); 
    					    break;
    					case "getHistoByMonth":
    					    $r->getHistoByMonth($_GET['month'],$_GET['year']);
    					    break;
    					case "getTotalSaison":
    					    $r->getTotalSaison($_GET['saison']);
    					    break;
    					 case "getSyntheseSaison":
    					    $r->getSyntheseSaison($_GET['saison']);
    					    break;
    				
    				}
    				break;
    		}		
	    }

	
	
	if (isset($_GET['type']) && ( (isset($_GET['month']) && isset($_GET['year']) ) || isset($_GET['saison']) ) ){
		$d = new data();
	
		switch ($_GET['type']){
			case "histo":
				$d->getHistoConsoByMonth();
				break;	
		    case "totalsaison":
				$d->getTotalConsoSaison($_GET['saison']);
				break;
			case "synthese":
				$d->getSyntheseSaison($_GET['saison']);
				break;
		}
	}
	

}

?>