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
        <h2><?php echo session::getLabel( 'lang.text.menu.manual.synthese') ?></h2>
    </div>   
    
	<?php echo session::getLabel('lang.text.page.manual.synthese') ?>
	<br/><br/>
	<div id="inwork-synthese" ><br/><br/><span class="glyphicon glyphicon-refresh glyphicon-spin"></span><?php echo session::getLabel('lang.text.page.manual.workinprogress') ?></div>
	
    <table id="listeDateWithoutSynthese" class="table table-hover">
        <thead>
            <tr>
                <th class="col-md-10"><?php echo session::getLabel('lang.text.page.manual.synthese.daywithout') ?></th>
                <th class="col-md-2">
                    <button type="button" id="makeAllSynthese" class="btn btn-xs btn-default">
			            <span class="glyphicon glyphicon-repeat" aria-hidden="true"></span> <?php echo session::getLabel('lang.text.page.manual.synthese.makeall') ?>
		            </button>
		        </th>
            </tr>
        </thead>
    
        <tbody>
        </tbody>

    </table>
      

<?php
include('_templates/footer.php');
?>
<!--appel des scripts personnels de la page -->
    <script src="js/jquery.fileupload.js"></script>
	<script src="js/amSynthese.js"></script>
    </body>
</html>