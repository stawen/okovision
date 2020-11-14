<?php
/* * Projet : Okovision - Supervision chaudiere OeKofen
* Auteur : Stawen Dronek
* Utilisation commerciale interdite sans mon accord
* */
include_once 'config.php';
include_once '_templates/header.php';
include_once '_templates/menu.php';
?>


	<div class="container theme-showcase" role="main">
		<div class="page-header">
			<h3> <small><?php echo session::getInstance()->getLabel('lang.text.page.repport.title'); ?></small></h3>
		</div>
	
		<div class="col-md-12">
			<button type="button" class="btn btn-xs btn-default" id="openModalAddGraphique" data-toggle="modal" data-target="#modal_graphique">
				<span class="glyphicon glyphicon-plus" aria-hidden="true"></span> <?php echo session::getInstance()->getLabel('lang.text.page.repport.add'); ?>
			</button>
		</div> 
	
		<table id="listeGraphique" class="table table-hover">
			<thead>
				<tr>
					<th class="col-md-2"><?php echo session::getInstance()->getLabel('lang.text.page.repport.table.position'); ?></th>
					<th class="col-md-8"><?php echo session::getInstance()->getLabel('lang.text.page.repport.table.name'); ?></th>
					<th class="col-md-2"></th>
				</tr>
			</thead>
	
			<tbody>
			</tbody>
	
		</table>
	
		<p>&nbsp;</p>
		<div class="page-header">
			<h3> <small><?php echo session::getInstance()->getLabel('lang.text.page.repport.asso.title'); ?></small></h3>
		</div>
		<div class="col-md-6" align="left">
			<button type="button" class="btn btn-xs btn-default" id="openModalAsso" data-toggle="modal" data-target="#modal_asso">
				<span class="glyphicon glyphicon-plus" aria-hidden="true"></span> <?php echo session::getInstance()->getLabel('lang.text.page.repport.asso.add'); ?>
			</button>
		</div>
		<div class="col-md-6" align="right"><?php echo session::getInstance()->getLabel('lang.text.page.repport.asso.filter'); ?>
			<select id="select_graphique">
			</select>
		</div>
	
	
		<table id="listeAsso" class="table table-hover">
			<thead>
				<tr>
					<th class="col-md-2"><?php echo session::getInstance()->getLabel('lang.text.page.repport.asso.table.position'); ?></th>
					<th class="col-md-5"><?php echo session::getInstance()->getLabel('lang.text.page.repport.asso.table.name'); ?></th>
					<th class="col-md-3"><?php echo session::getInstance()->getLabel('lang.text.page.repport.asso.table.coef'); ?></th>
					<th class="col-md-2"></th>
				</tr>
			</thead>
	
			<tbody>
			</tbody>
	
		</table>
	
		<div class="modal fade" id="modal_graphique" tabindex="-1" role="dialog" aria-labelledby="graphiqueLabel" aria-hidden="true">
			<div class="modal-dialog">
				<div class="modal-content">
					<div class="modal-header">
						<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span>
						</button>
						<h4 class="modal-title" id="graphiqueTitre"></h4>
					</div>
					<div class="modal-body">
						<div class="hidden">
							<input type="text" id="typeModal">
							<input type="text" id="grapheId">
							<input type="text" id="position">
						</div>
						<form>
	
							<div class="form-group">
								<label for="recipient-name" class="control-label"><?php echo session::getInstance()->getLabel('lang.text.page.repport.repport.modale.title'); ?></label>
								<input type="text" class="form-control" id="name">
							</div>
	
						</form>
					</div>
					<div class="modal-footer">
						<button type="button" class="btn btn-default btn-sm" data-dismiss="modal">
							<span class="glyphicon glyphicon-remove" aria-hidden="true"></span>
						</button>
						<button type="button" id="addGraphique" class="btn btn-default btn-sm">
							<span class="glyphicon glyphicon-ok" aria-hidden="true"></span>
						</button>
					</div>
				</div>
			</div>
		</div>
	
	
		<div class="modal fade" id="modal_asso" tabindex="-1" role="dialog" aria-labelledby="assoLabel" aria-hidden="true">
			<div class="modal-dialog">
				<div class="modal-content">
					<div class="modal-header">
						<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span>
						</button>
						<h4 class="modal-title" id="assoTitre"><?php echo session::getInstance()->getLabel('lang.text.page.repport.asso.modale.title'); ?></h4>
					</div>
					<div class="modal-body">
						<div class="hidden">
							<input type="text" id="typeModal">
							<input type="text" id="position">
						</div>
						<form>
							<div class="form-group" id="divgroupe">
								<label for="message-text" class="control-label"><?php echo session::getInstance()->getLabel('lang.text.page.repport.asso.modale.graphic'); ?></label>
									<select class="form-control" id="select_graphe">
								</select>
							</div>
							<div class="form-group" id="divcapteur">
								<label for="message-text" class="control-label"><?php echo session::getInstance()->getLabel('lang.text.page.repport.asso.modale.capteur'); ?></label>
									<select class="form-control" id="select_capteur">
								</select>
							</div>
							<div class="form-group">
								<label for="recipient-name" class="control-label"><?php echo session::getInstance()->getLabel('lang.text.page.repport.asso.modale.coef'); ?></label>
								<input type="text" class="form-control" id="coeff" placeholder="ex : 0,25" value="1">
							</div>
						</form>
					</div>
	
					<div class="modal-footer">
						<button type="button" class="btn btn-default btn-sm" data-dismiss="modal">
							<span class="glyphicon glyphicon-remove" aria-hidden="true"></span>
						</button>
						<button type="button" id="addAsso" class="btn btn-default btn-sm">
							<span class="glyphicon glyphicon-ok" aria-hidden="true"></span>
						</button>
					</div>
				</div>
			</div>
		</div>
	
		<div class="modal fade" id="confirm-delete" tabindex="-1" role="dialog" aria-labelledby="deleteLabel" aria-hidden="true">
			<div class="modal-dialog">
				<div class="modal-content">
					<div class="modal-header">
						<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span>
						</button>
						<h4 class="modal-title" id="deleteTitre"></h4>
					</div>
					<div class="hidden">
						<input type="text" id="deleteid">
						<input type="text" id="typeModal">
					</div>
					<div class="modal-footer">
						<button type="button" class="btn btn-default" data-dismiss="modal"><?php echo session::getInstance()->getLabel('lang.text.modal.cancel'); ?></button>
						<button type="button" class="btn btn-danger btn-ok" id="deleteConfirm"><?php echo session::getInstance()->getLabel('lang.text.modal.confirm'); ?></button>
					</div>
				</div>
			</div>
		</div>


	<?php include __DIR__.'/_templates/footer.php'; ?>
	<!--appel des scripts personnels de la page -->
	<script src="js/gstrapport.js"></script>
	</body>

</html>
