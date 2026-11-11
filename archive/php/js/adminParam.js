/*****************************************************
 * Projet : Okovision - Supervision chaudiere OeKofen
 * Auteur : Stawen Dronek
 * Utilisation commerciale interdite sans mon accord
 ******************************************************/
/* global lang, $ */

$(document).ready(function() {

	/*
	 * Espace Information general
	 */

	$("#oko_typeconnect").change(function() {
		
		if ($(this).val() == 1) {
			$("#form-ip").show();
		}
		else {
			$("#form-ip").hide();
		}
	});

	$('#test_oko_ip').click(function() {


		//if(/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test($('#oko_ip').val())){

		var ip = $('#oko_ip').val();

		$.api('GET', 'admin.testIp', {
			ip: ip
		}).done(function(json) {

			if (json.response) {
				$('#url_csv').html("");
				$.growlValidate(lang.valid.communication);
				$('#url_csv').append('<a target="_blank" href="' + json.url + '">' + lang.text.seeFileOnboiler + '</a>');
			}
			else {
				$.growlWarning(lang.error.ipNotPing);
			}
		});

		/*    
		}else{
		    $.growlErreur('Adresse Ip Invalide !');
		}
		*/
	});
        
	$("#oko_loadingmode").change(function() {

		if ($(this).val() == 1) {
			$("#form-silo-details").show();
		}
		else {
			$("#form-silo-details").hide();
		}
	});
        
	$('#bt_save_infoge').click(function() {

		var tab = {
			oko_ip: $('#oko_ip').val(),
			param_tcref: $('#param_tcref').val(),
			param_poids_pellet: $('#param_poids_pellet').val(),
			surface_maison: $('#surface_maison').val(),
			oko_typeconnect: $('#oko_typeconnect').val(),
			timezone: $("#timezone").val(),
			send_to_web: 0,
            has_silo: $('#oko_loadingmode').val(),
            silo_size: $('#oko_silo_size').val(),
			ashtray : $('#oko_ashtray').val(),
			lang : $('input[name=oko_language]:checked').val()
		};
		
		$.api('POST', 'admin.saveInfoGe', tab, false).done(function(json) {
			//console.log(a);
			if (json.response) {
				$.growlValidate(lang.valid.configSave);
				setTimeout(function() {
					document.location.reload();
				  }, 1000);
				
			}
			else {
				$.growlWarning(lang.error.configNotSave);
			}
		});

	});

	


});