<?php
	
	function is_ajax() {
	  return isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest';
	}
	
	function testBddConnection($s){
		$db = new mysqli($s['db_adress'], $s['db_user'], $s['db_password'], 'mysql');
		$r = true;
		
		if ($db->connect_errno) {
		   $r=false;
		}
		
		$t['response'] = $r;
        header("Content-type: text/json");
		echo json_encode($t, JSON_NUMERIC_CHECK);
		exit;
	}
	
	if (is_ajax()) {
		
		if (isset($_GET['type'])  ){
		
			switch ($_GET['type']){
				case "connect":
					testBddConnection($_POST);
					break;
				
			}		
		}
		
		
	
	}
	
?>

<?php
	include('_templates/header.php');
?>
<div class="container theme-showcase" role="main">
		<div class="page-header" align="center">
			<h2>Installation Okovision</h2> <br>
		</div>
		<div>
			<h2><small>Vous allez renseigner les informations necessaires pour le stockage de vos données, ainsi que les premiers elements liés à votre installation</small></h2>
			<h3><small>Vous pourrez modifier ces informations, après l'installation, via l'écran de parametres</small></h3>
			<p>(*) Obligatoire </p> 
		</div>
		
		
				<fieldset>
						<form class="form-horizontal">
				<!-- Form Name -->
					<legend>Connexion à votre base de donnée</legend>
					
					<!-- Text input-->
					<div class="form-group">
					  <label class="col-md-4 control-label" for="db_adress">Adresse de la base (*) :</label>  
					  <div class="col-md-3">
					  <input id="db_adress" name="db_adress" type="text" placeholder="ex : localhost, 192.168.xxx.xxx" class="form-control input-md" required="">
					  <span class="help-block"></span>  
					  </div>
					</div>
					
					<!-- Text input-->
					<div class="form-group">
					  <label class="col-md-4 control-label" for="db_user">Utilisateur de connexion (*) :</label>  
					  <div class="col-md-3">
					  <input id="db_user" name="db_user" type="text" placeholder="ex: root" class="form-control input-md" required="">
					  </div>
					</div>
					
					<!-- Text input-->
					<div class="form-group">
					  <label class="col-md-4 control-label" for="db_password">Mot de passe (*) :</label>  
					  <div class="col-md-3">
					  <input id="db_password" name="db_password" type="text" placeholder="ex : toor" class="form-control input-md" required="">
					  </div>
					</div>
					
					<!-- Button -->
					
					  
					
				</form>
				<label class="col-md-4 control-label" for="bt_testConnection">Tester la connexion :</label>
					  <div class="col-md-3">
					    <button id="bt_testConnection" name="bt_testConnection" class="btn btn-primary" type="submit">Connect</button>
					  </div>
				</fieldset>
				

			<form class="form-horizontal">
				<fieldset>
				
				<!-- Form Name -->
					<legend>Communication avec votre chaudiere</legend>
					
					<!-- Select Basic -->
					<div class="form-group">
					  <label class="col-md-4 control-label" for="oko_typeconnect">Mode de récupération du fichier CSV</label>
					  <div class="col-md-3">
					    <select id="oko_typeconnect" name="oko_typeconnect" class="form-control">
					      <option value="1">IP</option>
					      <option value="0">USB</option>
					    </select>
					  </div>
					</div>
					
					<!-- Text input-->
					<div class="form-group">
					  <label class="col-md-4 control-label" for="oko_ip">Adresse IP de votre chaudière :</label>  
					  <div class="col-md-3">
					  <input id="oko_ip" name="oko_ip" type="text" placeholder="ex : 192.168.0.xx" class="form-control input-md">
					  
					  </div>
					</div>
				
				</fieldset>
			</form>

			<form class="form-horizontal">
				<fieldset>
				
				<!-- Form Name -->
					<legend>Parametrage de l'application</legend>
					
					<!-- Text input-->
					<div class="form-group">
					  <label class="col-md-4 control-label" for="param_tcref">T°C de reference :</label>  
					  <div class="col-md-3">
					  <input id="param_tcref" name="param_tcref" type="text" placeholder="ex : 20" class="form-control input-md" required="">
					  <span class="help-block">Si vous avez 2 consignes, réduit à 19 et confort à 21, vous faites la moyenne -&gt; 20</span>  
					  </div>
					</div>
					
					<!-- Text input-->
					<div class="form-group">
					  <label class="col-md-4 control-label" for="param_poids_pellet">Poids pellet pour 60 secondes de vis : </label>  
					  <div class="col-md-3">
					  <input id="parap_poids_pellet" name="param_poids_pellet" type="text" placeholder="ex : 150" class="form-control input-md" required="">
					  <span class="help-block">Poids de pellet mesuré par un fonctionnement de la vis d'alimentation du foyer pendant 60 secondes</span>  
					  </div>
					</div>
					
					<!-- Text input-->
					<div class="form-group">
					  <label class="col-md-4 control-label" for="parap_poids_pellet">Surface de la maison : </label>  
					  <div class="col-md-3">
					  <input id="parap_poids_pellet" name="param_surface" type="text" placeholder="ex : 180" class="form-control input-md" required="">
					  <span class="help-block">en m²</span>  
					  </div>
					</div>
				
				</fieldset>
			</form>


<?php
include('_templates/footer.php');
?>
<!--appel des scripts personnels de la page -->
	<script src="js/setup.js"></script>
    </body>
</html>