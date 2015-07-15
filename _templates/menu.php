 <?php
 
  $page = basename($_SERVER['SCRIPT_NAME']);
 
 function getMenu(){
	global $page;
	
	$menu = Array(  'index.php' => 'Accueil',
					'histo.php' => 'Historique'
			);	
	
	foreach ($menu as $url => $title){
		$active = '';
		if ($page == $url) $active=' class="active"';
		
		echo '<li'.$active.'><a href='.$url.'>'.$title.'</a></li>';
	}
}

 ?>
 <!-- Fixed navbar -->
    <div class="navbar navbar-inverse navbar-fixed-top" role="navigation">
      <div class="container">
      <div class="navbar-header">
          <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target=".navbar-collapse">
            <span class="sr-only">Toggle navigation</span>
            <span class="icon-bar"></span>
            <span class="icon-bar"></span>
            <span class="icon-bar"></span>
          </button>
          <a class="navbar-brand" href="#">OkoVision</a>
        </div>
        <div class="navbar-collapse collapse">
          <ul class="nav navbar-nav">
            <?php getmenu(); ?>
			
			<li class="dropdown">
                <a href="#" class="dropdown-toggle" data-toggle="dropdown">
                    <span class="glyphicon glyphicon-cog" aria-hidden="true"></span>
                </a>
                <ul class="dropdown-menu" role="menu">
                    <li class="dropdown-header">Gestion des graphiques</li>
                    <li><a href="gstrapport.php">Gestion rapport journalier</a></li>
                    <li class="divider"></li>
                   
                    <li class="dropdown-header">Configuration Equipements</li>
                    <li><a href="gsteqt.php">Gestion des équipements Knx</a></li>
                    <li><a href="gstpgaction.php">Gestion des actions</a></li>
                    <li class="divider"></li>
                   
                    <li class="dropdown-header">Systeme</li>    
                    <li><a href="#">Visualisation du bus Knx</a></li>
                    <li><a href="configuration.php">Configuration</a></li>
                    <li><a href="#">Mise à jour</a></li>
                </ul>
            </li>
			
           </ul>
		  
		  <div class="navbar-form navbar-right">
		  <?php
			if ($page == 'index.php'){
				echo '<button type="button" id="date_avant" class="btn btn-primary"><strong><<</strong></button>';
				echo '	<input type="text" id="date_encours" class="form-control" style="width:100px";  value="'.date("d/m/Y").'">';
				echo '<button type="button" id="date_apres" class="btn btn-primary"><strong>>></strong></button>';
			}
			
          ?>
		  </div> 
        </div><!--/.nav-collapse -->
      </div>
    </div>