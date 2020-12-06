/*****************************************************
 * Projet : Okovision - Supervision chaudiere OeKofen
 * Auteur : Stawen Dronek
 * Utilisation commerciale interdite sans mon accord
 ******************************************************/
/* global lang, Highcharts, sessionToken, $ */
$(document).ready(function() {

	$(".tip").tooltip({
    	placement: "right",
    	html: true
	});
	
	$.growlUpdateAvailable = function() {
		$.notify({
			icon: 'glyphicon glyphicon-thumbs-up',
			message: lang.text.updateAvailable,
			// url: "about.php",
			// target: "_self"
		}, {
			z_index: 9999,
			type: 'info',
			placement: {
				from: "bottom",
				align: "right"
			},
			delay: 120000
		});
	};

	$.growlValidate = function(text) {
		$.notify({
			icon: 'glyphicon glyphicon-save',
			message: text
		}, {
			z_index: 9999,
			type: 'success'
		});
	};

	$.growlErreur = function(text) {
		$.notify({
			icon: 'glyphicon glyphicon-exclamation-sign',
			message: text
		}, {
			z_index: 9999,
			type: 'danger'
		});
	};

	$.growlWarning = function(text) {
		$.notify({
			icon: 'glyphicon glyphicon-exclamation-sign',
			message: text
		}, {
			z_index: 9999,
			type: 'warning'
		});
	};
	
	$.api = function(mode, cmd, tab, typeSync) {

		var tmp = cmd.split('.');
		var urlFinal = 'type=' + tmp[0] + '&action=' + tmp[1];
		//gestion si pas d'arguments supplementaires
		tab = typeof tab !== 'undefined' ? tab : {};
		typeSync = typeof typeSync !== 'undefined' ? typeSync : true;

		urlFinal = 'ajax.php?sid=' + sessionToken + '&' + urlFinal;
		//var urlFinal = 'ajax.php?' + urlFinal;
		var jxhr =  $.ajax({
			url: urlFinal,
			type: mode,
			data: $.param(tab),
			async: typeSync
		}).error(function(e) {
			var msg = lang.error.communication + ' : ' + cmd;
			//console.log(e);
			$.growlErreur(msg);
		});
		//console.log(jxhr);
		jxhr.done(function(json){
			//console.log(json);
			if (!json.response){
				if(json.sessionToken === 'invalid') {
					$.growlErreur(lang.error.sessionEnded);
					setTimeout(function(){},2500);
					window.location.replace("index.php");
				}
			}
		});
		
		return jxhr;
	};

	
	

	$.validateDate = function(dtValue) {
		var dtRegex = new RegExp(/\b\d{1,2}[\/]\d{1,2}[\/]\d{4}\b/);
		return dtRegex.test(dtValue);
	};

	$.errorDate = function() {
		$.growlWarning(lang.error.date);
		return;
	};

	$.DecSepa = function(s) {
		return s.replace(".", ",");
	};

	Highcharts.setOptions({
		global: {
    		useUTC: true
    	},
		lang: {
			thousandsSep: lang.graphic.thousandsSep,
			decimalPoint: lang.graphic.decimalPoint,
			months: lang.graphic.months,
			shortMonths: lang.graphic.shortMonths,
			weekdays: lang.graphic.weekdays
		},
		credits: {
			enabled: true,
			text: 'OkoVision',
			href: 'http://okovision.dronek.com'
		}
	});


	$("#btlogin").click(function(e){
		var user = $('#inputUser').val();
		var pass = $('#inputPassword').val();
		
		if(user !== '' && pass !== ''){
		
			$.api('POST', 'admin.login', {user: user, pass: pass}, false).done(function(json) {
						
				if(!json.response){
					e.preventDefault();
					$.growlErreur(lang.error.userPassIncorrect);
				}
			});
		}
		
	});
	
	$("#btlogout").click(function(){
		
		$.api('GET', 'admin.logout',{},false).done(function(json) {
				if(json.response){
					window.location.replace("index.php");
				}
			
		});
	});
	
	$("#btChangePass").click(function(e){
		
		var pass 	= $('#inputPass').val();
		var confirm = $('#inputPassConfirm').val();
		
		if(pass !== '' && confirm !== ''){
			
			if(pass === confirm){
			
				$.api('POST', 'admin.changePassword', {pass: pass}).done(function(json) {
							
					if(!json.response){
						e.preventDefault();
						$.growlErreur(lang.error.passNotChanged);
					}
				});
			}else{
				e.preventDefault();
				$.growlErreur(lang.error.passNotTheSame);
			}
		}
		
	});


});