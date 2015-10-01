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
         <h2><?php echo session::getLabel( 'lang.text.menu.admin.matrix') ?></h2>
    </div>
       
            
	<?php echo session::getLabel('lang.text.page.matrix') ?>
	<br/><br/>
	<div id="selectFile" style="display: none;">
    	<span class="btn btn-success fileinput-button">
	        <i class="glyphicon glyphicon-plus"></i>
	        <span><?php echo session::getLabel('lang.text.page.matrix.upload') ?></span>
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
	<div id="concordance">
	    <table id="headerCsv" class="table table-hover">
            <thead>
                <tr>
                    <th class="col-md-3"><?php echo session::getLabel('lang.text.page.matrix.original') ?></th>
                    <th class="col-md-3"><?php echo session::getLabel('lang.text.page.matrix.name') ?></th>
                    <th class="col-md-6"></th>
                    
                </tr>
            </thead>
        
            <tbody>
            </tbody>

        </table>
	<div>
            


<?php
include('_templates/footer.php');
?>
    <script src="js/jquery.fileupload.js"></script>
	<script src="js/adminMatrix.js"></script>
    </body>
</html>