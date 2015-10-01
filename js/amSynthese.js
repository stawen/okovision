/*****************************************************
 * Projet : Okovision - Supervision chaudiere OeKofen
 * Auteur : Stawen Dronek
 * Utilisation commerciale interdite sans mon accord
 ******************************************************/
/* global lang */
$(document).ready(function() {

	

	/*
	 * Gestion onglet Calcul synthese
	 */
	


	function getDayWithoutSynthese() {
		$.api('GET', 'admin.getDayWithoutSynthese').done(function(json) {

			$("#inwork-synthese").hide();
			$("#listeDateWithoutSynthese> tbody").html("");
			$.each(json.data, function(key, val) {

				var jour = $.datepicker.formatDate('dd/mm/yy', $.datepicker.parseDate('yy-mm-dd', val.jour));

				$('#listeDateWithoutSynthese > tbody:last').append('<tr class="day"> \
					                                                            <td> ' + jour + '</a></td>\
					                                                            <td>  <button type="button" class="btn btn-default btday" data-day="' + val.jour + '" ><span class="glyphicon glyphicon-repeat" aria-hidden="true"></span></button></td> \
					                                                       </tr>');
			});

		});
	}

	$("body").on("click", ".btday", function(b) {
		makeSynthese($(this));
	});

	function makeSynthese(bt) {

		bt.find('span').switchClass('glyphicon-repeat', 'glyphicon-refresh glyphicon-spin', 0);

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
		CalculAll();
	});
	
	function CalculAll(){
		var row = $('.day').first()
        //console.log(row);
        var file = row.find("td:nth-child(1)").text()
        //console.log(file);
        
        if (file !== '' ){
        	row.find('span').switchClass('glyphicon-repeat', 'glyphicon-refresh glyphicon-spin', 0);
        	
            setTimeout(function(){
            	//console.log(row.find(".btday").data('day'));
            	$.api('GET', 'admin.makeSyntheseByDay',{date: row.find(".btday").data('day')},false).done();
                row.remove(); 
                CalculAll();
            },500);
            
        }else{
            $.growlValidate(lang.valid.summary);
			getDayWithoutSynthese();
        }
        
	}

	getDayWithoutSynthese();;
	
});