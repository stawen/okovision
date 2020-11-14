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
         <h2><?php echo session::getInstance()->getLabel( 'lang.text.menu.admin.matrix') ?></h2>
    </div>
       
            
	<?php echo session::getInstance()->getLabel('lang.text.page.matrix') ?>
	<br/><br/>
	<div id="selectFile" style="display: none;">
		<?php echo session::getInstance()->getLabel('lang.text.page.matrix.install') ?>
    	<span class="btn btn-success fileinput-button">
	        <i class="glyphicon glyphicon-plus"></i>
	        <span id="btup"><?php echo session::getInstance()->getLabel('lang.text.page.matrix.upload') ?></span>
	        <!-- The file input field used as target for the file upload widget -->
	        <input id="fileupload" type="file" name="files[]">
	    </span>
	    <br/><br/>
	    <!-- The global progress bar -->
	   <div class="progress">
  			<div id="bar" class="progress-bar progress-bar-success" role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100"></div>
		</div>
	</div>
	<div id="concordance">
	    <table id="headerCsv" class="table table-hover">
            <thead>
                <tr>
                    <th class="col-md-3"><?php echo session::getInstance()->getLabel('lang.text.page.matrix.original') ?></th>
                    <th class="col-md-3"><?php echo session::getInstance()->getLabel('lang.text.page.matrix.name') ?></th>
                    <th class="col-md-2 text-center"><?php echo session::getInstance()->getLabel('lang.text.page.matrix.rt') ?></th>
                    <th class="col-md-3"></th>
                    <th class="col-md-1">
                    	<button type="button" id="updateMatrix" class="btn btn-xs btn-default" data-toggle="modal" data-target="#confirm-updateMatrix">
			            	<span class="glyphicon glyphicon-download-alt" aria-hidden="true"></span>
		            	</button>
		            	<button type="button" id="deleteMatrix" class="btn btn-xs btn-default" data-toggle="modal" data-target="#confirm-deleteMatrix">
			            	<span class="glyphicon glyphicon-trash" aria-hidden="true"></span>
		            	</button>
                    </th>
                    
                </tr>
            </thead>
        
            <tbody>
            </tbody>

        </table>
	<div>
    
    <div class="modal fade" id="confirm-updateMatrix" tabindex="-1" role="dialog" aria-labelledby="UpdateMatrix" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span>
                    </button>
                    <h4 class="modal-title"><?php echo session::getInstance()->getLabel('lang.text.page.matrix.modal.title') ?></h4>
                </div>
                <div class="modal-body">
                    <?php echo session::getInstance()->getLabel('lang.text.page.matrix.modal.text') ?>
               </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-default" data-dismiss="modal"><?php echo session::getInstance()->getLabel('lang.text.modal.cancel') ?></button>
                    <button type="button" class="btn btn-danger btn-ok" id="updateConfirm"><?php echo session::getInstance()->getLabel('lang.text.modal.confirm') ?></button>
                </div>
            </div>
        </div>
    </div> 
    
    <div class="modal fade" id="confirm-deleteMatrix" tabindex="-1" role="dialog" aria-labelledby="DeleteMatrix" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span>
                    </button>
                    <h4 class="modal-title"><?php echo session::getInstance()->getLabel('lang.text.page.matrix.delete.modal.title') ?></h4>
                </div>
                <div class="modal-body">
                    <?php echo session::getInstance()->getLabel('lang.text.page.matrix.delete.modal.text') ?>
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
    <script src="js/jquery/jquery.fileupload.js"></script>
	<script src="js/adminMatrix.js"></script>
    </body>
</html>
