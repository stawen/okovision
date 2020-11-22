/*****************************************************
 * Projet : Okovision - Supervision chaudiere OeKofen
 * Auteur : Stawen Dronek
 * Utilisation commerciale interdite sans mon accord
 ******************************************************/
/* global lang, sessionToken */
$(document).ready(function() {

	

	/*
	 * Gestion import via USB
	 */

	$('#fileupload').fileupload({

		url: 'ajax.php?sid=' + sessionToken + '&type=admin&action=uploadCsv',
		dataType: 'json',
		autoUpload: true,
		acceptFileTypes: /(\.|\/)(csv)$/i,
		maxFileSize: 3000000,
		formData: {
			actionFile: 'majusb'
		},
		start: function(e) {
			//console.log('Uploads started');
			
		},
		done: function(e, data) {
			setTimeout(function() {
				importcsv();

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


	function importcsv() {
		$('#selectFile').hide();
		$('#inwork').show();

		$.api('GET', 'admin.importcsv').done(function(json) {

			if (json.response === true) {
				$('#inwork').hide();
				$('#selectFile').show();
				$.growlValidate(lang.valid.csvImport)
				$('#bar').css('width', '0%');

			}
			else {
				$.growlWarning(lang.error.csvImport);
			}
		});
	}


	
});