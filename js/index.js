$(document).ready(function() {

	/**************************************
	 **** Graphique ***********************
	 *************************************/
    function grapheWithTime(data, where, titre){
	
		var chart = new Highcharts.Chart({
			chart: {
				renderTo: where,
				type: 'spline',
				zoomType: 'x',
				panning: true,
				panKey: 'shift'
			},
			title: {
				text: titre
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
						text: '...',
					},
					min : 0 //,	max : 100
				}],
			credits: {
				enabled : true,
				text : 'OkoVision',
				href: 'http://okovision.dronek.com'
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
			series: data
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
				text : 'OkoVision',
				href: 'http://okovision.dronek.com'
			}
		});
	
	}
	
	/**************************************
	 **** Peuplement des graphiques *******
	 * ***********************************/
	function refreshAllGraphe(){
	    var jour = $.datepicker.formatDate('yy-mm-dd',$.datepicker.parseDate('dd/mm/yy', $( "#date_encours" ).val()));
	    
	    $.getJSON("ajax.php?type=rendu&action=getIndicByDay&jour=" + jour, function(json) {
					$( "#tcmax" ).text($.DecSepa(json.tcExtMax + " °C"));
					$( "#tcmin" ).text($.DecSepa(json.tcExtMin + " °C"));
					$( "#consoPellet" ).text($.DecSepa( ((json.consoPellet===null)?0.0:json.consoPellet) + " Kg"));
			})
			.error(function() { 
				$.growlErreur("Probleme lors de la recuperation des indicateurs");
			});	
	    
	    
	    $.each($(".graphique"), function (key, val){
	        
	        $.getJSON("ajax.php?type=rendu&action=getGrapheData&id="+ val.id +"&jour=" + jour, function(json) {
				grapheWithTime(json.grapheData,val.id,$("#"+val.id).data("graphename"));
				
			})
			.error(function() { 
				graphe_error(val.id,$("#"+val.id).data("graphename"));
				$.growlErreur("Probleme lors de la recuperation des données graphiques");
				
			});
		
	    });
	}
	
	/**************************************
	 **** EVENEMENT ***********************
	 * ***********************************/
	
	$( "#date_avant" ).click(function() {
		if($.validateDate($('#date_encours').val())){
			try{
				var newdate = $.datepicker.parseDate('dd/mm/yy', $( "#date_encours" ).val());
				newdate.setDate(newdate.getDate()-1);
		
				$( "#date_encours" ).val(
										$.datepicker.formatDate('dd/mm/yy', newdate)
									);
				refreshAllGraphe();	
				
			}catch(error){
        		$.errorDate();
        		return;
			}
		}else{
			$.errorDate();
 		}
		
						
	});
	
	$( "#date_apres" ).click(function() {
		if($.validateDate($('#date_encours').val())){
			try{
				var newdate = $.datepicker.parseDate('dd/mm/yy', $( "#date_encours" ).val());
				newdate.setDate(newdate.getDate()+1);
		
				$( "#date_encours" ).val(
										$.datepicker.formatDate('dd/mm/yy', newdate)
									);
				refreshAllGraphe();	
				
			}catch(error){
        		$.errorDate();
        		return;
			}
		}else{
			$.errorDate();
 		}
	});
	
	$( "#date_encours" ).change(function() {
		if($.validateDate($('#date_encours').val() ) ){
			refreshAllGraphe();
		}else{
			$.errorDate();
 		}
		
	});

	/**************************************
	 **** Attente preload *****************
	 * ***********************************/	
	
    $(document).ajaxStart(function () {
            $(".se-pre-con").fadeIn();
    });
      
    $(document).ajaxStop(function () {
            $(".se-pre-con").fadeOut();
    });	

 	/**************************************
	 **** Creation de la structure de la page 
	 ************************************/
	 
    $.getJSON("ajax.php?type=rendu&action=getGraphe", function(json) {
    
    				$.each(json.data, function(key, val) {
    					$('.container-graphe').append('<div class="page-header"> \
        				                       <div class="graphique" id="'+ val.id +'" data-graphename="'+ val.name+'" style="width:100%; height:400px;"></div> \
        				                        </div>');
    				});
    			    
    			})
    			.done(function() {
    			    refreshAllGraphe();
    			})
    			.error(function() {
    				$.growlErreur("Impossible de charger la liste des graphiques !!");
    			});
    
});