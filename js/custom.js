/*****************************************************
* Projet : Okovision - Supervision chaudiere OeKofen
* Auteur : Stawen Dronek
* Utilisation commerciale interdite sans mon accord
******************************************************/
$(document).ready(function() {

	$.growlValidate = function(text) {
		$.notify({
			icon: 'glyphicon glyphicon-save',
			message: text
		}, {
			z_index: 9999,
			type: 'success'
		});
	}

	$.growlErreur = function(text) {
		$.notify({
			icon: 'glyphicon glyphicon-exclamation-sign',
			message: text
		}, {
			z_index: 9999,
			type: 'danger'
		});
	}

	$.growlWarning = function(text) {
		$.notify({
			icon: 'glyphicon glyphicon-exclamation-sign',
			message: text
		}, {
			z_index: 9999,
			type: 'warning'
		});
	}
	
	
	function activeTab(){
	    var url = document.location.toString();
        if (url.match('#')) {
            $('.nav-tabs a[href=#'+url.split('#')[1]+']').tab('show') ;
        } 
    }
    
    // Change hash for page-reload
    $('.nav-tabs a').on('shown.bs.tab', function (e) {
    	//console.log("active tab:" + e.target.hash);
    	window.location.hash = e.target.hash;
    });
    
    
    
    $(window).on('hashchange', function() {
        activeTab();
    });
    
    activeTab();
    
    $.matriceComplet = function(){
    
    	var r = false;
    	$.ajax({
			url: 'ajax.php?type=admin&action=statusMatrice',
			type: 'GET',
			async: false,
			success: function(json) {
				//console.log(json);
				r =  json.response;
			},
            error: function () {
                $.growlErreur('Error  - Probleme lors de la sauvegarde !');
              }
		});
    	return r;
    	
    	
    }
    
    $.validateDate = function(dtValue){
		var dtRegex = new RegExp(/\b\d{1,2}[\/]\d{1,2}[\/]\d{4}\b/);
		return dtRegex.test(dtValue);
	}
	
	$.errorDate = function (){
		$.growlWarning("Format de la date incorrect");
        return;
	}
	
	$.DecSepa = function(s){
		return s.replace(".",",");
	}
	
	Highcharts.setOptions({
        lang: {
            thousandsSep: ' ',
            decimalPoint: ',',
    		months: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
    		shortMonths: [ "Jan" , "Feb" , "Mar" , "Avr" , "Mai" , "Juin" , "Juil" , "Aout" , "Sep" , "Oct" , "Nov" , "Dec"],
			weekdays: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
        },
		credits: {
			enabled : true,
			text : 'OkoVision',
			href: 'http://okovision.dronek.com'
		}
    });
		

    
	
});