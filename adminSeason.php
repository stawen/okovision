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
         <h2><?php echo session::getInstance()->getLabel( 'lang.text.menu.admin.season') ?></h2>
    </div>    
       
	<?php echo session::getInstance()->getLabel('lang.text.page.season') ?>
	
	<br/><br/>
	<button type="button" class="btn btn-xs btn-default" id="openModalAddSaison" data-toggle="modal" data-target="#modal_saison">
        <span class="glyphicon glyphicon-plus" aria-hidden="true"></span> <?php echo session::getInstance()->getLabel('lang.text.page.season.add') ?>
    </button>
    <table id="saisons" class="table table-hover">
        <thead>
            <tr >
                <th class="col-md-3"><?php echo session::getInstance()->getLabel('lang.text.page.season.title') ?></th>
                <th class="col-md-3"><?php echo session::getInstance()->getLabel('lang.text.page.season.start') ?></th>
                <th class="col-md-3"><?php echo session::getInstance()->getLabel('lang.text.page.season.end') ?></th>
                <th class="col-md-3"></th>
                
            </tr>
        </thead>
    
        <tbody>
        </tbody>

    </table>
    
    <div class="modal fade" id="modal_saison" tabindex="-1" role="dialog" aria-labelledby="saisonLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                    <h4 class="modal-title" id="GraphiqueTitre"></h4>
                </div>
                <div class="modal-body">
                    <div class="hidden">
                        <input type="text" id="saisonId">
                        <input type="text" id="typeModal">
                    </div>
                    <form>

                        <div class="form-group">
                            <label for="recipient-name" class="control-label"><?php echo session::getInstance()->getLabel('lang.text.page.season.modal.end') ?></label>
                            <input type="text" class="form-control" id="startDateSaison" placeholder="ex : 01/09/2014">
                        </div>
                        
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-default btn-sm" data-dismiss="modal">
                        <span class="glyphicon glyphicon-remove" aria-hidden="true"></span>
                    </button>
                    <button type="button" id="confirm" class="btn btn-default btn-sm">
                        <span class="glyphicon glyphicon-ok" aria-hidden="true"></span>
                    </button>
                </div>
            </div>
        </div>
    </div>
    
    
    <div class="modal fade" id="confirm-delete" tabindex="-1" role="dialog" aria-labelledby="deleteSaison" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span>
                    </button>
                    <h4 class="modal-title" id="deleteTitre"></h4>
                </div>
                <div class="hidden">
                    <input type="text" id="saisonId">
               </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-default" data-dismiss="modal"><?php echo session::getInstance()->getLabel('lang.text.modal.cancel') ?></button>
                    <button type="button" class="btn btn-danger btn-ok" id="deleteConfirm"><?php echo session::getInstance()->getLabel('lang.text.modal.confirm') ?></button>
                </div>
            </div>
        </div>
    </div>
        
                
                
                
                
            


<?php
include(__DIR__ . '/_templates/footer.php');
?>
	<script src="js/adminSeason.js"></script>
    </body>
</html>
