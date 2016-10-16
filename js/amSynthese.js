/*****************************************************
 * Projet : Okovision - Supervision chaudiere OeKofen
 * Auteur : Stawen Dronek
 * Utilisation commerciale interdite sans mon accord
 ******************************************************/
/* global lang, $ */
$(document).ready(function() {

	

	/*
	 * Gestion onglet Calcul synthese
	 */
	function addSyntheseRow(srcDay){
		var jour = $.datepicker.formatDate('dd/mm/yy', srcDay);
		var dataDay = $.datepicker.formatDate('yy-mm-dd', srcDay);
		
		$('#listeDateWithoutSynthese > tbody:last').append('<tr class="day"> \
		                                                     <td> ' + jour + '</a></td>\
		                                                     <td>  <button type="button" class="btn btn-default btday" data-day="' + dataDay + '" ><span class="glyphicon glyphicon-repeat" aria-hidden="true"></span></button></td> \
		                                                    </tr>');
	}


	function getDayWithoutSynthese() {
		$.api('GET', 'admin.getDayWithoutSynthese').done(function(json) {

			$("#inwork-synthese").hide();
			$("#listeDateWithoutSynthese> tbody").html("");
			
			$.each(json.data, function(key, val) {
				 addSyntheseRow( $.datepicker.parseDate('yy-mm-dd', val.jour) );
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
		var row = $('.day').first();
        //console.log(row);
        var file = row.find("td:nth-child(1)").text();
        //console.log(file);
        
        if (file !== '' ){
        	row.find('span').switchClass('glyphicon-repeat', 'glyphicon-refresh glyphicon-spin', 0);
        	
            setTimeout(function(){
            	//console.log(row.find(".btday").data('day'));
            	$.api('GET', 'admin.makeSyntheseByDay',{date: row.find(".btday").data('day')},false).done();
                row.remove(); 
                CalculAll();
            },400);
            
        }else{
            $.growlValidate(lang.valid.summary);
			getDayWithoutSynthese();
        }
        
	}
	
	$( "#dateEnd"   ).datepicker({ maxDate: -1});
	$( "#dateStart" ).datepicker({ maxDate: -1});
	
	$('#modal_getPeriode').on('show.bs.modal', function() {
		$( "#dateStart" ).val("");
		$( "#dateEnd"   ).val("");
			
	});
	
	$("#confirmPeriode").click(function() {
		if ($.validateDate($('#modal_getPeriode').find('#dateStart').val()) && $.validateDate($('#modal_getPeriode').find('#dateEnd').val())) {
			
			var dateStart,dateEnd;
			try {
				dateStart = new Date($.datepicker.parseDate('dd/mm/yy', $('#modal_getPeriode').find('#dateStart').val()) ); 
				dateEnd = new Date($.datepicker.parseDate('dd/mm/yy', $('#modal_getPeriode').find('#dateEnd').val()) );
			}catch (error) {
				$.growlWarning(lang.error.date);
				return;
			}
			var diff = (dateEnd - dateStart) / 1000 / 60 / 60 / 24; // days
			
			if(diff < 0){
				$.growlWarning(lang.error.dateInvert);
				return;
			}
			
			$("#listeDateWithoutSynthese> tbody").html("");
			
			for(var i=0; i <= diff; i++){
				var day = new Date(dateStart);
				day.setDate(dateStart.getDate()+i);  
				addSyntheseRow(day);
			}
			
			$('#modal_getPeriode').modal('hide');
		}
		else {
			$.growlWarning(lang.error.date);
		}
	});
	
	getDayWithoutSynthese();
	
});