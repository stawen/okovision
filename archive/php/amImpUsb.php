<?php
/*****************************************************
* Projet : Okovision - Supervision chaudiere OeKofen
* Auteur : Stawen Dronek
* Utilisation commerciale interdite sans mon accord
******************************************************/

	include_once 'config.php';
	include_once '_templates/header.php';
	include_once '_templates/menu.php';

?>
<div class="container theme-showcase" role="main">
<br/>
    <div class="page-header" >
    
        <h2><?php echo session::getInstance()->getLabel( 'lang.text.menu.manual.import.usb') ?></h2>
    </div>    
       
    	<?php echo session::getInstance()->getLabel('lang.text.page.manual.usb.import') ?>
    	<br/><br/>
    	<div id="selectFile">
        	<span class="btn btn-success fileinput-button">
    	        <i class="glyphicon glyphicon-plus"></i>
    	        <span><?php echo session::getInstance()->getLabel('lang.text.page.manual.usb.file') ?></span>
    	        <!-- The file input field used as target for the file upload widget -->
    	        <input id="fileupload" type="file" name="files[]">
    	    </span>
    	    <br/><br/>
    	    <!-- The global progress bar -->
    	   <div class="progress">
      			<div id="bar" class="progress-bar progress-bar-success" role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100">
    				
      			</div>
    		</div>
    	</div>
	
    	<div id="inwork" style="display: none;"><br/><br/><span class="glyphicon glyphicon-refresh glyphicon-spin"></span><?php echo session::getInstance()->getLabel('lang.text.page.manual.workinprogress') ?></div>
    	<div id="complete" style="display: none;"><br/><br/><span class="glyphicon glyphicon-ok" aria-hidden="true"></span><?php echo session::getInstance()->getLabel('lang.text.page.manual.finished') ?></div>
    </div>
            
       

<?php
include(__DIR__ . '/_templates/footer.php');
?>
<!--appel des scripts personnels de la page -->
    <script src="js/jquery/jquery.fileupload.js"></script>
	<script src="js/amImpUsb.js"></script>
    </body>
</html>
