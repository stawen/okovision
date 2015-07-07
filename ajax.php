<?PHP
include_once('_include/data.php'); 

function is_ajax() {
  return isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest';
}

if (is_ajax()) {
	$d = new data();
	
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
			case "autres":
				$d->getAutres($_GET['date']);
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
		}
	}
	

}

?>