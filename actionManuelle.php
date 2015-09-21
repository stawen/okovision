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
    
        <ul class="nav nav-tabs" role="tablist">
        <?php if(GET_CHAUDIERE_DATA_BY_IP){ ?>
            <li role="presentation"><a href="#majip" aria-controls="majip" role="tab" data-toggle="tab"><?php echo session::getLabel('lang.text.menu.manual.import.ip') ?></a></li> 
        <?php } ?>
            <li role="presentation"><a href="#majusb" aria-controls="majusb" role="tab" data-toggle="tab"><?php echo session::getLabel('lang.text.menu.manual.import.usb') ?></a></li>
            <li role="presentation"><a href="#synthese" aria-controls="synthese" role="tab" data-toggle="tab"><?php echo session::getLabel('lang.text.menu.manual.synthese') ?></a></li>
        </ul>
        <div class="tab-content">
            <div role="tabpanel" class="tab-pane" id="majip">
            </br>
            <p><?php echo session::getLabel('lang.text.page.manual.ip.import') ?></p>
            <div id="inwork-remotefile" ><br/><br/><span class="glyphicon glyphicon-refresh glyphicon-spin"></span><?php echo session::getLabel('lang.text.page.manual.workinprogress') ?></div>
                <table id="listeFichierFromChaudiere" class="table table-hover">
                    <thead>
                        <tr>
                            <th class="col-md-10"><?php echo session::getLabel('lang.text.page.manual.ip.filefromboiler') ?></th>
                            <th class="col-md-2"></th>
                        </tr>
                    </thead>
                
                    <tbody>
                    </tbody>
            
                </table>
            
            </div>
            <div role="tabpanel" class="tab-pane" id="majusb">
                <br/>
            	<?php echo session::getLabel('lang.text.page.manual.usb.import') ?>
            	<br/><br/>
            	<div id="selectFile">
	            	<span class="btn btn-success fileinput-button">
				        <i class="glyphicon glyphicon-plus"></i>
				        <span><?php echo session::getLabel('lang.text.page.manual.usb.file') ?></span>
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
				<div id="inwork" style="display: none;"><br/><br/><span class="glyphicon glyphicon-refresh glyphicon-spin"></span><?php echo session::getLabel('lang.text.page.manual.workinprogress') ?></div>
				<div id="complete" style="display: none;"><br/><br/><span class="glyphicon glyphicon-ok" aria-hidden="true"></span><?php echo session::getLabel('lang.text.page.manual.finished') ?></div>
            </div>
            <div role="tabpanel" class="tab-pane" id="synthese">
                <br/>
            	<?php echo session::getLabel('lang.text.page.manual.synthese') ?>
            	<br/><br/>
            	<div id="inwork-synthese" ><br/><br/><span class="glyphicon glyphicon-refresh glyphicon-spin"></span><?php echo session::getLabel('lang.text.page.manual.workinprogress') ?></div>
    			<div class="col-md-12" align="right">
        			<button type="button" id="makeAllSynthese" class="btn btn-xs btn-default">
        				<span class="glyphicon glyphicon-repeat" aria-hidden="true"></span> <?php echo session::getLabel('lang.text.page.manual.synthese.makeall') ?>
        			</button>
        		</div>
                <table id="listeDateWithoutSynthese" class="table table-hover">
                    <thead>
                        <tr>
                            <th class="col-md-10"><?php echo session::getLabel('lang.text.page.manual.synthese.daywithout') ?></th>
                            <th class="col-md-2"></th>
                        </tr>
                    </thead>
                
                    <tbody>
                    </tbody>
            
                </table>
            </div>
        </div>

<?php
include('_templates/footer.php');
?>
<!--appel des scripts personnels de la page -->
    <script src="js/jquery.fileupload.js"></script>
	<script src="js/actionManuelle.js"></script>
    </body>
</html>