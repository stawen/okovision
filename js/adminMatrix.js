/*****************************************************
 * Projet : Okovision - Supervision chaudiere OeKofen
 * Auteur : Stawen Dronek
 * Utilisation commerciale interdite sans mon accord
 ******************************************************/
/* global lang */

$(document).ready(function() {

	

	/*
	 * Espace Matrice CSV
	 */

	$('#fileupload').fileupload({

		url: 'ajax.php?type=admin&action=uploadCsv',
		dataType: 'json',
		autoUpload: true,
		acceptFileTypes: /(\.|\/)(csv)$/i,
		maxFileSize: 3000000,
		formData: {
			actionFile: 'matrice'
		},
		start: function(e) {
			//console.log('Uploads started');
		},
		done: function(e, data) {
			//console.log("e:"+e);
			//console.log("data:"+ data);
			setTimeout(function() {
				$("#selectFile").hide();
				makeMatrice();
			}, 1000);

		},
		progress: function(e, data) {
			var progress = parseInt(data.loaded / data.total * 100, 10);
			//console.log('ici::'+ progress);
			$('#bar').css(
				'width',
				progress + '%'
			);
		}
	});

	function makeMatrice() {

		$.api('GET', 'admin.getHeaderFromOkoCsv').done(function(json) {

			if (json.response) {
				$("#headerCsv > tbody").html("");

				$.each(json.data, function(key, val) {
					//console.log(val);
					$('#headerCsv > tbody:last').append('<tr> \
				                                        	<td>' + val.original_name + '</td>\
				                                        	<td>' + val.name + '</td>\
				                                        	<td>' + ((val.type != "") ? '<span class="glyphicon glyphicon-lock" aria-hidden="true"></span>' : '') + '</td>\
				                                        </tr>');
				});

				$("#concordance").show();

			}
			else {
				$.growlWarning(lang.error.csvNotFound);
			}
		});

	}



	
	if ($.matriceComplet()) {
		makeMatrice();
	}
	else {
		$("#selectFile").show();
		$("#concordance").hide();
	}


});