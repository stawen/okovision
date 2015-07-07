

$(document).ready(function() {
	
	function grapheWithTime(json, where, titre){		
			
		var chart = new Highcharts.Chart({		
			chart: {		
				renderTo: where,		
				type: 'spline',		
				zoomType: 'x',		
				panning: true,		
				panKey: 'shift'		
			},		
			global: {		
                useUTC: false		
            },		
			title: {		
				text: titre		
			},		
			legend:{		
				align: 'right',		
				verticalAlign: 'middle',		
				layout: 'vertical'		
			},		
			xAxis: {		
				type: 'datetime',		
                dateTimeLabelFormats: { 		
                    minute: '%H:%M',		
                    hour: '%H:%M'		
                   		
                },		
				labels: {		
					rotation : -45,		
				},		
				title: {		
					text: 'Heures',		
				}		
			},		
			yAxis: [{		
					title: {		
						text: 'T°C',		
					},		
					min : 0 //,	max : 100		
				},{		
					title: {		
							text: 'ON/OFF'		
						},		
					opposite: true		
				}],		
			credits: {		
				enabled : true,		
				text : 'OkoVision'		
			},		
			plotOptions: {		
				spline: {		
					marker: {		
						enabled: false		
					}		
				}		
			},		
			tooltip: {		
                shared: true,		
                crosshairs: true		
            },		
			series: json		
		});		
	}
	
	function graphe_error(where,titre){
		var chart = new Highcharts.Chart({
			chart: {
				renderTo: where,
				type: 'line'
			},
			title: {
				text: titre
			},
			subtitle: {
				text: 'Problème lors de la récupération des données !'
			},
			credits: {
				enabled : true,
				text : 'OkoVision'
			}
		});
	
	}

	function DecSepa(s){
		return s.replace(".",",");
	}
	
	function generer_graphic()	{
	
		var titre_ecs = 'Eau chaude Sanitaire';	
		var div_ecs = 'ecs_graphic';	
		var titre_chauffage = 'Chauffage';	
		var div_chauffage = 'chauffage_graphic';	
		var titre_tempe = 'Température';	
		var div_tempe = 'temperature_graphic';
	
		
		var jour = $.datepicker.formatDate('yy-mm-dd',$.datepicker.parseDate('dd/mm/yy', $( "#date_encours" ).val()));
		//console.log(jour);
		
	   $.getJSON("ajax.php?type=ecs&date=" + jour, function(json) {
				//console.log('success');	
				grapheWithTime(json,div_ecs,titre_ecs);
				//console.log(json);
			})
			.error(function() { 
				//console.log('error');	
				graphe_error(div_ecs,titre_ecs);
				
			});
			
		$.getJSON("ajax.php?type=chauffage&date=" + jour, function(json) {
				//console.log('success');	
				grapheWithTime(json,div_chauffage,titre_chauffage);
				//console.log(json);
			})
			.error(function() { 
				//console.log('error');	
				graphe_error(div_chauffage,titre_chauffage);
				
			});
		$.getJSON("ajax.php?type=temperature&date=" + jour, function(json) {
				//console.log('success');	
				grapheWithTime(json,div_tempe,titre_tempe);
				//console.log(json);
			})
			.error(function() { 
				//console.log('error');	
				graphe_error(div_tempe,titre_tempe);
				
			});	
				
		$.getJSON("ajax.php?type=indicateur&date=" + jour, function(json) {
				console.log('success');	
				$.each(json,function(i,indic){
					//console.log(indic.Tc_ext_max + " °C");
					$( "#tcmax" ).text(DecSepa(indic.Tc_ext_max + " °C"));
					//console.log(indic.Tc_ext_min + " °C");
					$( "#tcmin" ).text(DecSepa(indic.Tc_ext_min + " °C"));
					//console.log(indic.conso + " Kg");
					$( "#consoPellet" ).text(DecSepa( ((indic.conso===null)?0.0:indic.conso) + " Kg"));
				});
				
			})
			.error(function() { 
				console.log('error');	
			});		
	}
	
	
	$( "#date_avant" ).click(function() {
		var newdate = $.datepicker.parseDate('dd/mm/yy', $( "#date_encours" ).val());
		newdate.setDate(newdate.getDate()-1);
		
		$( "#date_encours" ).val(
								$.datepicker.formatDate('dd/mm/yy', newdate)
							);
		generer_graphic();					
	});
	
	$( "#date_apres" ).click(function() {
		var newdate = $.datepicker.parseDate('dd/mm/yy', $( "#date_encours" ).val());
		newdate.setDate(newdate.getDate()+1);
		
		$( "#date_encours" ).val(
								$.datepicker.formatDate('dd/mm/yy', newdate)
							);
		generer_graphic();
	});
	
	$( "#date_encours" ).change(function() {
		//console.log('date change');
		generer_graphic();
	});
	
	
	/* Focntion de gestion d'affciage ou non des graphiques */
	$('#bt_ecs').click(function() {
		//console.log('ivi');
		if ($("#ecs_graphic").is(":hidden")) {
			$("#ecs_graphic").show();
			$("#txt_ecs").hide();
			$(this).children('span').attr("class", 'glyphicon glyphicon-minus-sign');
		}else{
			$("#ecs_graphic").hide();
			$("#txt_ecs").show();
			$(this).children('span').attr("class", 'glyphicon glyphicon-plus-sign');
		}
	});
	
	$('#bt_chauffage').click(function() {
		//console.log('ivi');
		if ($("#chauffage_graphic").is(":hidden")) {
			$("#chauffage_graphic").show();
			$("#txt_chauffage").hide();
			$(this).children('span').attr("class", 'glyphicon glyphicon-minus-sign');
		}else{
			$("#chauffage_graphic").hide();
			$("#txt_chauffage").show();
			$(this).children('span').attr("class", 'glyphicon glyphicon-plus-sign');
		}
	});
	
	$('#bt_tc').click(function() {
		//console.log('ivi');
		if ($("#temperature_graphic").is(":hidden")) {
			$("#temperature_graphic").show();
			$("#txt_tc").hide();
			$(this).children('span').attr("class", 'glyphicon glyphicon-minus-sign');
		}else{
			$("#temperature_graphic").hide();
			$("#txt_tc").show();
			$(this).children('span').attr("class", 'glyphicon glyphicon-plus-sign');
		}
	});
	
	$(document).ajaxStart(function () {		
            $(".se-pre-con").fadeIn();		
    });		
      		
    $(document).ajaxStop(function () {		
            $(".se-pre-con").fadeOut();		
    });	
	
	generer_graphic();

});
  
