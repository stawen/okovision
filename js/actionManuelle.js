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
	function getFileFromChaudiere() {
		//$.getJSON("ajax.php?type=admin&action=getFileFromChaudiere" , function(json) {
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
	}

	/*
	$('a[aria-controls="majip"]').on('shown.bs.tab', function (e) {
	    getFileFromChaudiere();
	});
	*/


	/*
	 * import des fichiers csv distant
	 */

	$("body").on("click", "[id^='fichiercsv']:button", function() {
		var ligne = $(this);
		ligne.find('span').switchClass('glyphicon-cloud-download', 'glyphicon-refresh glyphicon-spin', 0);

		var tab = {
			url: ligne.closest("tr").find("td:nth-child(1)").children('a').attr('href')
		};
		/*		
		$.ajax({
			url: 'ajax.php?type=admin&action=importFileFromChaudiere',
			type: 'POST',
			//contentType: 'application/json; charset=utf-8',
			//dataType: 'jsonp',
			data: $.param(tab),
			async: true,
		    success: function(a) {
			    //console.log("success :"+a);
		*/
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

	/*
	 * Gestion import via USB
	 */


	$('a[aria-controls="majusb"]').on('shown.bs.tab', function(e) {

		$('#bar').css('width', '0%');

		$('#selectFile').show();
		$('#inwork').hide();
		$('#complete').hide();
	});


	$('#fileupload').fileupload({

		url: 'ajax.php?type=admin&action=uploadCsv',
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

		//$.getJSON("ajax.php?type=admin&action=importcsv" , function(json) {
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

	/*
	 * Gestion onglet Calcul synthese
	 */
	$('a[aria-controls="synthese"]').on('shown.bs.tab', function(e) {

		getDayWithoutSynthese();

	});


	function getDayWithoutSynthese() {
		//$.getJSON("ajax.php?type=admin&action=getDayWithoutSynthese" , function(json) {
		$.api('GET', 'admin.getDayWithoutSynthese').done(function(json) {

			$("#inwork-synthese").hide();
			$("#listeDateWithoutSynthese> tbody").html("");
			$.each(json.data, function(key, val) {

				var jour = $.datepicker.formatDate('dd/mm/yy', $.datepicker.parseDate('yy-mm-dd', val.jour));

				$('#listeDateWithoutSynthese > tbody:last').append('<tr> \
					                                                            <td> ' + jour + '</a></td>\
					                                                            <td>  <button type="button" class="btn btn-default day" data-day="' + val.jour + '" ><span class="glyphicon glyphicon-repeat" aria-hidden="true"></span></button></td> \
					                                                       </tr>');
			});

		});
	}

	$("body").on("click", ".day", function(b) {
		makeSynthese($(this));
	});

	function makeSynthese(bt) {

		bt.find('span').switchClass('glyphicon-repeat', 'glyphicon-refresh glyphicon-spin', 0);

		//$.getJSON("ajax.php?type=admin&action=makeSyntheseByDay&date=" + bt.data('day') , function(json) {
		$.api('GET', 'admin.makeSyntheseByDay',{date: bt.data('day')}).done(function(json) {

			if (json.response) {
				$.growlValidate(lang.valid.summary);
				getDayWithoutSynthese();
			}
			else {
				$.growlErreur(lang.error.summary);
			}
		});
	}

	$("#makeAllSynthese").click(function() {
		//console.log("ivi");
		var day = [];
		$(".day").each(function() {
			day.push($(this));
		});

		$.each(day, function() {
			makeSynthese($(this));
		});
	});

	getFileFromChaudiere();
	getDayWithoutSynthese();


});