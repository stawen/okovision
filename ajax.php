<?PHP
/*****************************************************
* Projet : Okovision - Supervision chaudiere OeKofen
* Auteur : Stawen Dronek
* Utilisation commerciale interdite sans mon accord
******************************************************/

include_once '_include/data.php'; 
include_once '_include/administration.class.php'; 

function is_ajax() {
  //return isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest';
  return true;
}

if (is_ajax()) {
	$d = new data();
	
	$a = new administration();
	
		if (isset($_GET['type']) && isset($_GET['action']) ){
	
    		switch ($_GET['type']){
    			case "admin":
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
                        case "uploadMatrice":
                        	$a->uploadMatrice($_POST,$_FILES);
                            break;
                        case "getHeaderFromOkoCsv";
                        	$a->getHeaderFromOkoCsv();
                        	break;
    				}
    				break; //
    		}		
	    }

	
	if (isset($_GET['type']) && isset($_GET['date']) ){
	
		switch ($_GET['type']){
			case "ecs":
				$d->getEcs($_GET['date']);
				break;
			case "chauffage":
				$d->getChauffage($_GET['date']);
				break;
			case "temperature":
				$d->getTemperature($_GET['date']);
				break;
			case "indicateur":
				$d->getIndicateur($_GET['date']);
				break;	
		}		
	}
	if (isset($_GET['type']) && ( (isset($_GET['month']) && isset($_GET['year']) ) || isset($_GET['saison']) ) ){
		switch ($_GET['type']){
			case "histo":
				$d->getHistoConsoByMonth($_GET['month'],$_GET['year']);
				break;	
			case "indicmonth":
				$d->getIndicateurByMonth($_GET['month'],$_GET['year']);
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