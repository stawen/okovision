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
                    <li class="dropdown-header">Graphiques</li>
                    <li><a href="gstrapport.php">Gestion rapports journaliers</a></li>
                    <li class="divider"></li>
                   
                    <li class="dropdown-header">Actions Manuelles</li>    
                    <?php if(GET_CHAUDIERE_DATA_BY_IP){ ?><li><a href="actionManuelle.php#majip">Mise à jour des données (depuis chaudiere)</a></li> <?php } ?>
                    <li><a href="actionManuelle.php#majusb">Mise à jour des données (import)</a></li>
                    <li><a href="actionManuelle.php#synthese">Calcul Synthèse journaliere</a></li>
                    <li class="divider"></li>
                    
                    <li class="dropdown-header">Administration</li>
                    <li><a href="admin.php#infoge">Informations Generales</a></li> <!-- T°C de ref, Gr pellet pour 60 secondes // transfert sur serveur distant // mode debug ? -->
                    <li><a href="admin.php#saisons">Saisons</a></li>
                    <li><a href="admin.php#matrice">Matrice de lecture du CSV</a></li>
                    
                   
                    
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