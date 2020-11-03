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
        <h2><?php echo session::getInstance()->getLabel( 'lang.text.menu.manual.synthese') ?></h2>
    </div>   
    
	<?php echo session::getInstance()->getLabel('lang.text.page.manual.synthese') ?>
	<br/><br/>
	<div id="inwork-synthese" ><br/><br/><span class="glyphicon glyphicon-refresh glyphicon-spin"></span><?php echo session::getInstance()->getLabel('lang.text.page.manual.workinprogress') ?></div>
	
    <table id="listeDateWithoutSynthese" class="table table-hover">
        <thead>
            <tr>
                <th class="col-md-9"><?php echo session::getInstance()->getLabel('lang.text.page.manual.synthese.daywithout') ?></th>
                <th class="col-md-3">
                    <button type="button" id="openModalgetPeriode" class="btn btn-xs btn-default" data-toggle="modal" data-target="#modal_getPeriode">
			            <span class="glyphicon glyphicon-calendar" aria-hidden="true"></span>
		            </button>
                    <button type="button" id="makeAllSynthese" class="btn btn-xs btn-default">
			            <span class="glyphicon glyphicon-repeat" aria-hidden="true"></span> <?php echo session::getInstance()->getLabel('lang.text.page.manual.synthese.makeall') ?>
		            </button>
		        </th>
            </tr>
        </thead>
    
        <tbody>
        </tbody>

    </table>
    
    <div class="modal fade" id="modal_getPeriode" tabindex="-1" role="dialog" aria-labelledby="periodeLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                    <h4 class="modal-title"><?php echo session::getInstance()->getLabel('lang.text.page.manual.synthese.modal.title') ?></h4>
                </div>
                <div class="modal-body">
                    <form>
                        <div class="form-group">
                            <label for="recipient-name" class="control-label"><?php echo session::getInstance()->getLabel('lang.text.page.manual.synthese.modal.dateStart') ?></label>
                            <input type="text" class="form-control datepicker" id="dateStart" placeholder="ex : 01/09/2014">
                        </div>
                        <div class="form-group">
                            <label for="recipient-name" class="control-label"><?php echo session::getInstance()->getLabel('lang.text.page.manual.synthese.modal.dateEnd') ?></label>
                            <input type="text" class="form-control datepicker" id="dateEnd" placeholder="ex : 01/09/2014">
                        </div>
                        
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-default btn-sm" data-dismiss="modal">
                        <span class="glyphicon glyphicon-remove" aria-hidden="true"></span>
                    </button>
                    <button type="button" id="confirmPeriode" class="btn btn-default btn-sm">
                        <span class="glyphicon glyphicon-ok" aria-hidden="true"></span>
                    </button>
                </div>
            </div>
        </div>
    </div>  

<?php
include(__DIR__ . '/_templates/footer.php');
?>
<!--appel des scripts personnels de la page -->
    <script src="_langs/<?php echo session::getInstance()->getLang() ?>.datepicker.js"></script>
	<script src="js/amSynthese.js"></script>
	
    </body>
</html>
