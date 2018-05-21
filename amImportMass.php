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
        <div class="page-header"> 
            <h2><?php echo session::getInstance()->getLabel( 'lang.text.page.import.title') ?></h2>
        </div>
        <div class="well">
		    <?php echo session::getInstance()->getLabel( 'lang.text.page.import.action') ?>
	    </div>
	    <button type="button" id="bt_import" class="btn btn-xs btn-default" >
			<span class="glyphicon glyphicon-cloud-download" aria-hidden="true"></span>
			<?php echo session::getInstance()->getLabel( 'lang.text.page.import.bt') ?>
		</button>
		<div id="inwork-makeupdate" style="display: none;">
			<br/>
			<br/><span class="glyphicon glyphicon-refresh glyphicon-spin"></span>
			<?php echo session::getInstance()->getLabel( 'lang.text.page.import.inprogress') ?>
		</div>
    
        <table id="listeFichierImport" class="table table-hover">
            <thead>
                <tr>
                    <th class="col-md-10"><?php echo session::getInstance()->getLabel( 'lang.text.page.import.table.title') ?></th>
                    <th class="col-md-2"></th>
                </tr>
            </thead>
        
            <tbody>
            </tbody>
    
        </table>
    
    </div>

<?php
include(__DIR__ . '/_templates/footer.php');
?>
<!--appel des scripts personnels de la page -->
	<script src="js/amImportMass.js"></script>
	</body>
</html>
