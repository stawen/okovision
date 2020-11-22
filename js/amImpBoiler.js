/*****************************************************
 * Projet : Okovision - Supervision chaudiere OeKofen
 * Auteur : Stawen Dronek
 * Utilisation commerciale interdite sans mon accord
 ******************************************************/
/* global lang */
$(document).ready(function() {

	/*
	 * Gestion import par http
	 */
	$.api('GET', 'admin.getFileFromChaudiere').done(function(json) {

		if (json.response === true) {

			$("#inwork-remotefile").hide();
			$("#listeFichierFromChaudiere> tbody").html("");
			var i = 0;
			$.each(json.listefiles, function(key, val) {
				//console.log(val.file);
				//$('#select_graphe').append('<option value="' + val.id + '">' + val.name + '</option>');
				$('#listeFichierFromChaudiere > tbody:last').append('<tr> \
				                                                            <td> <a target="_blank" href="' + val.url + '">' + val.file + '</a></td>\
				                                                            <td>  <button type="button" id="fichiercsv_"' + i + ' class="btn btn-primary" ><span class="glyphicon glyphicon-cloud-download" aria-hidden="true"></span></button></td> \
				                                                       </tr>');
				i++;
			});


		}
		else {
			$.growlWarning(lang.error.getFileFromBoiler);
		}
	});
	

	
	
	


	/*
	 * import des fichiers csv distant
	 */

	$("body").on("click", "[id^='fichiercsv']:button", function() {
		var ligne = $(this);
		ligne.find('span').switchClass('glyphicon-cloud-download', 'glyphicon-refresh glyphicon-spin', 0);

		var tab = {
			url: ligne.closest("tr").find("td:nth-child(1)").children('a').attr('href')
		};
		$.api('POST', 'admin.importFileFromChaudiere', tab, true).done(function(json) {

			if (json.response) {
				$.growlValidate(lang.valid.csvImport + " - " + ligne.closest("tr").find("td:nth-child(1)").text());

			}
			else {
				$.growlWarning(lang.error.csvImport);
			}
			ligne.find('span').switchClass('glyphicon-refresh glyphicon-spin', 'glyphicon-cloud-download', 0);


		});


	});

	
});