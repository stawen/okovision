 <?php
 /*
* Projet : Okovision - Supervision chaudiere OeKofen
* Auteur : Stawen Dronek
* Utilisation commerciale interdite sans mon accord
*/

 function getMenu()
 {
     //global $page;
     $page = basename($_SERVER['SCRIPT_NAME']);

     $menu = ['index.php' => [
         'txt' => session::getInstance()->getLabel('lang.text.menu.index'),
         'icon' => 'glyphicon glyphicon-dashboard',
         'logged' => false, ],
         'histo.php' => [
             'txt' => session::getInstance()->getLabel('lang.text.menu.historic'),
             'icon' => 'glyphicon glyphicon-stats',
             'logged' => false, ],
         'rt.php' => [
             'txt' => session::getInstance()->getLabel('lang.text.menu.rt'),
             'icon' => 'glyphicon glyphicon-signal',
             'logged' => true, ],
     ];

     foreach ($menu as $url => $title) {
         if ($title['logged'] && !session::getInstance()->getVar('logged')) {
             continue;
         }
         $active = '';
         if ($page == $url) {
             $active = ' class="active"';
         }
         echo '<li'.$active.'> <a href='.$url.'><span class="'.$title['icon'].'" aria-hidden="true"></span>   '.$title['txt'].'</a></li>';
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
          <ul class="nav navbar-nav top-nav">
            <?php getmenu(); ?>
			<li class="dropdown">
			  <?php if (!session::getInstance()->getVar('logged')) {   ?>
			    <a href="#" data-toggle="modal" data-target="#login-modal"> 
			        <span class="glyphicon glyphicon-user" aria-hidden="true"></span>
			     </a>
			  <?php } else { ?>
                <a href="#" class="dropdown-toggle" data-toggle="dropdown">
                    <span class="glyphicon glyphicon-cog" aria-hidden="true"></span>
                </a>
                <ul class="dropdown-menu">
                    <li class="dropdown-header"><span class="glyphicon glyphicon-edit" aria-hidden="true"></span> <?php echo session::getInstance()->getLabel('lang.text.menu.graphic'); ?></li>
                        <li><a href="gstrapport.php"><?php echo session::getInstance()->getLabel('lang.text.menu.graphic.report'); ?></a></li>
                        
                    <li class="divider"></li>
                   
                        <li class="dropdown-header"><span class="glyphicon glyphicon-download-alt" aria-hidden="true"></span> <?php echo session::getInstance()->getLabel('lang.text.menu.manual'); ?></li>    
                            <?php if (GET_CHAUDIERE_DATA_BY_IP) { ?><li><a href="amImpBoiler.php"><?php echo session::getInstance()->getLabel('lang.text.menu.manual.import.ip'); ?></a></li> <?php } ?>
                            <li><a href="amImpUsb.php"><?php echo session::getInstance()->getLabel('lang.text.menu.manual.import.usb'); ?></a></li>
                            <li><a href="amImportMass.php"><?php echo session::getInstance()->getLabel('lang.text.menu.manual.import.mass'); ?></a></li>
                            <li><a href="amSynthese.php"><?php echo session::getInstance()->getLabel('lang.text.menu.manual.synthese'); ?></a></li>
                    <li class="divider"></li>
                    
                        <li class="dropdown-header"><span class="glyphicon glyphicon-wrench" aria-hidden="true"></span> <?php echo session::getInstance()->getLabel('lang.text.menu.admin'); ?></li>
                            <li><a href="adminParam.php"><?php echo session::getInstance()->getLabel('lang.text.menu.admin.information'); ?></a></li>
                            <li><a href="adminSeason.php"><?php echo session::getInstance()->getLabel('lang.text.menu.admin.season'); ?></a></li>
                            <li><a href="adminEvents.php"><?php echo session::getInstance()->getLabel('lang.text.menu.admin.events'); ?></a></li>
                            <li><a href="adminMatrix.php"><?php echo session::getInstance()->getLabel('lang.text.menu.admin.matrix'); ?></a></li>
                    <li class="divider"></li>
                    
                        <li><a href="about.php"><span class="glyphicon glyphicon-info-sign" aria-hidden="true"></span> <?php echo session::getInstance()->getLabel('lang.text.menu.about'); ?></a></li>
                   
                    
                </ul>
              </li>
              <li class="dropdown">
                <a href="#" class="dropdown-toggle" data-toggle="dropdown">
			        <span class="glyphicon glyphicon-user" aria-hidden="true"></span>
			    </a>
			    <ul class="dropdown-menu">
			        <li><a href="#" data-toggle="modal" data-target="#password-modal"><?php echo session::getInstance()->getLabel('lang.text.menu.password'); ?></a></li>
			        <li><a id="btlogout" href=""><?php echo session::getInstance()->getLabel('lang.text.menu.logout'); ?></a></li>
			    </ul>    
            <?php } ?>    
            </li>
			
           </ul>
		  
		  <div class="navbar-form navbar-right">
		  <?php
            if ('index.php' == $page) {
                //$date = new datetime("now", new DateTimeZone('Europe/Paris'));
                $date = new datetime('now');
                echo '<button type="button" id="date_avant" class="btn btn-primary"><strong><<</strong></button>';
                echo '	<input type="text" id="date_encours" class="form-control" style="width:100px";  value="'.$date->format('d/m/Y').'">';
                //echo '	<input type="text" id="date_encours" class="form-control" style="width:100px";  value="'.date("d/m/Y").'">';
                echo '<button type="button" id="date_apres" class="btn btn-primary"><strong>>></strong></button>';
            }

          ?>
		  </div> 
        </div><!--/.nav-collapse -->
      </div>
    </div>
    
    
    <div class="modal fade" id="login-modal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true" >
    	  <div class="modal-dialog">
    	      <div class="modal-content">    
        	    <div class="modal-header">
    			    <h2>Espace membre</h2>
                </div>
                <div class="modal-body">
                    <form id="formlogin" class="form-signin">
                        <p><label for="inputUser" class="sr-only">Identifiant</label>
                        <input type="text" id="inputUser" class="form-control" placeholder="Identifiant" required autofocus>
                        <label for="inputPassword" class="sr-only">Mot de passe</label>
                        <input type="password" id="inputPassword" class="form-control" placeholder="Mot de passe" required></p>
                        <p><button class="btn btn-lg btn-primary btn-block"id="btlogin">Login</button></p>
                        <br/>
                    </form>
                    
    			</div>
    	    </div>  	
		  </div>
    </div>
    
    <div class="modal fade" id="password-modal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true" >
	  <div class="modal-dialog">
	      <div class="modal-content">    
    	    <div class="modal-header">
			    <h2>Changer mon mot de passe</h2>
            </div>
            <div class="modal-body">
                <form id="formChangePass" class="form">
                    <p><label for="inputPass" class="sr-only">Mot de passe</label>
                    <input type="password" id="inputPass" class="form-control" placeholder="Mot de passe" required autofocus>
                    <label for="inputPassConfirme" class="sr-only">Confirmation</label>
                    <input type="password" id="inputPassConfirm" class="form-control" placeholder="Confirmation" required></p>
                    <p><button class="btn btn-lg btn-primary btn-block"id="btChangePass">Changer</button></p>
                    <br/>
                </form>
                
			</div>
	    </div>  	
	  </div>
    </div>
    
    <br/>