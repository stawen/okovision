 <?php
 /*****************************************************
* Projet : Okovision - Supervision chaudiere OeKofen
* Auteur : Stawen Dronek
* Utilisation commerciale interdite sans mon accord
******************************************************/

  $page = basename($_SERVER['SCRIPT_NAME']);
 
 function getMenu(){
	global $page;
	
	$menu = Array(  'index.php' => session::getLabel('lang.text.menu.index'),
					'histo.php' => session::getLabel('lang.text.menu.historic')
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
                    <li class="dropdown-header"><?php echo session::getLabel('lang.text.menu.graphic') ?></li>
                        <li><a href="gstrapport.php"><?php echo session::getLabel('lang.text.menu.graphic.report') ?></a></li>
                    <li class="divider"></li>
                   
                        <li class="dropdown-header"><?php echo session::getLabel('lang.text.menu.manual') ?></li>    
                            <?php if(GET_CHAUDIERE_DATA_BY_IP){ ?><li><a href="amImpBoiler.php"><?php echo session::getLabel('lang.text.menu.manual.import.ip') ?></a></li> <?php } ?>
                            <li><a href="amImpUsb.php"><?php echo session::getLabel('lang.text.menu.manual.import.usb') ?></a></li>
                            <li><a href="amImportMass.php"><?php echo session::getLabel('lang.text.menu.manual.import.mass') ?></a></li>
                            <li><a href="amSynthese.php"><?php echo session::getLabel('lang.text.menu.manual.synthese') ?></a></li>
                    <li class="divider"></li>
                    
                        <li class="dropdown-header"><?php echo session::getLabel('lang.text.menu.admin') ?></li>
                            <li><a href="adminParam.php"><?php echo session::getLabel('lang.text.menu.admin.information') ?></a></li>
                            <li><a href="adminSeason.php"><?php echo session::getLabel('lang.text.menu.admin.season') ?></a></li>
                            <li><a href="adminMatrix.php"><?php echo session::getLabel('lang.text.menu.admin.matrix') ?></a></li>
                    <li class="divider"></li>
                    
                        <li><a href="about.php"><?php echo session::getLabel('lang.text.menu.about') ?></a></li>
                   
                    
                </ul>
            </li>
			
           </ul>
		  
		  <div class="navbar-form navbar-right">
		  <?php
			if ($page == 'index.php'){
			    $date = new datetime("now", new DateTimeZone('Europe/Paris'));
		        echo '<button type="button" id="date_avant" class="btn btn-primary"><strong><<</strong></button>';
				echo '	<input type="text" id="date_encours" class="form-control" style="width:100px";  value="'.$date->format("d/m/Y").'">';
				echo '<button type="button" id="date_apres" class="btn btn-primary"><strong>>></strong></button>';
			}
			
          ?>
		  </div> 
        </div><!--/.nav-collapse -->
      </div>
    </div>
    <br/>